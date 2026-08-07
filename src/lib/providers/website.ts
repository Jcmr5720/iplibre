/**
 * Comprobación real del estado de un sitio web, con protección SSRF.
 *
 * Metodología:
 *  1. Se normaliza la URL (esquema http/https).
 *  2. Antes de cada petición se resuelve el host y se verifica que sea público
 *     (assertPublicHost). Tras cada redirección se revalida el nuevo destino.
 *  3. Se siguen las redirecciones manualmente (máximo MAX_REDIRECTS) para poder
 *     revalidar cada salto y contar/mostrar la cadena.
 *  4. No se lee el cuerpo de la respuesta (solo estado, cabeceras y tiempos):
 *     esto acota la memoria y evita convertir la plataforma en un proxy.
 */
import { assertPublicHost, SsrfError } from "@/lib/net/ssrf";
import { normalizeWebUrl } from "@/lib/net/url";
import { classifyStatus, overallFromStatus, statusText } from "@/lib/net/httpStatus";

const MAX_REDIRECTS = 8;
const TIMEOUT_MS = 10_000;

export interface RedirectHop {
  from: string;
  to: string;
  status: number;
}

export interface WebsiteStatusResult {
  input: string;
  finalUrl: string;
  protocol: string;
  httpsAvailable: boolean;
  status: number;
  statusText: string;
  statusClass: string;
  state: "up" | "warning" | "down";
  stateLabel: string;
  stateDetail: string;
  reachable: boolean;
  responseMs: number;
  redirected: boolean;
  redirectCount: number;
  redirectChain: RedirectHop[];
  server?: string;
  contentType?: string;
  contentLength?: number;
  ipAddresses: string[];
  checkedAt: string;
}

export type FollowErrorKind = "ssrf" | "dns" | "tls" | "timeout" | "connection" | "input";

export type WebsiteCheckOutcome =
  | { ok: true; data: WebsiteStatusResult }
  | { ok: false; error: string; kind: FollowErrorKind };

export interface FollowResult {
  finalUrl: string;
  res: Response;
  status: number;
  redirectChain: RedirectHop[];
  ipAddresses: string[];
  startedAt: number;
}

export type FollowOutcome =
  | { ok: true; data: FollowResult }
  | { ok: false; error: string; kind: FollowErrorKind };

function headerNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Sigue las redirecciones de forma segura (revalidando SSRF en cada salto) y
 * devuelve la Response final con sus cabeceras intactas. Reutilizado por el
 * estado web y por el analizador de headers de seguridad.
 */
export async function followRedirectsSafely(rawInput: string): Promise<FollowOutcome> {
  const norm = normalizeWebUrl(rawInput);
  if (!norm.ok) return { ok: false, error: norm.error, kind: "input" };

  let currentUrl = norm.url;
  const redirectChain: RedirectHop[] = [];
  let ipAddresses: string[] = [];
  const started = Date.now();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(currentUrl);

    // Revalidación SSRF en cada salto (incluye el destino de las redirecciones).
    try {
      ipAddresses = await assertPublicHost(parsed.hostname);
    } catch (err) {
      if (err instanceof SsrfError) return { ok: false, error: err.message, kind: "ssrf" };
      return { ok: false, error: "No se pudo resolver el dominio.", kind: "dns" };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "IPLibre/1.0 (+https://iplibre.online)",
          accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        },
      });
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (err instanceof DOMException && err.name === "AbortError") {
        return { ok: false, error: "El servidor tardó demasiado en responder.", kind: "timeout" };
      }
      if (msg.includes("certificate") || msg.includes("tls") || msg.includes("ssl")) {
        return { ok: false, error: "El sitio tiene un problema con su certificado TLS.", kind: "tls" };
      }
      if (msg.includes("enotfound") || msg.includes("dns")) {
        return { ok: false, error: "No se pudo resolver el dominio (DNS).", kind: "dns" };
      }
      return { ok: false, error: "No se pudo establecer conexión con el servidor.", kind: "connection" };
    }
    clearTimeout(timer);

    const status = res.status;
    const isRedirect =
      classifyStatus(status) === "redirect" && res.headers.has("location") && hop < MAX_REDIRECTS;

    if (isRedirect) {
      const location = res.headers.get("location") as string;
      let next: string;
      try {
        next = new URL(location, currentUrl).toString();
      } catch {
        return {
          ok: true,
          data: { finalUrl: currentUrl, res, status, redirectChain, ipAddresses, startedAt: started },
        };
      }
      redirectChain.push({ from: currentUrl, to: next, status });
      currentUrl = next;
      continue;
    }

    return {
      ok: true,
      data: { finalUrl: currentUrl, res, status, redirectChain, ipAddresses, startedAt: started },
    };
  }

  return { ok: false, error: "Demasiadas redirecciones.", kind: "connection" };
}

export async function checkWebsite(rawInput: string): Promise<WebsiteCheckOutcome> {
  const outcome = await followRedirectsSafely(rawInput);
  if (!outcome.ok) return outcome;
  const { finalUrl, res, status, redirectChain, ipAddresses, startedAt } = outcome.data;
  const parsed = new URL(finalUrl);
  const overall = overallFromStatus(status);
  return {
    ok: true,
    data: {
      input: rawInput,
      finalUrl,
      protocol: parsed.protocol.replace(":", ""),
      httpsAvailable: parsed.protocol === "https:",
      status,
      statusText: statusText(status),
      statusClass: classifyStatus(status),
      state: overall.state,
      stateLabel: overall.label,
      stateDetail: overall.detail,
      reachable: true,
      responseMs: Date.now() - startedAt,
      redirected: redirectChain.length > 0,
      redirectCount: redirectChain.length,
      redirectChain,
      server: res.headers.get("server") ?? undefined,
      contentType: res.headers.get("content-type") ?? undefined,
      contentLength: headerNumber(res.headers.get("content-length")),
      ipAddresses,
      checkedAt: new Date().toISOString(),
    },
  };
}
