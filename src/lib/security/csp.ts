/**
 * Análisis básico (no exhaustivo) de una Content-Security-Policy.
 * Detecta patrones potencialmente débiles pero NO declara una web vulnerable:
 * clasifica cada hallazgo como observación, advertencia o error.
 */

export type CspSeverity = "error" | "warning" | "note";

export interface CspFinding {
  severity: CspSeverity;
  message: string;
}

export interface CspAnalysis {
  present: boolean;
  directives: Record<string, string[]>;
  hasDefaultSrc: boolean;
  findings: CspFinding[];
}

export function parseCsp(value: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const part of value.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [name, ...values] = trimmed.split(/\s+/);
    if (!name) continue;
    out[name.toLowerCase()] = values;
  }
  return out;
}

export function analyzeCsp(value: string | null | undefined): CspAnalysis {
  if (!value) {
    return { present: false, directives: {}, hasDefaultSrc: false, findings: [] };
  }
  const directives = parseCsp(value);
  const findings: CspFinding[] = [];
  const hasDefaultSrc = "default-src" in directives;

  const fetchDirectives = Object.entries(directives).filter(([k]) => k.endsWith("-src"));
  const allValues = fetchDirectives.flatMap(([, v]) => v.map((x) => x.toLowerCase()));

  if (!hasDefaultSrc && !("script-src" in directives)) {
    findings.push({
      severity: "warning",
      message: "Sin default-src ni script-src: la política puede ser permisiva por defecto.",
    });
  } else if (!hasDefaultSrc) {
    findings.push({
      severity: "note",
      message: "No hay default-src; se confía en directivas específicas por recurso.",
    });
  }

  if (allValues.includes("'unsafe-inline'")) {
    findings.push({
      severity: "warning",
      message: "Uso de 'unsafe-inline': reduce la protección frente a XSS.",
    });
  }
  if (allValues.includes("'unsafe-eval'")) {
    findings.push({
      severity: "warning",
      message: "Uso de 'unsafe-eval': permite evaluación dinámica de código.",
    });
  }
  // Comodines amplios en orígenes (http: / https: / * a secas).
  const broadWildcard = allValues.some((v) => v === "*" || v === "http:" || v === "https:");
  if (broadWildcard) {
    findings.push({
      severity: "warning",
      message: "Comodín amplio de orígenes (* o esquema completo) en alguna directiva.",
    });
  }

  if ("frame-ancestors" in directives) {
    findings.push({
      severity: "note",
      message: "Define frame-ancestors: control moderno de framing (sustituye a X-Frame-Options).",
    });
  }
  if (findings.length === 0) {
    findings.push({ severity: "note", message: "No se detectaron patrones débiles habituales." });
  }

  return { present: true, directives, hasDefaultSrc, findings };
}

/** ¿La CSP restringe el framing con frame-ancestors? (para no penalizar la falta de XFO). */
export function cspRestrictsFraming(value: string | null | undefined): boolean {
  if (!value) return false;
  const d = parseCsp(value);
  const fa = d["frame-ancestors"];
  if (!fa) return false;
  // Se considera restrictivo salvo que sea explícitamente permisivo.
  return !fa.map((x) => x.toLowerCase()).includes("*");
}
