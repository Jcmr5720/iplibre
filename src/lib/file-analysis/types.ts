export type IndicatorSeverity = "informativa" | "baja" | "media" | "alta" | "critica";

export type Indicator = {
  id: string;
  severity: IndicatorSeverity;
  title: string;
  explanation: string;
  evidence: string;
  category: "general" | "formato" | "ejecutable" | "script" | "pdf" | "office" | "archivo";
  recommendation: string;
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

export type AnalysisResult = {
  file: { name: string; size: number; extension: string; declaredType: string; detectedType: DetectedType };
  sha256: string;
  score: number;
  riskLevel: RiskLevel;
  indicators: Indicator[];
  details: AnalysisDetails;
  partial: boolean;
  durationMs: number;
};

export type ProgressPhase = "preparing" | "hashing" | "detecting" | "analyzing" | "scoring";

export type WorkerRequest = { type: "analyze"; file: File };
export type WorkerResponse =
  | { type: "progress"; phase: ProgressPhase; label: string; progress?: number }
  | { type: "result"; result: AnalysisResult }
  | { type: "error"; message: string };

