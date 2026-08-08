/**
 * Comprobación real del estado de un sitio web, endurecida contra SSRF y DNS
 * rebinding.
 *
 * Metodología:
 *  1. Se normaliza la URL (esquema http/https).
 *  2. Cada petición usa el cliente `secureRequest`, que resuelve el host,
 *     valida TODAS sus IP, FIJA una IP pública aprobada para la conexión y
 *     conserva el hostname para SNI/Host (sin re-resolver ni desactivar TLS).
 *  3. Se siguen las redirecciones manualmente (máximo MAX_REDIRECTS),
 *     revalidando cada salto con el mismo cliente.
 *  4. No se lee el cuerpo de la respuesta (solo estado, cabeceras y tiempos):
 *     esto acota la memoria y evita convertir la plataforma en un proxy.
 */
import { secureRequest, SecureRequestError, type SecureResponse } from "@/lib/net/secure-connect";
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
  res: SecureResponse;
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
    // El cliente resuelve, valida TODAS las IP, fija la aprobada y conserva el
    // hostname para SNI/Host. Revalidación efectiva en cada salto.
    let res: SecureResponse;
    try {
      res = await secureRequest(currentUrl, { method: "GET", timeoutMs: TIMEOUT_MS, maxBodyBytes: 0 });
    } catch (err) {
      if (err instanceof SecureRequestError) {
        const kind: FollowErrorKind =
          err.kind === "too-large" ? "connection" : (err.kind as FollowErrorKind);
        return { ok: false, error: err.message, kind };
      }
      return { ok: false, error: "No se pudo establecer conexión con el servidor.", kind: "connection" };
    }

    ipAddresses = [res.ip];
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
