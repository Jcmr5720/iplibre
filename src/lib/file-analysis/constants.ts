import type { IndicatorConfidence, IndicatorSeverity, RiskLevel, ScoreBreakdownItem } from "./types";

export const MAX_FILE_BYTES = 64 * 1024 * 1024;
export const ANALYSIS_TIMEOUT_MS = 45_000;
export const MAX_TEXT_BYTES = 2 * 1024 * 1024;
export const MAX_EMBEDDED_SCAN_BYTES = 8 * 1024 * 1024;
export const ZIP_LIMITS = {
  maxEntries: 500,
  maxDepth: 3,
  maxExpandedBytes: 256 * 1024 * 1024,
  maxRatio: 200,
} as const;

export const SEVERITY_ORDER: Record<IndicatorSeverity, number> = {
  informativa: 0,
  baja: 1,
  media: 2,
  alta: 3,
  critica: 4,
};

/** Pesos publicos y reproducibles. Los indicadores no listados usan el peso de su severidad. */
export const INDICATOR_WEIGHTS: Record<string, number> = {
  "type-mismatch": 30,
  "double-extension": 18,
  "executable-file": 12,
  "suspicious-name": 8,
  "large-file": 4,
  "high-entropy": 10,
  "embedded-executable": 30,
  "pe-invalid": 16,
  "pe-packed-section": 16,
  "pe-overlay": 8,
  "script-obfuscation": 16,
  "script-encoded-command": 24,
  "script-dynamic-execution": 12,
  "script-download-execute": 28,
  "script-persistence": 18,
  "pdf-javascript": 20,
  "pdf-auto-action": 22,
  "pdf-launch": 30,
  "pdf-attachment": 12,
  "pdf-encrypted": 4,
  "office-macro": 24,
  "office-external-relation": 14,
  "office-embedded-object": 18,
  "archive-executable": 20,
  "archive-script": 14,
  "archive-double-extension": 18,
  "archive-nested": 10,
  "zip-bomb-ratio": 35,
  "zip-limits": 12,
  "archive-encrypted": 4,
  "archive-valid-pe": 24,
  "office-dde": 20,
  "script-powershell-download-chain": 34,
  "pdf-openaction-javascript": 36,
  "pe-injection-imports": 28,
  "pe-network-execution-imports": 24,
  "pdf-embedded-pe": 34,
  "script-lolbin-remote": 26,
  "html-active-content": 14,
  "lnk-command-target": 24,
};

const SEVERITY_WEIGHTS: Record<IndicatorSeverity, number> = {
  informativa: 0,
  baja: 4,
  media: 10,
  alta: 20,
  critica: 35,
};

const CONFIDENCE_MULTIPLIER: Record<IndicatorConfidence, number> = {
  baja: 0.35,
  media: 0.7,
  alta: 1,
};

const FAMILY_CAPS: Record<string, number> = {
  base64: 14,
  script: 55,
  pdf: 58,
  pe: 62,
  archive: 54,
  office: 58,
  generic: 40,
};

export function scoreIndicators(indicators: { id: string; severity: IndicatorSeverity; confidence?: IndicatorConfidence; family?: string; title?: string }[]): number {
  return scoreWithBreakdown(indicators).score;
}

export function scoreWithBreakdown(indicators: { id: string; severity: IndicatorSeverity; confidence?: IndicatorConfidence; family?: string; title?: string }[]): { score: number; breakdown: ScoreBreakdownItem[] } {
  const byFamily = new Map<string, number>();
  const breakdown: ScoreBreakdownItem[] = [];
  for (const item of indicators) {
    const family = item.family ?? item.id;
    const base = INDICATOR_WEIGHTS[item.id] ?? SEVERITY_WEIGHTS[item.severity];
    const confidence = item.confidence ?? "alta";
    const raw = Math.round(base * CONFIDENCE_MULTIPLIER[confidence]);
    const cap = FAMILY_CAPS[family] ?? 100;
    const used = Math.max(0, Math.min(raw, cap - (byFamily.get(family) ?? 0)));
    byFamily.set(family, (byFamily.get(family) ?? 0) + used);
    if (used > 0) breakdown.push({ id: item.id, label: item.title ?? item.id, weight: used, severity: item.severity, confidence, source: "indicador" });
  }
  return { score: Math.min(100, breakdown.reduce((sum, item) => sum + item.weight, 0)), breakdown };
}

export function riskFromScore(score: number): RiskLevel {
  if (score < 20) return "Sin indicadores evidentes";
  if (score < 40) return "Precaucion";
  if (score < 70) return "Riesgo elevado";
  return "Riesgo alto";
}
