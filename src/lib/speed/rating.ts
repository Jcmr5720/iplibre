/**
 * Clasificación orientativa de la conexión según descarga, subida y latencia.
 * Los umbrales son referencias habituales; NO son garantías.
 */
import { toMbps } from "@/lib/format";

export interface UseCaseRating {
  label: string;
  ok: boolean;
  detail: string;
}

export function overallQuality(downloadBps: number, latencyMs: number): {
  label: string;
  tone: "success" | "info" | "warning" | "danger";
  score: number;
} {
  const d = toMbps(downloadBps);
  if (d >= 100 && latencyMs < 60) return { label: "Excelente", tone: "success", score: 5 };
  if (d >= 50 && latencyMs < 90) return { label: "Muy buena", tone: "success", score: 4 };
  if (d >= 20 && latencyMs < 130) return { label: "Buena", tone: "info", score: 3 };
  if (d >= 5) return { label: "Aceptable", tone: "warning", score: 2 };
  return { label: "Limitada", tone: "danger", score: 1 };
}

export function useCaseRatings(
  downloadBps: number,
  uploadBps: number,
  latencyMs: number,
): UseCaseRating[] {
  const d = toMbps(downloadBps);
  const u = toMbps(uploadBps);

  return [
    {
      label: "Navegación web",
      ok: d >= 3,
      detail: d >= 3 ? "Fluida" : "Puede ir lenta",
    },
    {
      label: "Videollamadas",
      ok: d >= 3 && u >= 1.5 && latencyMs < 150,
      detail: d >= 3 && u >= 1.5 && latencyMs < 150 ? "Estable" : "Posibles cortes",
    },
    {
      label: "Streaming HD (1080p)",
      ok: d >= 8,
      detail: d >= 8 ? "Sin problemas" : "Puede requerir buffer",
    },
    {
      label: "Streaming 4K",
      ok: d >= 25,
      detail: d >= 25 ? "Compatible" : "Ancho de banda insuficiente",
    },
    {
      label: "Juegos en línea",
      ok: latencyMs < 80,
      detail: latencyMs < 80 ? "Buena respuesta" : "Latencia alta para competitivo",
    },
    {
      label: "Trabajo remoto / VPN",
      ok: d >= 10 && u >= 3,
      detail: d >= 10 && u >= 3 ? "Adecuada" : "Ajustada para archivos grandes",
    },
    {
      label: "Subida de archivos",
      ok: u >= 5,
      detail: u >= 5 ? "Ágil" : "Lenta para archivos grandes",
    },
  ];
}
