/**
 * Formateadores de presentación (velocidad, latencia, bytes, fechas).
 */

/** Convierte bits por segundo a la mejor unidad (bps, Kbps, Mbps, Gbps). */
export function formatBitrate(bitsPerSecond: number): { value: string; unit: string } {
  if (!Number.isFinite(bitsPerSecond) || bitsPerSecond < 0) {
    return { value: "0", unit: "Mbps" };
  }
  const units = ["bps", "Kbps", "Mbps", "Gbps"];
  let idx = 0;
  let v = bitsPerSecond;
  while (v >= 1000 && idx < units.length - 1) {
    v /= 1000;
    idx++;
  }
  const decimals = v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return { value: v.toFixed(decimals), unit: units[idx] };
}

/** Mbps redondeado para comparaciones y clasificaciones. */
export function toMbps(bitsPerSecond: number): number {
  return bitsPerSecond / 1_000_000;
}

export function formatMbps(bitsPerSecond: number): string {
  const mbps = toMbps(bitsPerSecond);
  const decimals = mbps >= 100 ? 0 : mbps >= 10 ? 1 : 2;
  return `${mbps.toFixed(decimals)} Mbps`;
}

export function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return "—";
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
  const decimals = ms >= 100 ? 0 : ms >= 10 ? 1 : 2;
  return `${ms.toFixed(decimals)} ms`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let v = bytes;
  while (v >= 1024 && idx < units.length - 1) {
    v /= 1024;
    idx++;
  }
  return `${v.toFixed(v >= 100 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export function formatDateTime(input: string | number | Date, locale = "es-ES"): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatRelativeSeconds(ms: number): string {
  const s = ms / 1000;
  return `${s.toFixed(1)} s`;
}

/** Devuelve un identificador local de prueba, corto y sin datos personales. */
export function shortId(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(16).slice(2);
  return rand.slice(0, 8).toUpperCase();
}
