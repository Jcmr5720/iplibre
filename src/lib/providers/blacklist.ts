/**
 * Consulta real a listas de reputación (DNSBL) mediante DNS-over-HTTPS.
 *
 * Se usa DoH (en lugar de resolución UDP directa) por robustez y coherencia con
 * el resto de IPLibre: funciona igual en local y en el entorno serverless de
 * Vercel, sin depender del resolutor del sistema. Una DNSBL publica un registro
 * A `127.0.0.x` para las IP listadas y responde NXDOMAIN para las no listadas.
 *
 * Interpretación honesta:
 *  - 127.0.0.x → listada.
 *  - 127.255.255.x → la lista rechazó la consulta (no cuenta como listada).
 *  - NXDOMAIN → limpia.
 *  - Cualquier otro estado/fallo → sin respuesta (no se asume "limpia").
 *
 * Nota: al consultar a través de un resolutor público, algunas listas (p. ej.
 * Spamhaus) devuelven respuestas de rechazo. Esos casos se marcan como "sin
 * respuesta", nunca como falsos negativos.
 */
import { fetchWithTimeout } from "@/lib/http";
import {
  DNSBLS,
  dnsblQueryName,
  interpretDnsbl,
  summarizeBlacklist,
  type Dnsbl,
  type DnsblResult,
  type BlacklistSummary,
} from "@/lib/net/blacklist";

const DOH = "https://dns.google/resolve";
const PER_QUERY_TIMEOUT_MS = 6000;
const CONCURRENCY = 6;

interface DohAnswer {
  type: number;
  data: string;
}
interface DohJson {
  Status: number;
  Answer?: DohAnswer[];
}

async function queryZone(ip: string, list: Dnsbl): Promise<DnsblResult> {
  const name = dnsblQueryName(ip, list.zone);
  if (!name) {
    return interpretDnsbl(list, { addresses: null, notFound: false, errorCode: "IP no válida" });
  }
  try {
    const res = await fetchWithTimeout(`${DOH}?name=${encodeURIComponent(name)}&type=A`, {
      timeoutMs: PER_QUERY_TIMEOUT_MS,
      headers: { accept: "application/dns-json" },
    });
    if (!res.ok) {
      return interpretDnsbl(list, { addresses: null, notFound: false, errorCode: `HTTP ${res.status}` });
    }
    const json = (await res.json()) as DohJson;
    if (json.Status === 3) {
      // NXDOMAIN: la IP no está en la lista.
      return interpretDnsbl(list, { addresses: null, notFound: true });
    }
    if (json.Status !== 0) {
      return interpretDnsbl(list, { addresses: null, notFound: false, errorCode: `rcode ${json.Status}` });
    }
    const addresses = (json.Answer ?? []).filter((a) => a.type === 1).map((a) => a.data);
    if (addresses.length === 0) {
      // NOERROR sin respuestas A: se trata como no listada.
      return interpretDnsbl(list, { addresses: null, notFound: true });
    }
    return interpretDnsbl(list, { addresses, notFound: false });
  } catch (err) {
    const code = err instanceof Error && err.name === "AbortError" ? "timeout" : "error";
    return interpretDnsbl(list, { addresses: null, notFound: false, errorCode: code });
  }
}

/** Ejecuta las consultas con un pool de concurrencia acotada. */
async function runPool(ip: string, lists: Dnsbl[]): Promise<DnsblResult[]> {
  const results: DnsblResult[] = new Array(lists.length);
  let cursor = 0;
  async function worker() {
    while (cursor < lists.length) {
      const index = cursor++;
      results[index] = await queryZone(ip, lists[index]);
    }
  }
  const workers = Array.from({ length: Math.min(CONCURRENCY, lists.length) }, worker);
  await Promise.all(workers);
  return results;
}

/**
 * Comprueba una IPv4 pública en las listas configuradas.
 * Quien llama debe garantizar que `ip` es una IPv4 pública válida.
 */
export async function checkBlacklists(ip: string): Promise<BlacklistSummary> {
  const results = await runPool(ip, DNSBLS);
  return summarizeBlacklist(ip, results);
}

export { DNSBLS };
