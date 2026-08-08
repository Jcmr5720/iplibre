/**
 * Analizador de registros DMARC (RFC 7489). Parte pura y testable.
 */

export type DmarcPolicy = "none" | "quarantine" | "reject";
export type DmarcStatus = "ok" | "warning" | "missing" | "invalid";

export type DmarcObservationTone = "success" | "warning" | "danger" | "info";
export interface DmarcObservation {
  tone: DmarcObservationTone;
  text: string;
}

export interface DmarcAnalysis {
  status: DmarcStatus;
  found: boolean;
  record: string | null;
  policy: DmarcPolicy | null;
  subdomainPolicy: DmarcPolicy | null;
  pct: number | null;
  rua: string[];
  ruf: string[];
  adkim: string | null;
  aspf: string | null;
  fo: string | null;
  tags: Record<string, string>;
  observations: DmarcObservation[];
}

const POLICY_VALUES = new Set(["none", "quarantine", "reject"]);

function parseTags(record: string): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const part of record.split(";")) {
    const [k, ...v] = part.split("=");
    const key = k.trim().toLowerCase();
    if (!key) continue;
    tags[key] = v.join("=").trim();
  }
  return tags;
}

export function findDmarcRecord(txt: string[]): string | null {
  const records = txt.map((r) => r.trim()).filter((r) => /^v=DMARC1(\s|;|$)/i.test(r));
  return records[0] ?? null;
}

export function parseDmarc(txt: string[]): DmarcAnalysis {
  const record = findDmarcRecord(txt);
  const observations: DmarcObservation[] = [];

  if (!record) {
    return {
      status: "missing",
      found: false,
      record: null,
      policy: null,
      subdomainPolicy: null,
      pct: null,
      rua: [],
      ruf: [],
      adkim: null,
      aspf: null,
      fo: null,
      tags: {},
      observations: [
        {
          tone: "warning",
          text: "No se encontró un registro DMARC en _dmarc del dominio. Sin DMARC, no se indican políticas ni informes ante fallos de SPF/DKIM.",
        },
      ],
    };
  }

  const tags = parseTags(record);
  const policyRaw = tags["p"]?.toLowerCase();
  const policy = policyRaw && POLICY_VALUES.has(policyRaw) ? (policyRaw as DmarcPolicy) : null;
  const spRaw = tags["sp"]?.toLowerCase();
  const subdomainPolicy = spRaw && POLICY_VALUES.has(spRaw) ? (spRaw as DmarcPolicy) : null;
  const pctRaw = tags["pct"];
  const pct = pctRaw !== undefined && /^\d+$/.test(pctRaw) ? Number(pctRaw) : null;
  const rua = (tags["rua"] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const ruf = (tags["ruf"] ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  let status: DmarcStatus = "ok";

  if (!policy) {
    observations.push({
      tone: "danger",
      text: "El registro DMARC no incluye una política p= válida (none, quarantine o reject).",
    });
    status = "invalid";
  } else if (policy === "reject") {
    observations.push({
      tone: "success",
      text: "p=reject: se solicita rechazar los mensajes que fallen DMARC. Es la política más protectora.",
    });
  } else if (policy === "quarantine") {
    observations.push({
      tone: "success",
      text: "p=quarantine: los mensajes que fallen DMARC se marcan como sospechosos (normalmente van a spam).",
    });
  } else if (policy === "none") {
    observations.push({
      tone: "info",
      text: "p=none permite recopilar información mediante informes, pero no ordena rechazar los mensajes que fallen DMARC. Es un buen punto de partida, no la política final.",
    });
    status = "warning";
  }

  if (pct !== null && pct < 100 && policy && policy !== "none") {
    observations.push({
      tone: "warning",
      text: `pct=${pct}: la política solo se aplica a ese porcentaje del correo. El resto se trata con una política menos estricta.`,
    });
  }

  if (rua.length === 0 && policy === "none") {
    observations.push({
      tone: "warning",
      text: "p=none sin dirección de informes (rua): no se aprovecha la principal ventaja de este modo, que es recibir informes agregados.",
    });
  }

  return {
    status,
    found: true,
    record,
    policy,
    subdomainPolicy,
    pct,
    rua,
    ruf,
    adkim: tags["adkim"] ?? null,
    aspf: tags["aspf"] ?? null,
    fo: tags["fo"] ?? null,
    tags,
    observations,
  };
}
