import { SEVERITY_ORDER, scoreIndicators, riskFromScore } from "./constants";
import { detectFileType, extensionOf } from "./detect";
import { analyzeGeneric } from "./analyzers/generic";
import { analyzePdf } from "./analyzers/pdf";
import { analyzePe } from "./analyzers/pe";
import { analyzeScript } from "./analyzers/script";
import { analyzeZip } from "./analyzers/zip";
import type { AnalysisDetails, AnalysisResult, DetectedType, Indicator } from "./types";

export type AnalysisCoreResult = Omit<AnalysisResult, "sha256" | "durationMs">;

export function analyzeBytes(bytes: Uint8Array, file: { name: string; type?: string }): AnalysisCoreResult {
  const extension = extensionOf(file.name);
  let detectedType: DetectedType = detectFileType(bytes, file.name);
  const generic = analyzeGeneric(bytes, file.name, detectedType);
  let indicators: Indicator[] = [...generic.indicators];
  let details: AnalysisDetails = { entropy: Number(generic.entropy.toFixed(2)), bytesInspected: bytes.length };
  let partial = detectedType.analysis === "parcial";

  if (detectedType.id === "pdf") {
    const result = analyzePdf(bytes); indicators.push(...result.indicators); details = { ...details, ...result.details };
  } else if (detectedType.id === "pe") {
    const result = analyzePe(bytes); indicators.push(...result.indicators); details = { ...details, ...result.details }; partial ||= result.partial;
  } else if (detectedType.id === "script") {
    indicators.push(...analyzeScript(bytes));
  } else if (detectedType.id === "zip") {
    const result = analyzeZip(bytes, extension); indicators.push(...result.indicators); details = { ...details, ...result.details }; partial ||= result.partial;
    if (result.detectedLabel) detectedType = { ...detectedType, label: result.detectedLabel };
  }

  const unique = new Map<string, Indicator>();
  for (const item of indicators) if (!unique.has(item.id) || SEVERITY_ORDER[item.severity] > SEVERITY_ORDER[unique.get(item.id)!.severity]) unique.set(item.id, item);
  indicators = [...unique.values()].sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
  const score = scoreIndicators(indicators);
  return {
    file: { name: file.name, size: bytes.length, extension: extension || "Sin extension", declaredType: file.type || "No declarado", detectedType },
    score,
    riskLevel: riskFromScore(score),
    indicators,
    details,
    partial,
  };
}

export function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

