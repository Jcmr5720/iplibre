/**
 * Comprobación DNSSEC real mediante DNS-over-HTTPS.
 *
 * Metodología:
 *  1. Se consultan DNSKEY (claves de la zona) y DS (delegación firmada en el
 *     padre) del dominio.
 *  2. Se consulta un registro (SOA) con un resolutor validante y se lee el flag
 *     AD (Authenticated Data): indica que el resolutor validó la firma.
 *  3. Para distinguir una zona "bogus" (firmas rotas) de una simplemente no
 *     firmada, si la consulta validante devuelve SERVFAIL se repite con CD=1
 *     (validación desactivada). Si con CD=1 responde bien, la validación fallaba.
 *
 * Se usa Google DoH porque expone el flag AD y admite el parámetro CD.
 */
import { fetchWithTimeout } from "@/lib/http";
import {
  classifyDnssec,
  parseDnskey,
  parseDs,
  type DnskeyRecord,
  type DnssecClassification,
  type DsRecord,
} from "@/lib/net/dnssec";

const DOH = "https://dns.google/resolve";
const TYPE_NUM: Record<string, number> = { A: 1, SOA: 6, DS: 43, DNSKEY: 48 };

interface DohAnswer {
  type: number;
  data: string;
}
interface DohJson {
  Status: number;
  AD?: boolean;
  Answer?: DohAnswer[];
}

const RCODE: Record<number, string> = {
  0: "NOERROR",
  2: "SERVFAIL",
  3: "NXDOMAIN",
  5: "REFUSED",
};

async function doh(name: string, type: string, cd = false): Promise<DohJson> {
  const url = `${DOH}?name=${encodeURIComponent(name)}&type=${type}${cd ? "&cd=1" : ""}`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: 7000,
    retries: 1,
    headers: { accept: "application/dns-json" },
  });
  if (!res.ok) throw new Error(`El resolutor DNS respondió ${res.status}`);
  return (await res.json()) as DohJson;
}

function answersOfType(json: DohJson, type: string): DohAnswer[] {
  const num = TYPE_NUM[type];
  return (json.Answer ?? []).filter((a) => a.type === num);
}

export interface DnssecResult {
  domain: string;
  classification: DnssecClassification;
  hasDnskey: boolean;
  hasDs: boolean;
  authenticated: boolean;
  bogus: boolean;
  soaStatus: string;
  dnskeys: DnskeyRecord[];
  ds: DsRecord[];
  checkedAt: string;
}

export async function checkDnssec(domain: string): Promise<DnssecResult> {
  const [dnskeyJson, dsJson, soaJson] = await Promise.all([
    doh(domain, "DNSKEY"),
    doh(domain, "DS"),
    doh(domain, "SOA"),
  ]);

  const dnskeys = answersOfType(dnskeyJson, "DNSKEY")
    .map((a) => parseDnskey(a.data))
    .filter((r): r is DnskeyRecord => r !== null);
  const ds = answersOfType(dsJson, "DS")
    .map((a) => parseDs(a.data))
    .filter((r): r is DsRecord => r !== null);

  const hasDnskey = dnskeys.length > 0;
  const hasDs = ds.length > 0;
  const authenticated = Boolean(soaJson.AD);
  const soaStatus = RCODE[soaJson.Status] ?? `CODE_${soaJson.Status}`;

  // Detección de zona "bogus": SERVFAIL con validación, pero OK con CD=1.
  let bogus = false;
  if (soaJson.Status === 2 && (hasDnskey || hasDs)) {
    try {
      const cd = await doh(domain, "SOA", true);
      if (cd.Status === 0) bogus = true;
    } catch {
      /* si falla el cross-check, no afirmamos bogus */
    }
  }

  const classification = classifyDnssec({ hasDnskey, hasDs, authenticated, bogus });

  return {
    domain,
    classification,
    hasDnskey,
    hasDs,
    authenticated,
    bogus,
    soaStatus,
    dnskeys,
    ds,
    checkedAt: new Date().toISOString(),
  };
}
