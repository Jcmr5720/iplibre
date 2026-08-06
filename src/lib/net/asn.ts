/**
 * Validación y normalización de números de Sistema Autónomo (ASN).
 * Acepta "AS15169", "as15169" o "15169". Rango válido: 0 – 4294967295 (32 bits).
 */

const MAX_ASN = 4294967295;

export type AsnResult =
  | { ok: true; asn: number; label: string }
  | { ok: false; error: string };

export function normalizeAsn(raw: string): AsnResult {
  if (typeof raw !== "string") return { ok: false, error: "ASN no válido" };
  const cleaned = raw.trim().toUpperCase().replace(/^AS/, "");
  if (!/^\d+$/.test(cleaned)) {
    return { ok: false, error: "El ASN debe ser un número (p. ej. AS15169)" };
  }
  const asn = Number(cleaned);
  if (!Number.isInteger(asn) || asn < 0 || asn > MAX_ASN) {
    return { ok: false, error: "ASN fuera de rango" };
  }
  return { ok: true, asn, label: `AS${asn}` };
}

export function isAsnInput(raw: string): boolean {
  return normalizeAsn(raw).ok;
}
