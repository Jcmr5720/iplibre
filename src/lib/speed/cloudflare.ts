/**
 * Proveedor de medición: red de Cloudflare (speed.cloudflare.com).
 *
 * Metodología (honesta):
 *  - La "latencia" es el tiempo de ida y vuelta de una petición HTTPS a la
 *    red de medición (NO es ping ICMP).
 *  - La descarga usa lectura por streaming, tomando muestras por ventanas de
 *    tiempo y descartando el arranque lento (warm-up).
 *  - La subida usa XHR para obtener progreso real de envío.
 *  - El volumen transferido se adapta a la velocidad detectada, con topes
 *    para evitar consumo innecesario.
 */
import { mean, median, removeOutliers } from "@/lib/stats";
import type { MeasureOptions, SpeedProvider } from "@/lib/speed/types";

const BASE = "https://speed.cloudflare.com";
const DOWN = (bytes: number) => `${BASE}/__down?bytes=${bytes}`;
const UP = `${BASE}/__up`;

const DOWNLOAD_TARGET_MS = 7000;
const DOWNLOAD_MAX_BYTES = 120 * 1024 * 1024;
const UPLOAD_TARGET_MS = 6000;
const UPLOAD_MAX_BYTES = 30 * 1024 * 1024;
const WINDOW_MS = 200;

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

async function pingOnce(signal: AbortSignal): Promise<number> {
  const t0 = now();
  const res = await fetch(DOWN(0), { cache: "no-store", signal });
  await res.arrayBuffer();
  return now() - t0;
}

async function measureLatency(samples: number, { signal, onProgress }: MeasureOptions) {
  const results: number[] = [];
  // Una sonda de calentamiento (descarta) para abrir conexión TLS.
  try {
    await pingOnce(signal);
  } catch {
    /* ignora warm-up */
  }
  for (let i = 0; i < samples; i++) {
    if (signal.aborted) break;
    try {
      const ms = await pingOnce(signal);
      results.push(ms);
      onProgress({
        phase: "latency",
        fraction: (i + 1) / samples,
        instantMs: ms,
      });
    } catch {
      if (signal.aborted) break;
    }
  }
  return results;
}

/** Lee un stream contando bytes y empujando muestras por ventana de tiempo. */
async function streamAndSample(
  res: Response,
  samples: number[],
  onWindow: (bps: number, totalBytes: number) => void,
  signal: AbortSignal,
): Promise<number> {
  const reader = res.body?.getReader();
  if (!reader) {
    const buf = await res.arrayBuffer();
    return buf.byteLength;
  }
  let total = 0;
  let windowBytes = 0;
  let windowStart = now();
  for (;;) {
    if (signal.aborted) {
      await reader.cancel().catch(() => {});
      break;
    }
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    windowBytes += value.byteLength;
    const elapsed = now() - windowStart;
    if (elapsed >= WINDOW_MS) {
      const bps = (windowBytes * 8) / (elapsed / 1000);
      samples.push(bps);
      onWindow(bps, total);
      windowBytes = 0;
      windowStart = now();
    }
  }
  return total;
}

