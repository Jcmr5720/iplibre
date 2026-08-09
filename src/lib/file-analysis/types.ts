export type IndicatorSeverity = "informativa" | "baja" | "media" | "alta" | "critica";
export type IndicatorConfidence = "baja" | "media" | "alta";
export type CoverageStatus = "analizada" | "parcial" | "no_aplica" | "no_analizada" | "limitada";

export type Indicator = {
  id: string;
  severity: IndicatorSeverity;
  confidence: IndicatorConfidence;
  title: string;
  explanation: string;
  evidence: string;
  category: "general" | "formato" | "ejecutable" | "script" | "pdf" | "office" | "archivo";
  recommendation: string;
  family?: string;
};

export type DetectedType = {
  id: string;
  label: string;
  mime: string;
  extensions: string[];
  confidence: "alta" | "media" | "baja";
  analysis: "profundo" | "parcial";
};

export type AnalysisDetails = Record<string, string | number | boolean | string[]>;

export type RiskLevel = "Sin indicadores evidentes" | "Precaucion" | "Riesgo elevado" | "Riesgo alto";

export type CoverageItem = {
  label: string;
  status: CoverageStatus;
  note?: string;
};

export type AnalysisCoverage = {
  level: "Completa" | "Parcial" | "Limitada";
  confidence: IndicatorConfidence;
  items: CoverageItem[];
};

export type PositiveCheck = {
  id: string;
  label: string;
  evidence?: string;
};

export type ScoreBreakdownItem = {
  id: string;
  label: string;
  weight: number;
  severity: IndicatorSeverity;
  confidence: IndicatorConfidence;
  source: "indicador" | "correlacion";
};

export type AnalysisResult = {
  file: { name: string; size: number; extension: string; declaredType: string; detectedType: DetectedType };
  sha256: string;
  score: number;
  riskLevel: RiskLevel;
  confidence: IndicatorConfidence;
  coverage: AnalysisCoverage;
  positiveChecks: PositiveCheck[];
  scoreBreakdown: ScoreBreakdownItem[];
  summary: string;
  indicators: Indicator[];
  details: AnalysisDetails;
  partial: boolean;
  durationMs: number;
};

export type ProgressPhase = "preparing" | "hashing" | "detecting" | "validating" | "metadata" | "content" | "heuristics" | "rules" | "scoring" | "result";

export type WorkerRequest = { type: "analyze"; file: File };
export type WorkerResponse =
  | { type: "progress"; phase: ProgressPhase; label: string; progress?: number }
  | { type: "result"; result: AnalysisResult }
  | { type: "error"; message: string };
