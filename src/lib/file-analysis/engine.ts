import { SEVERITY_ORDER, riskFromScore, scoreWithBreakdown } from "./constants";
import { detectFileType, extensionOf } from "./detect";
import { analyzeGeneric } from "./analyzers/generic";
import { analyzeHtml } from "./analyzers/html";
import { analyzeLnk } from "./analyzers/lnk";
import { analyzePdf } from "./analyzers/pdf";
import { analyzePe } from "./analyzers/pe";
import { analyzeScript } from "./analyzers/script";
import { analyzeZip } from "./analyzers/zip";
import type { AnalysisCoverage, AnalysisDetails, AnalysisResult, DetectedType, Indicator, IndicatorConfidence, PositiveCheck } from "./types";

export type AnalysisCoreResult = Omit<AnalysisResult, "sha256" | "durationMs">;

function confidenceFrom(partial: boolean, detectedType: DetectedType, indicators: Indicator[]): IndicatorConfidence {
  if (detectedType.confidence === "baja" || partial) return "baja";
  if (indicators.some((item) => item.confidence === "baja")) return "media";
  return detectedType.analysis === "profundo" ? "alta" : "media";
}

function makeCoverage(detectedType: DetectedType, partial: boolean, encrypted: boolean): AnalysisCoverage {
  const items = [
    { label: "Identificacion de formato", status: detectedType.confidence === "baja" ? "limitada" : "analizada", note: detectedType.label },
    { label: "Validacion estructural", status: detectedType.analysis === "profundo" && !partial ? "analizada" : partial ? "parcial" : "limitada" },
    { label: "Metadata visible", status: "analizada" },
    { label: "Contenido incrustado", status: ["pdf", "zip"].includes(detectedType.id) ? (partial ? "parcial" : "analizada") : "no_aplica" },
    { label: "Heuristicas estaticas", status: "analizada" },
    { label: "Reglas correlacionadas", status: "analizada" },
    { label: "Comportamiento en ejecucion", status: "no_analizada", note: "El archivo no se ejecuta ni se emula" },
  ] as AnalysisCoverage["items"];
  if (encrypted) items.splice(3, 0, { label: "Contenido cifrado", status: "limitada", note: "No se puede inspeccionar todo el contenido localmente" });
  const level = partial || encrypted || detectedType.confidence === "baja" ? "Limitada" : detectedType.analysis === "profundo" ? "Completa" : "Parcial";
  return { level, confidence: level === "Completa" ? "alta" : level === "Parcial" ? "media" : "baja", items };
}

function summaryFor(score: number, indicators: Indicator[], checks: PositiveCheck[], coverage: AnalysisCoverage): string {
  if (coverage.level === "Limitada" && score < 20) return "No encontramos indicadores evidentes, pero la cobertura fue limitada.";
  if (score < 20) return "No encontramos indicadores evidentes en las comprobaciones disponibles.";
  const important = indicators.filter((item) => ["alta", "critica"].includes(item.severity)).length;
  if (score < 40) return important ? "Encontramos un indicador que merece revision." : "Encontramos senales moderadas que conviene revisar.";
  if (score < 70) return "Encontramos indicadores correlacionados que elevan el riesgo.";
  return `Encontramos ${important || indicators.length} indicador(es) importante(s); evita abrir o ejecutar el archivo.`;
}

function baseChecks(type: DetectedType, extension: string, indicators: Indicator[]): PositiveCheck[] {
  const ids = new Set(indicators.map((item) => item.id));
  const checks: PositiveCheck[] = [];
  if (!ids.has("type-mismatch")) checks.push({ id: "type-match", label: "El tipo interno coincide con la extension o no hay contradiccion clara" });
  if (!ids.has("embedded-executable") && !ids.has("pdf-embedded-pe") && !ids.has("archive-valid-pe")) checks.push({ id: "no-embedded-pe", label: "No encontramos ejecutables PE validos incrustados" });
  if (type.analysis === "profundo") checks.push({ id: "structure-supported", label: "El formato principal tiene analisis estructural disponible", evidence: extension ? `.${extension}` : type.label });
  return checks;
}

export function analyzeBytes(bytes: Uint8Array, file: { name: string; type?: string }): AnalysisCoreResult {
  const extension = extensionOf(file.name);
  let detectedType: DetectedType = detectFileType(bytes, file.name);
  const generic = analyzeGeneric(bytes, file.name, detectedType);
  let indicators: Indicator[] = [...generic.indicators];
  let checks: PositiveCheck[] = [];
  let details: AnalysisDetails = { entropy: Number(generic.entropy.toFixed(2)), bytesInspected: bytes.length };
  let partial = detectedType.analysis === "parcial";

  if (detectedType.id === "pdf") {
    const result = analyzePdf(bytes);
    indicators.push(...result.indicators); checks.push(...result.checks); details = { ...details, ...result.details }; partial ||= result.partial;
  } else if (detectedType.id === "pe") {
    const result = analyzePe(bytes);
    indicators.push(...result.indicators); details = { ...details, ...result.details }; partial ||= result.partial;
  } else if (detectedType.id === "script") {
    const result = analyzeScript(bytes);
    indicators.push(...result.indicators); checks.push(...result.checks); details = { ...details, ...result.details };
  } else if (detectedType.id === "html" || detectedType.id === "svg") {
    const result = analyzeHtml(bytes, detectedType.id === "svg");
    indicators.push(...result.indicators); checks.push(...result.checks); details = { ...details, ...result.details };
  } else if (detectedType.id === "lnk") {
    const result = analyzeLnk(bytes);
    indicators.push(...result.indicators); checks.push(...result.checks); details = { ...details, ...result.details }; partial ||= result.partial;
  } else if (detectedType.id === "zip") {
    const result = analyzeZip(bytes, extension);
    indicators.push(...result.indicators); checks.push(...result.checks); details = { ...details, ...result.details }; partial ||= result.partial;
    if (result.detectedLabel) detectedType = { ...detectedType, label: result.detectedLabel };
  }

  const unique = new Map<string, Indicator>();
  for (const item of indicators) {
    const current = unique.get(item.id);
    if (!current || SEVERITY_ORDER[item.severity] > SEVERITY_ORDER[current.severity] || (SEVERITY_ORDER[item.severity] === SEVERITY_ORDER[current.severity] && item.confidence === "alta")) unique.set(item.id, item);
  }
  indicators = [...unique.values()].sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
  checks = [...new Map([...checks, ...baseChecks(detectedType, extension, indicators)].map((item) => [item.id, item])).values()].slice(0, 8);
  const { score, breakdown } = scoreWithBreakdown(indicators);
  const encrypted = Boolean(details.encrypted) || Number(details.encryptedEntries ?? 0) > 0;
  const coverage = makeCoverage(detectedType, partial, encrypted);
  return {
    file: { name: file.name, size: bytes.length, extension: extension || "Sin extension", declaredType: file.type || "No declarado", detectedType },
    score,
    riskLevel: riskFromScore(score),
    confidence: confidenceFrom(partial, detectedType, indicators),
    coverage,
    positiveChecks: checks,
    scoreBreakdown: breakdown,
    summary: summaryFor(score, indicators, checks, coverage),
    indicators,
    details,
    partial,
  };
}

export function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
