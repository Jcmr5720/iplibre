import { MAX_TEXT_BYTES } from "../constants";
import { indicator } from "../indicator";
import type { AnalysisDetails, Indicator } from "../types";

export function analyzePdf(bytes: Uint8Array): { indicators: Indicator[]; details: AnalysisDetails } {
  const text = new TextDecoder("latin1").decode(bytes.subarray(0, Math.min(bytes.length, MAX_TEXT_BYTES)));
  const indicators: Indicator[] = [];
  const count = (pattern: RegExp) => text.match(pattern)?.length ?? 0;
  const javascript = count(/\/(?:JavaScript|JS)\b/g);
  const autoAction = count(/\/OpenAction\b|\/AA\b/g);
  const launch = count(/\/Launch\b/g);
  const attachments = count(/\/EmbeddedFile\b|\/Filespec\b/g);
  const links = count(/\/URI\b/g);
  const forms = count(/\/AcroForm\b|\/XFA\b/g);
  const encrypted = /\/Encrypt\b/.test(text);
  if (javascript) indicators.push(indicator("pdf-javascript", "alta", "JavaScript incorporado en el PDF", "El documento declara acciones JavaScript. IPLibre no las ejecuta.", `${javascript} referencia(s) /JavaScript o /JS`, "pdf", "Abre el documento solo en un lector actualizado y con JavaScript desactivado si dudas del origen."));
  if (autoAction) indicators.push(indicator("pdf-auto-action", "alta", "Accion automatica en el PDF", "El documento contiene acciones que un lector podria intentar iniciar al abrirse.", `${autoAction} referencia(s) /OpenAction o /AA`, "pdf", "No lo abras en un lector vulnerable; analizalo primero con un antivirus completo."));
  if (launch) indicators.push(indicator("pdf-launch", "critica", "Accion de lanzamiento declarada", "La accion /Launch puede solicitar abrir archivos o aplicaciones externas.", `${launch} referencia(s) /Launch`, "pdf", "Evita abrir este PDF hasta confirmar su legitimidad."));
  if (attachments) indicators.push(indicator("pdf-attachment", "media", "Archivos adjuntos dentro del PDF", "Los adjuntos pueden contener otros formatos que requieren su propio analisis.", `${attachments} referencia(s) a archivos incrustados`, "pdf", "No extraigas ni abras adjuntos inesperados."));
  if (encrypted) indicators.push(indicator("pdf-encrypted", "baja", "PDF cifrado", "El cifrado puede impedir que el analisis estatico vea todo el contenido; tambien es una funcion legitima.", "Entrada /Encrypt", "pdf", "Considera el resultado parcial y verifica el origen."));
  return { indicators, details: { javascriptReferences: javascript, automaticActions: autoAction, launchActions: launch, attachments, links, forms, encrypted } };
}

