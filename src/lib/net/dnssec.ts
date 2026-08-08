/**
 * DNSSEC: parseo de registros DS/DNSKEY y clasificación del estado de la cadena
 * de confianza (parte pura y testable, sin acceso a red).
 *
 * DNSSEC añade autenticidad criptográfica a las respuestas DNS. Su ausencia no
 * significa por sí sola que un dominio sea inseguro o malicioso.
 */

/** Algoritmos DNSSEC (RFC 8624). */
const DNSSEC_ALGORITHMS: Record<number, string> = {
  1: "RSA/MD5 (obsoleto)",
  3: "DSA/SHA-1",
  5: "RSA/SHA-1",
  6: "DSA-NSEC3-SHA1",
  7: "RSASHA1-NSEC3-SHA1",
  8: "RSA/SHA-256",
  10: "RSA/SHA-512",
  12: "GOST R 34.10-2001",
  13: "ECDSA P-256/SHA-256",
  14: "ECDSA P-384/SHA-384",
  15: "Ed25519",
  16: "Ed448",
};

/** Tipos de digest para DS (RFC 3658 / 4509 / 6605). */
const DS_DIGEST_TYPES: Record<number, string> = {
  1: "SHA-1",
  2: "SHA-256",
  3: "GOST R 34.11-94",
  4: "SHA-384",
};

export function algorithmName(algo: number): string {
  return DNSSEC_ALGORITHMS[algo] ?? `Algoritmo ${algo}`;
}

export function digestTypeName(dt: number): string {
  return DS_DIGEST_TYPES[dt] ?? `Tipo ${dt}`;
}

export interface DnskeyRecord {
  flags: number;
  protocol: number;
  algorithm: number;
  algorithmName: string;
  /** 257 = KSK (clave de firma de claves), 256 = ZSK (clave de firma de zona). */
  role: "KSK" | "ZSK" | "otro";
  publicKey: string;
}

export interface DsRecord {
  keyTag: number;
  algorithm: number;
  algorithmName: string;
  digestType: number;
  digestTypeName: string;
  digest: string;
}

/**
 * Parsea el RDATA de un DNSKEY tal como lo devuelve DoH:
 *   "<flags> <protocol> <algorithm> <base64PublicKey>"
 */
export function parseDnskey(data: string): DnskeyRecord | null {
  const parts = data.trim().split(/\s+/);
  if (parts.length < 4) return null;
  const flags = Number(parts[0]);
  const protocol = Number(parts[1]);
  const algorithm = Number(parts[2]);
  if (![flags, protocol, algorithm].every(Number.isFinite)) return null;
  const publicKey = parts.slice(3).join("");
  const role = flags === 257 ? "KSK" : flags === 256 ? "ZSK" : "otro";
  return { flags, protocol, algorithm, algorithmName: algorithmName(algorithm), role, publicKey };
}

/**
 * Parsea el RDATA de un DS tal como lo devuelve DoH:
 *   "<keyTag> <algorithm> <digestType> <digestHex>"
 */
export function parseDs(data: string): DsRecord | null {
  const parts = data.trim().split(/\s+/);
  if (parts.length < 4) return null;
  const keyTag = Number(parts[0]);
  const algorithm = Number(parts[1]);
  const digestType = Number(parts[2]);
  if (![keyTag, algorithm, digestType].every(Number.isFinite)) return null;
  const digest = parts.slice(3).join("").toUpperCase();
  return {
    keyTag,
    algorithm,
    algorithmName: algorithmName(algorithm),
    digestType,
    digestTypeName: digestTypeName(digestType),
    digest,
  };
}

export type DnssecState =
  | "active-validated"
  | "signed-unvalidated"
  | "validation-failure"
  | "absent"
  | "unknown";

export interface DnssecInput {
  hasDnskey: boolean;
  hasDs: boolean;
  /** El resolutor validante marcó la respuesta como autenticada (flag AD). */
  authenticated: boolean;
  /**
   * Falla la validación: el resolutor devuelve error con validación activa pero
   * responde correctamente con la validación desactivada (CD=1). Señal de zona
   * "bogus" (firmas rotas o desincronizadas).
   */
  bogus: boolean;
}

export interface DnssecClassification {
  state: DnssecState;
  label: string;
  detail: string;
}

const STATE_LABELS: Record<DnssecState, string> = {
  "active-validated": "DNSSEC activo y validado",
  "signed-unvalidated": "DNSSEC configurado (sin validar)",
  "validation-failure": "DNSSEC con posible problema",
  absent: "DNSSEC no detectado",
  unknown: "No se pudo determinar",
};

/** Clasifica el estado DNSSEC a partir de las señales recogidas. */
export function classifyDnssec(input: DnssecInput): DnssecClassification {
  const { hasDnskey, hasDs, authenticated, bogus } = input;
  let state: DnssecState;
  let detail: string;

  if (bogus) {
    state = "validation-failure";
    detail =
      "El dominio está firmado, pero un resolutor validante rechaza sus respuestas. Suele indicar firmas caducadas o una cadena de confianza rota.";
  } else if (hasDs && hasDnskey && authenticated) {
    state = "active-validated";
    detail =
      "El dominio tiene delegación firmada (DS) y claves (DNSKEY), y un resolutor validante autentica sus respuestas.";
  } else if (hasDnskey && authenticated) {
    state = "active-validated";
    detail =
      "La zona está firmada (DNSKEY) y un resolutor validante autentica sus respuestas.";
  } else if (hasDnskey || hasDs) {
    state = "signed-unvalidated";
    detail =
      "Se detectan registros DNSSEC, pero no se pudo confirmar la validación completa de la cadena de confianza desde aquí.";
  } else {
    state = "absent";
    detail =
      "No se detectaron registros DNSSEC (DS/DNSKEY). DNSSEC añade autenticidad a las respuestas DNS, pero su ausencia no significa por sí sola que el sitio sea inseguro o malicioso.";
  }

  return { state, label: STATE_LABELS[state], detail };
}
