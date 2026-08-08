/**
 * Analizador de registros SPF (Sender Policy Framework), RFC 7208.
 * Parte pura y testable: recibe los registros TXT ya obtenidos.
 */

export type SpfQualifier = "+" | "-" | "~" | "?";

export interface SpfMechanism {
  qualifier: SpfQualifier;
  type: string; // all, include, a, mx, ip4, ip6, ptr, exists
  value?: string;
  /** El mecanismo provoca una búsqueda DNS (cuenta para el límite de 10). */
  causesLookup: boolean;
}

export type SpfObservationTone = "success" | "warning" | "danger" | "info";
export interface SpfObservation {
  tone: SpfObservationTone;
  text: string;
}

export type SpfStatus = "ok" | "warning" | "missing" | "invalid";

export interface SpfAnalysis {
  status: SpfStatus;
  found: boolean;
  record: string | null;
  multipleRecords: boolean;
  mechanisms: SpfMechanism[];
  includes: string[];
  ip4: string[];
  ip6: string[];
  allQualifier: SpfQualifier | null;
  allPolicy: string | null;
  redirect: string | null;
  exp: string | null;
  /** Nº de mecanismos que provocan búsquedas DNS (límite RFC = 10). */
  dnsLookups: number;
  observations: SpfObservation[];
}

const LOOKUP_TYPES = new Set(["include", "a", "mx", "ptr", "exists"]);

function allPolicyLabel(q: SpfQualifier): string {
  switch (q) {
    case "-":
      return "Rechazo estricto (-all)";
    case "~":
      return "Fallo suave (~all)";
    case "?":
      return "Neutral (?all)";
    case "+":
      return "Permitir todo (+all)";
  }
}

/** Encuentra los registros SPF (que empiezan por v=spf1) entre los TXT. */
export function findSpfRecords(txt: string[]): string[] {
  return txt.map((r) => r.trim()).filter((r) => /^v=spf1(\s|$)/i.test(r));
}

export function parseSpf(txt: string[]): SpfAnalysis {
  const records = findSpfRecords(txt);
  const observations: SpfObservation[] = [];

  if (records.length === 0) {
    return {
      status: "missing",
      found: false,
      record: null,
      multipleRecords: false,
      mechanisms: [],
      includes: [],
      ip4: [],
      ip6: [],
      allQualifier: null,
      allPolicy: null,
      redirect: null,
      exp: null,
      dnsLookups: 0,
      observations: [
        { tone: "warning", text: "No se encontró ningún registro SPF (v=spf1) en el dominio." },
      ],
    };
  }

  const multipleRecords = records.length > 1;
  const record = records[0];
  if (multipleRecords) {
    observations.push({
      tone: "danger",
      text: "Hay más de un registro SPF. Según el RFC, esto invalida SPF: debe existir un único registro v=spf1.",
    });
  }

  const terms = record.split(/\s+/).slice(1); // descarta v=spf1
  const mechanisms: SpfMechanism[] = [];
  const includes: string[] = [];
  const ip4: string[] = [];
  const ip6: string[] = [];
  let allQualifier: SpfQualifier | null = null;
  let redirect: string | null = null;
  let exp: string | null = null;
  let dnsLookups = 0;

  for (const term of terms) {
    if (!term) continue;
    // Modificadores tienen la forma nombre=valor.
    const modMatch = /^([a-z]+)=(.+)$/i.exec(term);
    if (modMatch && (modMatch[1].toLowerCase() === "redirect" || modMatch[1].toLowerCase() === "exp")) {
      if (modMatch[1].toLowerCase() === "redirect") {
        redirect = modMatch[2];
        dnsLookups += 1;
      } else {
        exp = modMatch[2];
      }
      continue;
    }

    const qMatch = /^([+\-~?])?(.*)$/.exec(term)!;
    const qualifier = (qMatch[1] as SpfQualifier) || "+";
    const rest = qMatch[2];
    const [typeRaw, ...valueParts] = rest.split(":");
    const type = typeRaw.toLowerCase();
    const value = valueParts.join(":") || undefined;

    const causesLookup = LOOKUP_TYPES.has(type);
    if (causesLookup) dnsLookups += 1;
    if (type === "include" && value) includes.push(value);
    if (type === "ip4" && value) ip4.push(value);
    if (type === "ip6" && value) ip6.push(value);
    if (type === "all") allQualifier = qualifier;

    mechanisms.push({ qualifier, type, value, causesLookup });
  }

  // Observaciones sobre la política.
  if (allQualifier) {
    if (allQualifier === "-") {
      observations.push({
        tone: "success",
        text: "-all indica una política estricta: los servidores no autorizados se rechazan.",
      });
    } else if (allQualifier === "~") {
      observations.push({
        tone: "info",
        text: "~all (softfail) marca el correo no autorizado como sospechoso, pero no ordena rechazarlo.",
      });
    } else if (allQualifier === "?") {
      observations.push({
        tone: "warning",
        text: "?all (neutral) no expresa ninguna política: apenas aporta protección.",
      });
    } else if (allQualifier === "+") {
      observations.push({
        tone: "danger",
        text: "+all permite que cualquier servidor envíe en nombre del dominio. Es una configuración insegura.",
      });
    }
  } else if (!redirect) {
    observations.push({
      tone: "warning",
      text: "El registro no termina en un mecanismo all ni usa redirect: la política queda indefinida.",
    });
  }

  if (dnsLookups > 10) {
    observations.push({
      tone: "danger",
      text: `El registro provoca ${dnsLookups} búsquedas DNS. El RFC 7208 limita SPF a 10; por encima, SPF puede fallar (PermError).`,
    });
  } else if (dnsLookups >= 8) {
    observations.push({
      tone: "warning",
      text: `El registro provoca ${dnsLookups} búsquedas DNS, cerca del límite de 10 del RFC.`,
    });
  }

  let status: SpfStatus;
  if (multipleRecords) status = "invalid";
  else if (allQualifier === "+" || dnsLookups > 10) status = "warning";
  else if (allQualifier === "-" || allQualifier === "~") status = "ok";
  else status = "warning";

  return {
    status,
    found: true,
    record,
    multipleRecords,
    mechanisms,
    includes,
    ip4,
    ip6,
    allQualifier,
    allPolicy: allQualifier ? allPolicyLabel(allQualifier) : null,
    redirect,
    exp,
    dnsLookups,
    observations,
  };
}
