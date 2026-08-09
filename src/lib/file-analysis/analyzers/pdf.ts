import { MAX_EMBEDDED_SCAN_BYTES, MAX_TEXT_BYTES } from "../constants";
import { indicator } from "../indicator";
import { evaluateStaticRules, STATIC_RULES } from "../rules";
import { findEmbeddedPe } from "./pe";
import type { AnalysisDetails, Indicator, PositiveCheck } from "../types";

type PdfObject = {
  id: string;
  offset: number;
  dictionary: string;
  stream?: Uint8Array;
  filters: string[];
};

function count(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

function findObjects(bytes: Uint8Array): PdfObject[] {
  const text = new TextDecoder("latin1").decode(bytes.subarray(0, Math.min(bytes.length, MAX_TEXT_BYTES)));
  const objects: PdfObject[] = [];
  const objectPattern = /(\d+)\s+(\d+)\s+obj\b/g;
  let match: RegExpExecArray | null;
  while ((match = objectPattern.exec(text)) && objects.length < 500) {
    const start = match.index;
    const end = text.indexOf("endobj", start);
    if (end < 0) break;
    const body = text.slice(start, Math.min(end, start + 1_000_000));
    const dictMatch = body.match(/<<[\s\S]{0,20000}?>>/);
    const streamMarker = body.indexOf("stream");
    const endStreamMarker = body.indexOf("endstream", streamMarker + 6);
    const filters = [...body.matchAll(/\/Filter\s*(?:\/([A-Za-z0-9]+)|\[(.*?)\])/g)].flatMap((item) => item[1] ? [item[1]] : [...item[2].matchAll(/\/([A-Za-z0-9]+)/g)].map((nested) => nested[1]));
    let stream: Uint8Array | undefined;
    if (streamMarker >= 0 && endStreamMarker > streamMarker) {
      const streamStartInBody = streamMarker + 6 + (body[streamMarker + 6] === "\r" && body[streamMarker + 7] === "\n" ? 2 : body[streamMarker + 6] === "\n" ? 1 : 0);
      stream = bytes.subarray(start + streamStartInBody, Math.min(bytes.length, start + endStreamMarker));
    }
    objects.push({ id: `${match[1]} ${match[2]}`, offset: start, dictionary: dictMatch?.[0] ?? body.slice(0, 20_000), stream, filters });
    objectPattern.lastIndex = end + 6;
  }
  return objects;
}

export function analyzePdf(bytes: Uint8Array): { indicators: Indicator[]; details: AnalysisDetails; checks: PositiveCheck[]; partial: boolean } {
  const text = new TextDecoder("latin1").decode(bytes.subarray(0, Math.min(bytes.length, MAX_TEXT_BYTES)));
  const objects = findObjects(bytes);
  const indicators: Indicator[] = [];
  const checks: PositiveCheck[] = [];
  const objectWith = (token: RegExp) => objects.filter((object) => token.test(object.dictionary));
  const javascriptObjects = objectWith(/\/(?:JavaScript|JS)\b/);
  const openActionObjects = objectWith(/\/OpenAction\b|\/AA\b/);
  const launchObjects = objectWith(/\/Launch\b/);
  const embeddedFileObjects = objectWith(/\/EmbeddedFile\b|\/Filespec\b/);
  const uriObjects = objectWith(/\/URI\b|\/GoToR\b/);
  const forms = count(text, /\/AcroForm\b|\/XFA\b|\/SubmitForm\b/g);
  const encrypted = /\/Encrypt\b/.test(text);
  const compressedStreams = objects.filter((object) => object.stream && object.filters.length > 0);
  const unsupportedCompressed = compressedStreams.filter((object) => object.filters.some((filter) => filter !== "FlateDecode"));

  if (javascriptObjects.length) {
    indicators.push(indicator("pdf-javascript", "alta", "JavaScript incorporado en el PDF", "El documento declara acciones JavaScript. IPLibre no las ejecuta.", `Objeto(s): ${javascriptObjects.slice(0, 5).map((item) => item.id).join(", ")}`, "pdf", "Abre el documento solo en un lector actualizado y con JavaScript desactivado si dudas del origen.", "alta", "pdf"));
  }
  if (openActionObjects.length) {
    indicators.push(indicator("pdf-auto-action", "alta", "Accion automatica en el PDF", "El documento contiene acciones que un lector podria intentar iniciar al abrirse.", `Objeto(s): ${openActionObjects.slice(0, 5).map((item) => item.id).join(", ")}`, "pdf", "No lo abras en un lector vulnerable; analizalo primero con un antivirus completo.", "alta", "pdf"));
  }
  if (launchObjects.length) {
    indicators.push(indicator("pdf-launch", "critica", "Accion de lanzamiento declarada", "La accion /Launch puede solicitar abrir archivos o aplicaciones externas.", `Objeto(s): ${launchObjects.slice(0, 5).map((item) => item.id).join(", ")}`, "pdf", "Evita abrir este PDF hasta confirmar su legitimidad.", "alta", "pdf"));
  }
  if (embeddedFileObjects.length) {
    indicators.push(indicator("pdf-attachment", "media", "Archivos adjuntos dentro del PDF", "Los adjuntos pueden contener otros formatos que requieren su propio analisis.", `Objeto(s): ${embeddedFileObjects.slice(0, 5).map((item) => item.id).join(", ")}`, "pdf", "No extraigas ni abras adjuntos inesperados.", "alta", "pdf"));
    for (const object of embeddedFileObjects) {
      if (!object.stream) continue;
      const embeddedPe = findEmbeddedPe(object.stream, Math.min(object.stream.length, MAX_EMBEDDED_SCAN_BYTES));
      if (embeddedPe) {
        indicators.push(indicator("pdf-embedded-pe", "alta", "Ejecutable PE valido dentro del PDF", "Un stream asociado a archivo incrustado contiene una estructura PE validada, no solo bytes MZ.", `Objeto ${object.id}, desplazamiento ${embeddedPe.offset} dentro del stream`, "pdf", "No abras ni extraigas el adjunto salvo en un entorno aislado.", "alta", "pdf"));
        break;
      }
    }
  }
  if (encrypted) {
    indicators.push(indicator("pdf-encrypted", "baja", "PDF cifrado o protegido", "El cifrado puede impedir que el analisis estatico vea todo el contenido; tambien es una funcion legitima.", "Entrada /Encrypt", "pdf", "Considera el resultado limitado y verifica el origen.", "alta", "pdf"));
  }
  indicators.push(...evaluateStaticRules("pdf", { javascript: javascriptObjects.length > 0, autoAction: openActionObjects.length > 0, externalUri: uriObjects.length > 0 }, STATIC_RULES));

  if (!javascriptObjects.length) checks.push({ id: "pdf-no-javascript", label: "No encontramos JavaScript declarado" });
  if (!openActionObjects.length) checks.push({ id: "pdf-no-openaction", label: "No encontramos acciones automaticas de apertura" });
  if (!launchObjects.length) checks.push({ id: "pdf-no-launch", label: "No encontramos acciones /Launch" });
  if (!embeddedFileObjects.length) checks.push({ id: "pdf-no-attachments", label: "No encontramos archivos adjuntos declarados" });
  if (!encrypted) checks.push({ id: "pdf-not-encrypted", label: "El PDF no declara cifrado" });

  return {
    indicators,
    checks,
    details: {
      pdfObjects: objects.length,
      pdfStreams: objects.filter((object) => object.stream).length,
      javascriptReferences: javascriptObjects.length,
      automaticActions: openActionObjects.length,
      launchActions: launchObjects.length,
      attachments: embeddedFileObjects.length,
      links: uriObjects.length,
      forms,
      encrypted,
      compressedStreams: compressedStreams.length,
      unsupportedCompressedStreams: unsupportedCompressed.length,
    },
    partial: encrypted || unsupportedCompressed.length > 0,
  };
}
