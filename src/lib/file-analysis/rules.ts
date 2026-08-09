import { indicator } from "./indicator";
import type { Indicator, IndicatorConfidence, IndicatorSeverity } from "./types";

export type StaticRule = {
  id: string;
  formats: string[];
  requiresAll?: string[];
  requiresAny?: string[];
  severity: IndicatorSeverity;
  confidence: IndicatorConfidence;
  title: string;
  explanation: string;
  evidence: string;
  recommendation: string;
  family: string;
};

export function evaluateStaticRules(format: string, signals: Record<string, boolean>, rules: StaticRule[]): Indicator[] {
  return rules
    .filter((rule) => rule.formats.includes(format))
    .filter((rule) => (rule.requiresAll ?? []).every((name) => signals[name]))
    .filter((rule) => !rule.requiresAny || rule.requiresAny.some((name) => signals[name]))
    .map((rule) => indicator(rule.id, rule.severity, rule.title, rule.explanation, rule.evidence, format === "pdf" ? "pdf" : "script", rule.recommendation, rule.confidence, rule.family));
}

export const STATIC_RULES: StaticRule[] = [
  {
    id: "script-powershell-download-chain",
    formats: ["script"],
    requiresAll: ["encodedCommand", "longBase64", "download", "execution"],
    severity: "critica",
    confidence: "alta",
    title: "Cadena PowerShell codificada con descarga y ejecucion",
    explanation: "La correlacion combina comando codificado, carga remota y ejecucion. Es mas fuerte que cada senal aislada.",
    evidence: "PowerShell + EncodedCommand + URL/descarga + ejecucion",
    recommendation: "No ejecutes este script en tu equipo principal.",
    family: "script",
  },
  {
    id: "script-lolbin-remote",
    formats: ["script"],
    requiresAll: ["lolbinRemote"],
    severity: "alta",
    confidence: "alta",
    title: "Uso remoto de binarios del sistema",
    explanation: "Se detecto certutil, mshta, regsvr32 o rundll32 con contexto remoto o de decodificacion.",
    evidence: "LOLBIN con URL o decodificacion",
    recommendation: "Tratalo como sospechoso salvo que conozcas exactamente su finalidad.",
    family: "script",
  },
  {
    id: "pdf-openaction-javascript",
    formats: ["pdf"],
    requiresAll: ["javascript", "autoAction", "externalUri"],
    severity: "critica",
    confidence: "alta",
    title: "PDF con apertura automatica, JavaScript y URL externa",
    explanation: "La correlacion es mas relevante que una URL o JavaScript aislados.",
    evidence: "OpenAction/AA + JavaScript + URI/GoToR",
    recommendation: "No abras este PDF hasta revisarlo con una solucion de seguridad completa.",
    family: "pdf",
  },
];
