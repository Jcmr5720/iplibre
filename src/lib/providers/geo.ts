/**
 * Geolocalización e información de red de una IP.
 * Capa de proveedores intercambiables con degradación en cadena:
 *   1) ipwho.is   (HTTPS, sin clave)
 *   2) ipapi.co   (HTTPS, sin clave, límite gratuito)
 * Si el primero falla, se prueba el siguiente. Nunca lanza si algún
 * proveedor responde.
 */
import { fetchJson } from "@/lib/http";
import { ipVersion } from "@/lib/net/ip";
import type { GeoInfo } from "@/lib/providers/types";

type Provider = {
  name: string;
  lookup: (ip: string) => Promise<GeoInfo>;
};

function num(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : undefined;
}

async function ipwhois(ip: string): Promise<GeoInfo> {
  const target = ip ? encodeURIComponent(ip) : "";
  const url = `https://ipwho.is/${target}`;
  const raw = await fetchJson<Record<string, unknown>>(url, { timeoutMs: 7000, retries: 1 });
  if (raw.success === false) {
    throw new Error(typeof raw.message === "string" ? raw.message : "IP no encontrada");
  }
  const conn = (raw.connection as Record<string, unknown>) || {};
  const tz = (raw.timezone as Record<string, unknown>) || {};
  const resolvedIp = String(raw.ip || ip);
  return {
    ip: resolvedIp,
    version: ipVersion(resolvedIp),
    type: typeof raw.type === "string" ? raw.type : undefined,
    isp: typeof conn.isp === "string" ? conn.isp : undefined,
    org: typeof conn.org === "string" ? conn.org : undefined,
    asn: num(conn.asn),
    asnOrg: typeof conn.org === "string" ? conn.org : undefined,
    country: typeof raw.country === "string" ? raw.country : undefined,
    countryCode: typeof raw.country_code === "string" ? raw.country_code : undefined,
    region: typeof raw.region === "string" ? raw.region : undefined,
    city: typeof raw.city === "string" ? raw.city : undefined,
    postal: typeof raw.postal === "string" ? raw.postal : undefined,
    timezone: typeof tz.id === "string" ? tz.id : undefined,
    utcOffset: typeof tz.utc === "string" ? tz.utc : undefined,
    latitude: num(raw.latitude),
    longitude: num(raw.longitude),
    flagEmoji:
      raw.flag && typeof raw.flag === "object"
        ? ((raw.flag as Record<string, unknown>).emoji as string)
        : undefined,
    source: "ipwho.is",
    fetchedAt: new Date().toISOString(),
  };
}

async function ipapico(ip: string): Promise<GeoInfo> {
  const url = ip
    ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
    : "https://ipapi.co/json/";
  const raw = await fetchJson<Record<string, unknown>>(url, { timeoutMs: 7000 });
  if (raw.error) {
    throw new Error(typeof raw.reason === "string" ? raw.reason : "Consulta rechazada");
  }
  const resolvedIp = String(raw.ip || ip);
  const asnStr = typeof raw.asn === "string" ? raw.asn.replace(/^AS/i, "") : undefined;
  return {
    ip: resolvedIp,
    version: ipVersion(resolvedIp),
    type: typeof raw.version === "string" ? raw.version : undefined,
    isp: typeof raw.org === "string" ? raw.org : undefined,
    org: typeof raw.org === "string" ? raw.org : undefined,
    asn: asnStr ? num(asnStr) : undefined,
    asnOrg: typeof raw.org === "string" ? raw.org : undefined,
    country: typeof raw.country_name === "string" ? raw.country_name : undefined,
    countryCode: typeof raw.country_code === "string" ? raw.country_code : undefined,
    region: typeof raw.region === "string" ? raw.region : undefined,
    city: typeof raw.city === "string" ? raw.city : undefined,
    postal: typeof raw.postal === "string" ? raw.postal : undefined,
    timezone: typeof raw.timezone === "string" ? raw.timezone : undefined,
    utcOffset: typeof raw.utc_offset === "string" ? raw.utc_offset : undefined,
    latitude: num(raw.latitude),
    longitude: num(raw.longitude),
    source: "ipapi.co",
    fetchedAt: new Date().toISOString(),
  };
}

const providers: Provider[] = [
  { name: "ipwho.is", lookup: ipwhois },
  { name: "ipapi.co", lookup: ipapico },
];

/**
 * Resuelve la geolocalización probando cada proveedor en orden.
 * @param ip IP a consultar. Si es cadena vacía, se consulta la IP del servidor
 *           saliente (solo útil como respaldo; para la IP del visitante se
 *           usan las cabeceras de la petición).
 */
export async function lookupGeo(ip: string): Promise<GeoInfo> {
  const errors: string[] = [];
  for (const provider of providers) {
    try {
      return await provider.lookup(ip);
    } catch (err) {
      errors.push(`${provider.name}: ${err instanceof Error ? err.message : "error"}`);
    }
  }
  throw new Error(`Ningún proveedor de geolocalización respondió (${errors.join("; ")})`);
}

export const geoProviderNames = providers.map((p) => p.name);