async function measureDownload({ signal, onProgress }: MeasureOptions) {
  // Warm-up: descarta el primer tramo (slow-start TCP).
  try {
    const warm = await fetch(DOWN(2 * 1024 * 1024), { cache: "no-store", signal });
    await warm.arrayBuffer();
  } catch {
    /* continua */
  }

  const samples: number[] = [];
  const loadedLatency: number[] = [];
  let totalBytes = 0;
  const start = now();
  let chunkBytes = 10 * 1024 * 1024;

  // Sonda de latencia bajo carga, en paralelo.
  let probing = true;
  const probe = (async () => {
    while (probing && !signal.aborted) {
      try {
        loadedLatency.push(await pingOnce(signal));
      } catch {
        /* ignora */
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  })();

  try {
    while (now() - start < DOWNLOAD_TARGET_MS && totalBytes < DOWNLOAD_MAX_BYTES) {
      if (signal.aborted) break;
      const res = await fetch(DOWN(chunkBytes), { cache: "no-store", signal });
      const bytes = await streamAndSample(
        res,
        samples,
        (bps) => {
          const elapsed = now() - start;
          onProgress({
            phase: "download",
            fraction: Math.min(0.99, elapsed / DOWNLOAD_TARGET_MS),
            instantBps: bps,
          });
        },
        signal,
      );
      totalBytes += bytes;
      // Adapta el siguiente tramo a la velocidad reciente.
      const recent = mean(samples.slice(-5));
      if (recent > 0) {
        // Bytes para ~2s a la velocidad reciente.
        const target = (recent / 8) * 2;
        chunkBytes = Math.min(50 * 1024 * 1024, Math.max(5 * 1024 * 1024, Math.round(target)));
      }
    }
  } finally {
    probing = false;
    await probe;
  }

  const ms = now() - start;
  // Descarta el primer 15% de muestras (arranque) y outliers.
  const usable = samples.slice(Math.floor(samples.length * 0.15));
  const clean = removeOutliers(usable.length >= 4 ? usable : samples);
  const bps = clean.length ? mean(clean) : (totalBytes * 8) / (ms / 1000);

  onProgress({ phase: "download", fraction: 1, instantBps: bps });
  return {
    bps,
    bytes: totalBytes,
    ms,
    loadedLatencyMs: loadedLatency.length ? median(loadedLatency) : 0,
  };
}

/** Genera un payload de subida (datos incompresibles). */
function makePayload(bytes: number): Uint8Array {
  const data = new Uint8Array(bytes);
  // Rellena por bloques para no agotar el límite de crypto.getRandomValues.
  const CHUNK = 65536;
  for (let off = 0; off < bytes; off += CHUNK) {
    const slice = data.subarray(off, Math.min(off + CHUNK, bytes));
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(slice);
    }
  }
  return data;
}

function uploadChunk(
  payload: Uint8Array,
  signal: AbortSignal,
  onProgress: (bytesSent: number, dtMs: number) => void,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", UP, true);
    let last = now();
    let lastLoaded = 0;
    xhr.upload.onprogress = (e) => {
      const t = now();
      const dt = t - last;
      if (dt >= WINDOW_MS) {
        onProgress(e.loaded - lastLoaded, dt);
        last = t;
        lastLoaded = e.loaded;
      }
    };
    xhr.onload = () => resolve(payload.byteLength);
    xhr.onerror = () => reject(new Error("Error de subida"));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    // Copia a un ArrayBuffer nuevo para evitar problemas de tipos con SharedArrayBuffer.
    const buf = payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength);
    xhr.send(buf as ArrayBuffer);
  });
}

async function measureUpload({ signal, onProgress }: MeasureOptions) {
  const samples: number[] = [];
  const loadedLatency: number[] = [];
  let totalBytes = 0;
  const start = now();
  let chunkSize = 4 * 1024 * 1024;

  let probing = true;
  const probe = (async () => {
    while (probing && !signal.aborted) {
      try {
        loadedLatency.push(await pingOnce(signal));
      } catch {
        /* ignora */
      }
      await new Promise((r) => setTimeout(r, 450));
    }
  })();

  try {
    while (now() - start < UPLOAD_TARGET_MS && totalBytes < UPLOAD_MAX_BYTES) {
      if (signal.aborted) break;
      const payload = makePayload(chunkSize);
      await uploadChunk(payload, signal, (bytesSent, dtMs) => {
        if (dtMs > 0 && bytesSent > 0) {
          const bps = (bytesSent * 8) / (dtMs / 1000);
          samples.push(bps);
          const elapsed = now() - start;
          onProgress({
            phase: "upload",
            fraction: Math.min(0.99, elapsed / UPLOAD_TARGET_MS),
            instantBps: bps,
          });
        }
      });
      totalBytes += payload.byteLength;
      const recent = mean(samples.slice(-5));
      if (recent > 0) {
        const target = (recent / 8) * 2;
        chunkSize = Math.min(20 * 1024 * 1024, Math.max(2 * 1024 * 1024, Math.round(target)));
      }
    }
  } finally {
    probing = false;
    await probe;
  }

  const ms = now() - start;
  const usable = samples.slice(Math.floor(samples.length * 0.15));
  const clean = removeOutliers(usable.length >= 4 ? usable : samples);
  const bps = clean.length ? mean(clean) : (totalBytes * 8) / (ms / 1000);

  onProgress({ phase: "upload", fraction: 1, instantBps: bps });
  return {
    bps,
    bytes: totalBytes,
    ms,
    loadedLatencyMs: loadedLatency.length ? median(loadedLatency) : 0,
  };
}

export const cloudflareProvider: SpeedProvider = {
  id: "cloudflare",
  name: "Cloudflare",
  description: "Red de medición distribuida de Cloudflare (speed.cloudflare.com).",
  methodology:
    "Medición HTTPS por streaming con muestreo por ventanas y descarte de arranque. La latencia es el tiempo de ida y vuelta HTTPS, no ping ICMP.",
  measureLatency,
  measureDownload,
  measureUpload,
};
