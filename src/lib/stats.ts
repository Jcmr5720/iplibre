/**
 * Utilidades estadísticas para las mediciones de red (latencia, velocidad).
 * Todas las funciones son puras y están cubiertas por pruebas unitarias.
 */

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Jitter: variación media de la latencia. Se calcula como la media de las
 * diferencias absolutas entre muestras consecutivas (RFC 3550 simplificado).
 */
export function jitter(values: number[]): number {
  if (values.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < values.length; i++) {
    sum += Math.abs(values[i] - values[i - 1]);
  }
  return sum / (values.length - 1);
}

/**
 * Elimina valores atípicos usando la desviación absoluta mediana (MAD),
 * robusta frente a muestras anómalas. Si hay muy pocas muestras, no filtra.
 */
export function removeOutliers(values: number[], threshold = 3): number[] {
  if (values.length < 4) return [...values];
  const med = median(values);
  const deviations = values.map((v) => Math.abs(v - med));
  const mad = median(deviations);
  if (mad === 0) return [...values];
  // 1.4826 escala la MAD para aproximarla a la desviación estándar (normal).
  const scaled = 1.4826 * mad;
  const filtered = values.filter((v) => Math.abs(v - med) / scaled <= threshold);
  return filtered.length >= 2 ? filtered : [...values];
}

/**
 * Coeficiente de variación (%) como medida de estabilidad. Menor es mejor.
 */
export function coefficientOfVariation(values: number[]): number {
  const m = mean(values);
  if (m === 0) return 0;
  return (stdev(values) / m) * 100;
}

/**
 * Traduce la variabilidad de la latencia a una etiqueta de estabilidad.
 */
export function stabilityLabel(jitterMs: number): "excelente" | "buena" | "regular" | "inestable" {
  if (jitterMs < 5) return "excelente";
  if (jitterMs < 15) return "buena";
  if (jitterMs < 40) return "regular";
  return "inestable";
}
