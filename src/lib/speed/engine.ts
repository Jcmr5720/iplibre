import { jitter as calcJitter, median, stabilityLabel } from "@/lib/stats";
import { cloudflareProvider } from "@/lib/speed/cloudflare";
import type { SpeedProgress, SpeedProvider, SpeedResult } from "@/lib/speed/types";

export const speedProviders: SpeedProvider[] = [cloudflareProvider];

export function getProvider(id?: string): SpeedProvider {
  return speedProviders.find((p) => p.id === id) ?? speedProviders[0];
}

function connectionType(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  return conn?.effectiveType;
}

export interface RunOptions {
  provider?: SpeedProvider;
  signal: AbortSignal;
  onProgress: (p: SpeedProgress) => void;
  latencySamples?: number;
}

export async function runSpeedTest({
  provider = speedProviders[0],
  signal,
  onProgress,
  latencySamples = 20,
}: RunOptions): Promise<SpeedResult> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  onProgress({ phase: "latency", fraction: 0, message: "Midiendo latencia…" });
  const latencies = await provider.measureLatency(latencySamples, { signal, onProgress });
  if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
  const latencyMs = latencies.length ? median(latencies) : 0;
  const jitterMs = calcJitter(latencies);

  onProgress({ phase: "download", fraction: 0, message: "Midiendo descarga…" });
  const download = await provider.measureDownload({ signal, onProgress });
  if (signal.aborted) throw new DOMException("Cancelado", "AbortError");

  onProgress({ phase: "upload", fraction: 0, message: "Midiendo subida…" });
  const upload = await provider.measureUpload({ signal, onProgress });
  if (signal.aborted) throw new DOMException("Cancelado", "AbortError");

  const result: SpeedResult = {
    downloadBps: download.bps,
    uploadBps: upload.bps,
    latencyMs,
    latencyLoadedDownloadMs: download.loadedLatencyMs,
    latencyLoadedUploadMs: upload.loadedLatencyMs,
    jitterMs,
    stability: stabilityLabel(jitterMs),
    bytesDownloaded: download.bytes,
    bytesUploaded: upload.bytes,
    durationMs: Date.now() - t0,
    provider: provider.name,
    connectionType: connectionType(),
    startedAt,
  };

  onProgress({ phase: "done", fraction: 1 });
  return result;
}
