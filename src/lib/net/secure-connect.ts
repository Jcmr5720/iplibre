/**
 * Cliente HTTP endurecido contra SSRF y DNS rebinding (TOCTOU).
 *
 * Problema que resuelve:
 *   El patrón habitual "resolver DNS → validar IP → fetch(hostname)" vuelve a
 *   resolver el nombre dentro de `fetch`, abriendo una ventana en la que el DNS
 *   podría devolver una IP distinta (privada) entre la validación y la conexión.
 *
 * Estrategia (sin dependencias externas; solo node:http/https/dns/net):
 *   1. Resolvemos nosotros el hostname a TODAS sus IP.
 *   2. Validamos que NINGUNA sea privada/reservada (si una lo es, se bloquea).
 *   3. Fijamos (pin) una IP aprobada y forzamos la conexión a ella mediante un
 *      `lookup` personalizado que NUNCA vuelve a resolver el nombre.
 *   4. Conservamos el hostname original como `servername` (SNI) y cabecera Host,
 *      y mantenemos `rejectUnauthorized: true` (validación TLS y de identidad).
 *   5. En cada redirección se repite el proceso (revalidación por salto).
 *
 * No se desactiva la verificación del certificado ni se ignora el hostname
 * mismatch. No convierte el servicio en proxy: no reexpone el cuerpo salvo un
 * límite estricto para quien lo necesite, con timeouts.
 */
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { promises as dns } from "node:dns";
import { isIP, isPrivateOrReservedIp } from "@/lib/net/ip";
import { SsrfError, DnsResolutionError } from "@/lib/net/ssrf";

const USER_AGENT = "IPLibre/1.0 (+https://iplibre.online)";
const DEFAULT_ACCEPT = "text/html,application/xhtml+xml,*/*;q=0.8";

export interface ApprovedAddress {
  address: string;
  family: 4 | 6;
}

/** Resolutor de host → lista de IP. Inyectable para pruebas deterministas. */
export type HostLookup = (hostname: string) => Promise<{ address: string; family: number }[]>;

const defaultLookup: HostLookup = (host) => dns.lookup(host, { all: true, verbatim: true });

/**
 * Resuelve un hostname (o IP literal) y devuelve SOLO direcciones públicas.
 * Lanza SsrfError si el destino ya es —o resuelve a— una IP privada/reservada,
 * y DnsResolutionError si no se puede resolver. Valida TODAS las IP resultantes:
 * si cualquiera es interna, se rechaza el conjunto entero.
 */
export async function resolvePublicAddresses(
  hostname: string,
  lookup: HostLookup = defaultLookup,
): Promise<ApprovedAddress[]> {
  const host = hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) throw new SsrfError("Host vacío.");

  if (isIP(host)) {
    if (isPrivateOrReservedIp(host)) {
      throw new SsrfError("No se permiten destinos hacia direcciones internas o reservadas.");
    }
    return [{ address: host, family: host.includes(":") ? 6 : 4 }];
  }

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new SsrfError("No se permiten destinos locales.");
  }

  let records: { address: string; family: number }[];
  try {
    records = await lookup(host);
  } catch {
    throw new DnsResolutionError();
  }
  if (!records.length) throw new DnsResolutionError("El dominio no tiene direcciones IP.");

  for (const { address } of records) {
    if (isPrivateOrReservedIp(address)) {
      throw new SsrfError("El dominio resuelve a una dirección interna o reservada.");
    }
  }
  return records.map((r) => ({ address: r.address, family: r.family === 6 ? 6 : 4 }));
}

/**
 * `lookup` personalizado que devuelve SIEMPRE la IP aprobada, ignorando el
 * hostname recibido. Así la librería HTTP no puede volver a resolver el nombre
 * ni conectarse a una IP distinta de la validada (defensa contra rebinding).
 */
export function pinnedLookup(pick: ApprovedAddress): net.LookupFunction {
  const fn = (
    _hostname: string,
    options: unknown,
    callback: (err: NodeJS.ErrnoException | null, address: unknown, family?: number) => void,
  ) => {
    const wantsAll = typeof options === "object" && options !== null && (options as { all?: boolean }).all;
    if (wantsAll) {
      callback(null, [{ address: pick.address, family: pick.family }]);
    } else {
      callback(null, pick.address, pick.family);
    }
  };
  return fn as unknown as net.LookupFunction;
}

