import type { Indicator, IndicatorSeverity } from "./types";

export function indicator(id: string, severity: IndicatorSeverity, title: string, explanation: string, evidence: string, category: Indicator["category"], recommendation: string): Indicator {
  return { id, severity, title, explanation, evidence, category, recommendation };
}

