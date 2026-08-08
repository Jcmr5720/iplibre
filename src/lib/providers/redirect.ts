/**
 * Traza la cadena de redirecciones HTTP de una URL, de forma manual y segura.
 *
 * Seguridad (reutiliza y refuerza la protección SSRF de IPLibre):
 *  - Solo esquemas http/https (normalizeWebUrl rechaza file:, ftp:, data:, …).
 *  - Antes de CADA salto se resuelve el host y se verifica que ninguna IP sea
 *    privada/reservada/loopback (assertPublicHost). No se confía en el host
 *    inicial: cada Location se revalida.
 *  - Se sigue la redirección manualmente (redirect: "manual"), con un máximo
 *    razonable de saltos y detección de bucles.
 *  - No se lee el cuerpo de la respuesta: solo estado, cabeceras y tiempos.
 *  - Se usa HEAD y, si el servidor no lo admite, se reintenta con GET.
 *
 * Limitación conocida (documentada): existe una ventana TOCTOU entre nuestra
 * resolución DNS y la que hace `fetch` (posible DNS rebinding). Para una
 * herramienta pública de diagnóstico que nunca devuelve el cuerpo ni expone
 * servicios internos, el riesgo es aceptable.
 */
import { assertPublicHost, DnsResolutionError, SsrfError } from "@/lib/net/ssrf";
import { normalizeWebUrl } from "@/lib/net/url";
import { classifyStatus, statusText } from "@/lib/net/httpStatus";
import { canonicalForLoop, isLoop, isRedirectStatus, redirectType } from "@/lib/net/redirect";

export const MAX_REDIRECTS = 10;
const TIMEOUT_MS = 10_000;

export interface RedirectHop {
  index: number;
  url: string;
  method: "HEAD" | "GET";
  status: number;
  statusText: string;
  statusClass: string;
  redirectKind?: string;
  redirectLabel?: string;
  location?: string;
  resolvedLocation?: string;
  https: boolean;
  responseMs: number;
  ipAddresses: string[];
}

export interface RedirectTrace {
  input: string;
  initialUrl: string;
  finalUrl: string;
  finalStatus: number;
  finalStatusText: string;
  hops: RedirectHop[];
  redirectCount: number;
  totalMs: number;
  loopDetected: boolean;
  tooMany: boolean;
  startedHttp: boolean;
  endedHttps: boolean;
  upgradedToHttps: boolean;
  downgradedToHttp: boolean;
  checkedAt: string;
}

export type RedirectErrorKind = "ssrf" | "dns" | "tls" | "timeout" | "connection" | "input";

export type RedirectOutcome =
  | { ok: true; data: RedirectTrace }
  | { ok: false; error: string; kind: RedirectErrorKind };

function mapFetchError(err: unknown): { error: string; kind: RedirectErrorKind } {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  if (err instanceof DOMException && err.name === "AbortError") {
    return { error: "El servidor tardó demasiado en responder.", kind: "timeout" };
  }
  if (msg.includes("certificate") || msg.includes("tls") || msg.includes("ssl")) {
    return { error: "El sitio tiene un problema con su certificado TLS.", kind: "tls" };
  }
  if (msg.includes("enotfound") || msg.includes("dns")) {
    return { error: "No se pudo resolver el dominio (DNS).", kind: "dns" };
  }
  return { error: "No se pudo establecer conexión con el servidor.", kind: "connection" };
}

async function requestOnce(url: string, method: "HEAD" | "GET"): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": "IPLibre/1.0 (+https://iplibre.online)",
        accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function traceRedirects(rawInput: string): Promise<RedirectOutcome> {
  const norm = normalizeWebUrl(rawInput);
  if (!norm.ok) return { ok: false, error: norm.error, kind: "input" };

  const hops: RedirectHop[] = [];
  const visited: string[] = [];
  let currentUrl = norm.url;
  const initialUrl = norm.url;
  const startedHttp = new URL(initialUrl).protocol === "http:";
  const started = Date.now();
  let loopDetected = false;
  let tooMany = false;

  for (let index = 0; index <= MAX_REDIRECTS; index++) {
    const parsed = new URL(currentUrl);

    // Revalidación SSRF en cada salto.
    let ipAddresses: string[];
    try {
      ipAddresses = await assertPublicHost(parsed.hostname);
    } catch (err) {
      if (err instanceof SsrfError) return { ok: false, error: err.message, kind: "ssrf" };
      if (err instanceof DnsResolutionError) return { ok: false, error: err.message, kind: "dns" };
      return { ok: false, error: "No se pudo resolver el dominio.", kind: "dns" };
    }

    visited.push(canonicalForLoop(currentUrl));

    // HEAD y, si no se admite, GET.
    const hopStart = Date.now();
    let method: "HEAD" | "GET" = "HEAD";
    let res: Response;
    try {
      res = await requestOnce(currentUrl, method);
      if (res.status === 405 || res.status === 501) {
        method = "GET";
        res = await requestOnce(currentUrl, method);
      }
    } catch (err) {
      const mapped = mapFetchError(err);
      return { ok: false, ...mapped };
    }
    const responseMs = Date.now() - hopStart;

    const status = res.status;
    const isRedirect = isRedirectStatus(status) && res.headers.has("location");
    const location = isRedirect ? (res.headers.get("location") ?? undefined) : undefined;
    let resolvedLocation: string | undefined;
    if (location) {
      try {
        resolvedLocation = new URL(location, currentUrl).toString();
      } catch {
        resolvedLocation = undefined;
      }
    }
    const rType = isRedirect ? redirectType(status) : undefined;

    hops.push({
      index,
      url: currentUrl,
      method,
      status,
      statusText: statusText(status),
      statusClass: classifyStatus(status),
      redirectKind: rType?.kind,
      redirectLabel: rType?.label,
      location,
      resolvedLocation,
      https: parsed.protocol === "https:",
      responseMs,
      ipAddresses,
    });

    // Fin de la cadena: no es redirección o no hay Location válido.
    if (!isRedirect || !resolvedLocation) break;

    // Detección de bucle.
    if (isLoop(visited, resolvedLocation)) {
      loopDetected = true;
      break;
    }

    // Límite de saltos.
    if (index === MAX_REDIRECTS) {
      tooMany = true;
      break;
    }

    currentUrl = resolvedLocation;
  }

  const last = hops[hops.length - 1];
  const finalUrl = last.url;
  const endedHttps = new URL(finalUrl).protocol === "https:";

  return {
    ok: true,
    data: {
      input: rawInput,
      initialUrl,
      finalUrl,
      finalStatus: last.status,
      finalStatusText: last.statusText,
      hops,
      redirectCount: hops.filter((h) => isRedirectStatus(h.status)).length,
      totalMs: Date.now() - started,
      loopDetected,
      tooMany,
      startedHttp,
      endedHttps,
      upgradedToHttps: startedHttp && endedHttps,
      downgradedToHttp: !startedHttp && !endedHttps && new URL(initialUrl).protocol === "https:",
      checkedAt: new Date().toISOString(),
    },
  };
}