export type SecureErrorKind = "ssrf" | "dns" | "tls" | "timeout" | "connection" | "input" | "too-large";

export class SecureRequestError extends Error {
  constructor(
    message: string,
    public kind: SecureErrorKind,
  ) {
    super(message);
    this.name = "SecureRequestError";
  }
}

export interface SecureRequestOptions {
  method?: "GET" | "HEAD";
  timeoutMs?: number;
  /** Máximo de bytes a leer del cuerpo. 0 = no leer cuerpo (solo cabeceras). */
  maxBodyBytes?: number;
  headers?: Record<string, string>;
}

export interface SecureResponse {
  status: number;
  headers: Headers;
  location?: string;
  ip: string;
  family: 4 | 6;
  bodyText?: string;
  truncated: boolean;
}

function toHeaders(h: http.IncomingHttpHeaders): Headers {
  const out = new Headers();
  for (const [k, v] of Object.entries(h)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) for (const item of v) out.append(k, item);
    else out.set(k, v);
  }
  return out;
}

function classifyError(err: NodeJS.ErrnoException): SecureRequestError {
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  if (msg === "timeout" || code === "ETIMEDOUT") {
    return new SecureRequestError("El servidor tardó demasiado en responder.", "timeout");
  }
  const tlsCodes = [
    "CERT_HAS_EXPIRED",
    "ERR_TLS_CERT_ALTNAME_INVALID",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    "SELF_SIGNED_CERT_IN_CHAIN",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "ERR_TLS_HANDSHAKE_TIMEOUT",
    "CERT_NOT_YET_VALID",
  ];
  if (tlsCodes.includes(code) || msg.includes("certificate") || msg.includes("altname")) {
    return new SecureRequestError("El sitio tiene un problema con su certificado TLS.", "tls");
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return new SecureRequestError("No se pudo resolver el dominio (DNS).", "dns");
  }
  return new SecureRequestError("No se pudo establecer conexión con el servidor.", "connection");
}

/**
 * Realiza UNA petición (sin seguir redirecciones), conectándose a la IP validada
 * y conservando el hostname para SNI/Host. Revalida el destino en cada llamada.
 */
export async function secureRequest(rawUrl: string, opts: SecureRequestOptions = {}): Promise<SecureResponse> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SecureRequestError("URL no válida.", "input");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SecureRequestError("Solo se admiten http y https.", "input");
  }

  let approved: ApprovedAddress[];
  try {
    approved = await resolvePublicAddresses(url.hostname);
  } catch (err) {
    if (err instanceof SsrfError) throw new SecureRequestError(err.message, "ssrf");
    throw new SecureRequestError("No se pudo resolver el dominio.", "dns");
  }
  const pick = approved[0];

  const isHttps = url.protocol === "https:";
  const mod = isHttps ? https : http;
  const method = opts.method ?? "GET";
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const maxBodyBytes = opts.maxBodyBytes ?? 0;

  return await new Promise<SecureResponse>((resolve, reject) => {
    const req = mod.request(
      url,
      {
        method,
        lookup: pinnedLookup(pick),
        // SNI + validación de identidad contra el hostname real (solo https).
        servername: isHttps ? url.hostname : undefined,
        // rejectUnauthorized se mantiene en true por defecto (no se desactiva).
        headers: {
          host: url.host,
          "user-agent": USER_AGENT,
          accept: opts.headers?.accept ?? DEFAULT_ACCEPT,
          ...opts.headers,
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const headers = toHeaders(res.headers);
        const location = typeof res.headers.location === "string" ? res.headers.location : undefined;
        const base = { status, headers, location, ip: pick.address, family: pick.family };

        if (maxBodyBytes <= 0) {
          res.resume(); // drena y descarta el cuerpo
          res.destroy();
          resolve({ ...base, truncated: false });
          return;
        }

        let received = 0;
        let truncated = false;
        const chunks: Buffer[] = [];
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve({ ...base, bodyText: Buffer.concat(chunks).toString("utf8"), truncated });
        };
        res.on("data", (c: Buffer) => {
          received += c.length;
          if (received <= maxBodyBytes) {
            chunks.push(c);
          } else {
            truncated = true;
            res.destroy();
            finish();
          }
        });
        res.on("end", finish);
        res.on("close", finish);
      },
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }));
    });
    req.on("error", (err: NodeJS.ErrnoException) => reject(classifyError(err)));
    req.end();
  });
}
