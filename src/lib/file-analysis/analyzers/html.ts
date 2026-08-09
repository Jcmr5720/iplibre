import { MAX_TEXT_BYTES } from "../constants";
import { indicator } from "../indicator";
import type { AnalysisDetails, Indicator, PositiveCheck } from "../types";

export function analyzeHtml(bytes: Uint8Array, isSvg = false): { indicators: Indicator[]; details: AnalysisDetails; checks: PositiveCheck[] } {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, Math.min(bytes.length, MAX_TEXT_BYTES)));
  const scripts = text.match(/<script\b/gi)?.length ?? 0;
  const iframes = text.match(/<iframe\b/gi)?.length ?? 0;
  const externalUrls = text.match(/https?:\/\/[^\s"'<>)]{4,}/gi)?.length ?? 0;
  const dataUrls = text.match(/(?:src|href)=["']data:[^"']{40,}/gi)?.length ?? 0;
  const javascriptUrls = text.match(/(?:href|src|xlink:href)=["']javascript:/gi)?.length ?? 0;
  const indicators: Indicator[] = [];
  const checks: PositiveCheck[] = [];
  if (scripts || iframes || javascriptUrls || dataUrls > 3) {
    indicators.push(indicator("html-active-content", "media", isSvg ? "SVG con contenido activo" : "HTML con contenido activo", "Se detectaron scripts, iframes o URLs activas. No se renderiza el archivo dentro del DOM.", `scripts=${scripts}; iframes=${iframes}; javascript URLs=${javascriptUrls}; data URLs=${dataUrls}`, isSvg ? "archivo" : "script", "Abre contenido HTML/SVG inesperado solo si confias en su origen.", "media", "script"));
  }
  if (!scripts) checks.push({ id: "html-no-script", label: isSvg ? "No encontramos scripts dentro del SVG" : "No encontramos etiquetas script" });
  if (!iframes) checks.push({ id: "html-no-iframe", label: "No encontramos iframes" });
  if (!javascriptUrls) checks.push({ id: "html-no-javascript-url", label: "No encontramos URLs javascript:" });
  return { indicators, checks, details: { scripts, iframes, externalUrls, dataUrls, javascriptUrls } };
}
