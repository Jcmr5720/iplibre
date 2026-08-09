import type { Indicator, IndicatorConfidence, IndicatorSeverity } from "./types";

export function indicator(
  id: string,
  severity: IndicatorSeverity,
  title: string,
  explanation: string,
  evidence: string,
  category: Indicator["category"],
  recommendation: string,
  confidence: IndicatorConfidence = "alta",
  family = id,
): Indicator {
  return { id, severity, confidence, title, explanation, evidence, category, recommendation, family };
}
