"use client";

import { formatMbps, formatDateTime, formatMs } from "@/lib/format";
import { maskIp } from "@/lib/privacy";
import { overallQuality } from "@/lib/speed/rating";
import type { SpeedResult } from "@/lib/speed/types";

interface ReportMeta {
  ip?: string;
  isp?: string;
  testId: string;
}

/** Dibuja una tarjeta de resultado en un canvas y devuelve el elemento. */
export function drawReportCard(result: SpeedResult, meta: ReportMeta): HTMLCanvasElement {
  const W = 1200;
  const H = 675;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Fondo
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#060b16");
  grad.addColorStop(0.6, "#0b1b2e");
  grad.addColorStop(1, "#0e3a4a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Marca
  ctx.fillStyle = "#e6edf6";
  ctx.font = "700 40px Inter, Arial, sans-serif";
  ctx.fillText("IP", 60, 90);
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("Libre", 60 + ctx.measureText("IP").width, 90);
  ctx.fillStyle = "#93a4bd";
  ctx.font = "400 22px Inter, Arial, sans-serif";
  ctx.fillText("Resultado de la prueba de velocidad", 60, 125);

  const quality = overallQuality(result.downloadBps, result.latencyMs);
  ctx.fillStyle = "#22d3ee";
  ctx.font = "700 26px Inter, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(quality.label, W - 60, 90);
  ctx.textAlign = "left";

  // Métricas principales
  const metrics = [
    { label: "Descarga", value: formatMbps(result.downloadBps) },
    { label: "Subida", value: formatMbps(result.uploadBps) },
    { label: "Latencia", value: formatMs(result.latencyMs) },
    { label: "Jitter", value: formatMs(result.jitterMs) },
  ];
  const cardW = (W - 120 - 3 * 24) / 4;
  metrics.forEach((m, i) => {
    const x = 60 + i * (cardW + 24);
    const y = 180;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    roundRect(ctx, x, y, cardW, 150, 16);
    ctx.fill();
    ctx.fillStyle = "#93a4bd";
    ctx.font = "500 20px Inter, Arial, sans-serif";
    ctx.fillText(m.label, x + 24, y + 44);
    ctx.fillStyle = "#e6edf6";
    ctx.font = "700 40px Inter, Arial, sans-serif";
    ctx.fillText(m.value, x + 24, y + 100);
  });

  // Detalles
  const details: [string, string][] = [
    ["Proveedor de medición", result.provider],
    ["Fecha", formatDateTime(result.startedAt)],
    ["ID de prueba", meta.testId],
    ["Estabilidad", result.stability],
  ];
  if (meta.isp) details.push(["Proveedor de Internet", meta.isp]);
  if (meta.ip) details.push(["IP (protegida)", maskIp(meta.ip)]);

  ctx.font = "400 22px Inter, Arial, sans-serif";
  details.forEach((d, i) => {
    const y = 400 + i * 40;
    ctx.fillStyle = "#93a4bd";
    ctx.fillText(d[0], 60, y);
    ctx.fillStyle = "#e6edf6";
    ctx.fillText(d[1], 520, y);
  });

  ctx.fillStyle = "#5b6b84";
  ctx.font = "400 18px Inter, Arial, sans-serif";
  ctx.fillText(
    "Medición HTTPS orientativa · La latencia no es ping ICMP · Los resultados pueden variar",
    60,
    H - 40,
  );

  return canvas;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportPng(result: SpeedResult, meta: ReportMeta) {
  const canvas = drawReportCard(result, meta);
  const url = canvas.toDataURL("image/png");
  downloadDataUrl(url, `iplibre-velocidad-${meta.testId}.png`);
}

export async function exportPdf(result: SpeedResult, meta: ReportMeta) {
  const canvas = drawReportCard(result, meta);
  const imgData = canvas.toDataURL("image/png");
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(`iplibre-velocidad-${meta.testId}.pdf`);
}
