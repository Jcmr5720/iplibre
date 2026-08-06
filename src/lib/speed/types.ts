/** Tipos del motor de prueba de velocidad (capa de proveedores intercambiable). */

export type SpeedPhase =
  | "idle"
  | "latency"
  | "download"
  | "upload"
  | "done"
  | "error"
  | "cancelled";

export interface SpeedProgress {
  phase: SpeedPhase;
  /** Progreso 0–1 de la fase actual. */
  fraction: number;
  /** Velocidad instantánea en bits/s (descarga o subida). */
  instantBps?: number;
  /** Latencia instantánea (ms) durante las sondas. */
  instantMs?: number;
  message?: string;
}

export interface SpeedResult {
  downloadBps: number;
  uploadBps: number;
  latencyMs: number;
  latencyLoadedDownloadMs: number;
  latencyLoadedUploadMs: number;
  jitterMs: number;
  stability: "excelente" | "buena" | "regular" | "inestable";
  bytesDownloaded: number;
  bytesUploaded: number;
  durationMs: number;
  provider: string;
  connectionType?: string;
  startedAt: string;
}

export interface MeasureOptions {
  signal: AbortSignal;
  onProgress: (p: SpeedProgress) => void;
}

export interface SpeedProvider {
  id: string;
  name: string;
  description: string;
  methodology: string;
  measureLatency: (
    samples: number,
    opts: MeasureOptions,
  ) => Promise<number[]>;
  measureDownload: (opts: MeasureOptions) => Promise<{
    bps: number;
    bytes: number;
    ms: number;
    loadedLatencyMs: number;
  }>;
  measureUpload: (opts: MeasureOptions) => Promise<{
    bps: number;
    bytes: number;
    ms: number;
    loadedLatencyMs: number;
  }>;
}
