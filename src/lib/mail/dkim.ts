/**
 * Analizador de registros DKIM (RFC 6376). Parte pura y testable.
 *
 * DKIM requiere un selector (p. ej. selector1, google, default). No es posible
 * conocer automáticamente todos los selectores de un dominio, por lo que esta
 * función recibe los TXT ya consultados en `<selector>._domainkey.<dominio>`.
 */

export type DkimStatus = "ok" | "warning" | "missing" | "invalid";

export type DkimObservationTone = "success" | "warning" | "danger" | "info";
export interface DkimObservation {
  tone: DkimObservationTone;
  text: string;
}

export interface DkimAnalysis {
  status: DkimStatus;
  found: boolean;
  selector: string;
  record: string | null;
  version: string | null;
  keyType: string | null;
  publicKey: string | null;
  hashAlgorithms: string[];
  flags: string[];
  serviceTypes: string[];
  tags: Record<string, string>;
  observations: DkimObservation[];
}

function parseTags(record: string): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const part of record.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim();
    if (key) tags[key] = value;
  }
  return tags;
}

export function findDkimRecord(txt: string[]): string | null {
  // Un registro DKIM válido contiene p= (clave pública) y normalmente v=DKIM1.
  const records = txt
    .map((r) => r.trim())
    .filter((r) => /(^|;|\s)v=DKIM1/i.test(r) || /(^|;|\s)p=/i.test(r));
  return records[0] ?? null;
}

export function parseDkim(txt: string[], selector: string): DkimAnalysis {
  const record = findDkimRecord(txt);
  const observations: DkimObservation[] = [];

  if (!record) {
    return {
      status: "missing",
      found: false,
      selector,
      record: null,
      version: null,
      keyType: null,
      publicKey: null,
      hashAlgorithms: [],
      flags: [],
      serviceTypes: [],
      tags: {},
      observations: [
        {
          tone: "warning",
          text: `No se encontró un registro DKIM en el selector «${selector}». Comprueba que el selector sea correcto: cada proveedor usa el suyo.`,
        },
      ],
    };
  }

  const tags = parseTags(record);
  const publicKey = tags["p"] ?? null;
  const hashAlgorithms = (tags["h"] ?? "").split(":").map((s) => s.trim()).filter(Boolean);
  const flags = (tags["t"] ?? "").split(":").map((s) => s.trim()).filter(Boolean);
  const serviceTypes = (tags["s"] ?? "").split(":").map((s) => s.trim()).filter(Boolean);

  let status: DkimStatus = "ok";

  if (publicKey === null) {
    observations.push({
      tone: "danger",
      text: "El registro no contiene clave pública (p=). No es un registro DKIM válido.",
    });
    status = "invalid";
  } else if (publicKey === "") {
    observations.push({
      tone: "danger",
      text: "La clave pública está vacía (p=): el registro DKIM está revocado.",
    });
    status = "invalid";
  } else {
    observations.push({
      tone: "success",
      text: "Se encontró una clave pública DKIM válida para este selector.",
    });
  }

  if (flags.includes("y")) {
    observations.push({
      tone: "info",
      text: "El flag t=y indica modo de prueba: los fallos DKIM no deberían penalizarse mientras esté activo.",
    });
    if (status === "ok") status = "warning";
  }

  return {
    status,
    found: true,
    selector,
    record,
    version: tags["v"] ?? null,
    keyType: tags["k"] ?? "rsa",
    publicKey,
    hashAlgorithms,
    flags,
    serviceTypes,
    tags,
    observations,
  };
}

/** Selectores comunes que se ofrecen solo como ejemplos de entrada manual. */
export const COMMON_DKIM_SELECTORS = [
  "google",
  "selector1",
  "selector2",
  "default",
  "dkim",
  "k1",
  "mail",
  "s1",
] as const;
