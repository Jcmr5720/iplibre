/**
 * Análisis de la cabecera Strict-Transport-Security (HSTS).
 */

export interface HstsAnalysis {
  present: boolean;
  maxAge?: number;
  includeSubDomains: boolean;
  preload: boolean;
  /** max-age recomendado mínimo (6 meses) para considerarse sólido. */
  longEnough: boolean;
  notes: string[];
}

const SIX_MONTHS = 15_552_000; // segundos

export function analyzeHsts(value: string | null | undefined): HstsAnalysis {
  if (!value) {
    return {
      present: false,
      includeSubDomains: false,
      preload: false,
      longEnough: false,
      notes: ["No se fuerza HTTPS mediante HSTS."],
    };
  }
  const lower = value.toLowerCase();
  const maxAgeMatch = /max-age\s*=\s*(\d+)/.exec(lower);
  const maxAge = maxAgeMatch ? Number(maxAgeMatch[1]) : undefined;
  const includeSubDomains = /includesubdomains/.test(lower);
  const preload = /preload/.test(lower);
  const longEnough = (maxAge ?? 0) >= SIX_MONTHS;

  const notes: string[] = [];
  if (maxAge === undefined) notes.push("Falta la directiva max-age.");
  else if (!longEnough) notes.push("max-age por debajo de 6 meses; se recomienda al menos 15552000.");
  if (!includeSubDomains) notes.push("Sin includeSubDomains: los subdominios no quedan protegidos.");
  if (!preload) notes.push("Sin preload (opcional, para inclusión en la lista de precarga).");

  return { present: true, maxAge, includeSubDomains, preload, longEnough, notes };
}
