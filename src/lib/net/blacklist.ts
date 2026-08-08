/**
 * Utilidades para consultas a listas de reputación (DNSBL / RBL).
 * Parte pura y testable: normalización de IP, construcción del nombre de
 * consulta e interpretación de la respuesta. La consulta DNS real vive en
 * `@/lib/providers/blacklist`.
 *
 * Una DNSBL responde con una dirección 127.0.0.x cuando la IP está listada, y
 * con NXDOMAIN cuando no lo está. Algunas listas devuelven 127.255.255.x para
 * indicar que la consulta se rechazó (p. ej. desde resolutores públicos): eso
 * NO significa "listada", sino que la lista no respondió de forma útil.
 */
import { isIPv4 } from "@/lib/net/ip";

export interface Dnsbl {
  zone: string;
  name: string;
  /** URL de referencia/retirada de la lista. */
  info?: string;
}

/**
 * Listas públicas ampliamente utilizadas que admiten consultas DNS directas.
 * Se evitan deliberadamente listas con restricciones de uso incompatibles o que
 * exigen registro/clave para consultas programáticas.
 */
export const DNSBLS: Dnsbl[] = [
  { zone: "zen.spamhaus.org", name: "Spamhaus ZEN", info: "https://check.spamhaus.org/" },
  { zone: "bl.spamcop.net", name: "SpamCop", info: "https://www.spamcop.net/bl.shtml" },
  { zone: "dnsbl.sorbs.net", name: "SORBS", info: "http://www.sorbs.net/" },
  { zone: "b.barracudacentral.org", name: "Barracuda", info: "https://www.barracudacentral.org/rbl" },
  { zone: "psbl.surriel.com", name: "PSBL", info: "https://psbl.org/" },
  { zone: "dnsbl-1.uceprotect.net", name: "UCEPROTECT L1", info: "https://www.uceprotect.net/" },
  { zone: "bl.blocklist.de", name: "blocklist.de", info: "https://www.blocklist.de/" },
  { zone: "all.s5h.net", name: "s5h.net", info: "https://all.s5h.net/" },
  { zone: "spam.dnsbl.anonmails.de", name: "Anonmails", info: "https://anonmails.de/dnsbl.php" },
  { zone: "dnsbl.dronebl.org", name: "DroneBL", info: "https://dronebl.org/" },
  { zone: "z.mailspike.net", name: "Mailspike Z", info: "https://mailspike.org/" },
  { zone: "cbl.abuseat.org", name: "CBL (abuseat)", info: "https://www.abuseat.org/" },
];

/** Invierte los octetos de una IPv4 para la consulta DNSBL (1.2.3.4 → 4.3.2.1). */
export function reverseIpv4(ip: string): string | null {
  if (!isIPv4(ip)) return null;
  return ip.split(".").reverse().join(".");
}

/** Construye el nombre a consultar: `<ip-invertida>.<zona>`. */
export function dnsblQueryName(ip: string, zone: string): string | null {
  const rev = reverseIpv4(ip);
  if (!rev) return null;
  return `${rev}.${zone}`;
}

/** ¿La dirección de respuesta indica "rechazo/uso indebido" (127.255.255.x)? */
export function isRefusalResponse(addr: string): boolean {
  return /^127\.255\.255\.\d+$/.test(addr);
}

export type BlacklistOutcome = "listed" | "clean" | "error";

export interface DnsblResult {
  zone: string;
  name: string;
  outcome: BlacklistOutcome;
  /** Direcciones 127.0.0.x devueltas cuando está listada. */
  responses: string[];
  /** Motivo cuando outcome === "error". */
  detail?: string;
  info?: string;
}

/**
 * Interpreta el resultado crudo de una consulta a una zona:
 *  - direcciones 127.0.0.x válidas → listed
 *  - direcciones 127.255.255.x → error (consulta rechazada por la lista)
 *  - NXDOMAIN (addresses vacío, notFound) → clean
 *  - cualquier otro fallo → error
 */
export function interpretDnsbl(
  list: Dnsbl,
  raw: { addresses: string[] | null; notFound: boolean; errorCode?: string },
): DnsblResult {
  const base = { zone: list.zone, name: list.name, info: list.info };
  if (raw.addresses && raw.addresses.length > 0) {
    const refusals = raw.addresses.filter(isRefusalResponse);
    const listings = raw.addresses.filter((a) => !isRefusalResponse(a));
    if (listings.length > 0) {
      return { ...base, outcome: "listed", responses: listings };
    }
    // Solo respuestas de rechazo: la lista no respondió de forma útil.
    return {
      ...base,
      outcome: "error",
      responses: refusals,
      detail: "La lista rechazó la consulta (posible resolutor no admitido).",
    };
  }
  if (raw.notFound) {
    return { ...base, outcome: "clean", responses: [] };
  }
  return {
    ...base,
    outcome: "error",
    responses: [],
    detail: raw.errorCode ? `La lista no respondió (${raw.errorCode}).` : "La lista no respondió.",
  };
}

export type BlacklistState = "clean" | "listed" | "incomplete";

export interface BlacklistSummary {
  ip: string;
  state: BlacklistState;
  stateLabel: string;
  listedCount: number;
  cleanCount: number;
  errorCount: number;
  total: number;
  results: DnsblResult[];
  checkedAt: string;
}

/** Agrega los resultados individuales en un veredicto general y honesto. */
export function summarizeBlacklist(ip: string, results: DnsblResult[]): BlacklistSummary {
  const listedCount = results.filter((r) => r.outcome === "listed").length;
  const cleanCount = results.filter((r) => r.outcome === "clean").length;
  const errorCount = results.filter((r) => r.outcome === "error").length;

  let state: BlacklistState;
  let stateLabel: string;
  if (listedCount > 0) {
    state = "listed";
    stateLabel = `Aparece en ${listedCount} lista${listedCount === 1 ? "" : "s"}`;
  } else if (errorCount > 0 && cleanCount === 0) {
    state = "incomplete";
    stateLabel = "Resultado incompleto";
  } else if (errorCount > 0) {
    state = "clean";
    stateLabel = "Sin coincidencias detectadas";
  } else {
    state = "clean";
    stateLabel = "Sin coincidencias detectadas";
  }

  // Ordena: listadas primero, luego errores, luego limpias.
  const order: Record<BlacklistOutcome, number> = { listed: 0, error: 1, clean: 2 };
  const sorted = [...results].sort((a, b) => order[a.outcome] - order[b.outcome]);

  return {
    ip,
    state,
    stateLabel,
    listedCount,
    cleanCount,
    errorCount,
    total: results.length,
    results: sorted,
    checkedAt: new Date().toISOString(),
  };
}
