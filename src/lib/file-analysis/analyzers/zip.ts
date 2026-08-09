import { ZIP_LIMITS } from "../constants";
import { hasDoubleExtension } from "../detect";
import { indicator } from "../indicator";
import type { AnalysisDetails, Indicator } from "../types";

type ZipEntry = { name: string; compressed: number; uncompressed: number };

function findEocd(bytes: Uint8Array): number {
  const start = Math.max(0, bytes.length - 65_557);
  for (let i = bytes.length - 22; i >= start; i -= 1) if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) return i;
  return -1;
}

export function readZipEntries(bytes: Uint8Array): { entries: ZipEntry[]; declaredEntries: number; truncated: boolean } {
  const eocd = findEocd(bytes);
  if (eocd < 0) return { entries: [], declaredEntries: 0, truncated: true };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const declaredEntries = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const entries: ZipEntry[] = [];
  for (let i = 0; i < Math.min(declaredEntries, ZIP_LIMITS.maxEntries); i += 1) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) break;
    const compressed = view.getUint32(offset + 20, true);
    const uncompressed = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    if (offset + 46 + nameLength + extraLength + commentLength > bytes.length) break;
    const name = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    entries.push({ name, compressed, uncompressed });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return { entries, declaredEntries, truncated: entries.length !== declaredEntries };
}

export function analyzeZip(bytes: Uint8Array, extension: string): { indicators: Indicator[]; details: AnalysisDetails; partial: boolean; detectedLabel?: string } {
  const { entries, declaredEntries, truncated } = readZipEntries(bytes);
  const indicators: Indicator[] = [];
  const names = entries.map((entry) => entry.name);
  const executable = names.filter((name) => /\.(?:exe|dll|scr|com|msi|cpl|sys)$/i.test(name));
  const scripts = names.filter((name) => /\.(?:js|vbs|vbe|ps1|bat|cmd|hta|sh)$/i.test(name));
  const double = names.filter(hasDoubleExtension);
  const nested = names.filter((name) => /\.(?:zip|rar|7z|gz|tgz|tar)$/i.test(name));
  const totalCompressed = entries.reduce((sum, entry) => sum + entry.compressed, 0);
  const totalUncompressed = entries.reduce((sum, entry) => sum + entry.uncompressed, 0);
  const ratio = totalCompressed ? totalUncompressed / totalCompressed : totalUncompressed ? Infinity : 0;
  const depth = names.reduce((max, name) => Math.max(max, name.split("/").filter(Boolean).length - 1), 0);
  if (executable.length) indicators.push(indicator("archive-executable", "alta", "Ejecutable dentro del archivo", "El contenedor incluye archivos capaces de ejecutarse en Windows.", executable.slice(0, 5).join(", "), "archivo", "No extraigas ni ejecutes esos archivos sin un analisis antivirus completo."));
  if (scripts.length) indicators.push(indicator("archive-script", "media", "Scripts dentro del archivo", "Los scripts pueden automatizar comandos; su presencia requiere contexto.", scripts.slice(0, 5).join(", "), "archivo", "Revisa el contenido de los scripts antes de ejecutarlos."));
  if (double.length) indicators.push(indicator("archive-double-extension", "media", "Nombre engañoso dentro del archivo", "Una entrada combina una extension habitual con otra ejecutable o de script.", double.slice(0, 5).join(", "), "archivo", "No abras esas entradas y verifica el origen del contenedor."));
  if (nested.length) indicators.push(indicator("archive-nested", "media", "Archivos comprimidos anidados", "Varias capas pueden ocultar contenido y dificultar la inspeccion. No implican malware por si solas.", nested.slice(0, 5).join(", "), "archivo", "Extrae solo en un entorno controlado y revisa cada capa."));
  if (ratio > ZIP_LIMITS.maxRatio || totalUncompressed > ZIP_LIMITS.maxExpandedBytes) indicators.push(indicator("zip-bomb-ratio", "critica", "Expansion ZIP potencialmente peligrosa", "Los tamaños declarados superan los limites seguros y podrian agotar memoria o almacenamiento al extraer.", `Ratio ${Number.isFinite(ratio) ? ratio.toFixed(1) : "infinito"}x; ${(totalUncompressed / 1024 / 1024).toFixed(1)} MiB declarados`, "archivo", "No extraigas este archivo en tu dispositivo principal."));
  if (declaredEntries > ZIP_LIMITS.maxEntries || depth > ZIP_LIMITS.maxDepth || truncated) indicators.push(indicator("zip-limits", "media", "Analisis limitado por seguridad", "La estructura supera un limite o es inconsistente; IPLibre detuvo la inspeccion defensiva.", `${declaredEntries} entradas declaradas; profundidad ${depth}`, "archivo", "Trata el resultado como parcial y usa una herramienta especializada en un entorno aislado."));
  const hasWord = names.includes("word/document.xml");
  const hasExcel = names.includes("xl/workbook.xml");
  const hasPowerPoint = names.includes("ppt/presentation.xml");
  const macro = names.some((name) => /vbaProject\.bin$/i.test(name));
  const externalText = new TextDecoder("latin1").decode(bytes.subarray(0, Math.min(bytes.length, 4 * 1024 * 1024)));
  const externalRelations = /TargetMode=["']External["']/i.test(externalText);
  const embedded = names.filter((name) => /\/(?:embeddings|oleObject|activeX)\//i.test(name) || /\.(?:exe|dll|bin)$/i.test(name));
  if (macro || ["docm", "xlsm", "pptm"].includes(extension)) indicators.push(indicator("office-macro", "alta", "Documento con macros", "Las macros VBA pueden ejecutar automatizaciones. No implican malware, pero amplian el riesgo.", macro ? "vbaProject.bin presente" : `Extension .${extension}`, "office", "Abre el documento con macros desactivadas y confirma su procedencia."));
  if (externalRelations) indicators.push(indicator("office-external-relation", "media", "Relaciones externas en Office", "El documento contiene referencias que pueden intentar cargar recursos externos.", "TargetMode=External", "office", "No habilites contenido externo en un documento inesperado."));
  if (embedded.length) indicators.push(indicator("office-embedded-object", "alta", "Objetos incrustados en Office", "El paquete contiene objetos OLE, ActiveX o binarios adicionales.", embedded.slice(0, 5).join(", "), "office", "No actives ni abras objetos incrustados sin verificar el documento."));
  const detectedLabel = hasWord ? "Documento Word (Office Open XML)" : hasExcel ? "Libro Excel (Office Open XML)" : hasPowerPoint ? "Presentacion PowerPoint (Office Open XML)" : undefined;
  return { indicators, details: { entriesInspected: entries.length, entriesDeclared: declaredEntries, totalCompressedBytes: totalCompressed, totalUncompressedBytes: totalUncompressed, expansionRatio: Number.isFinite(ratio) ? Number(ratio.toFixed(2)) : "Infinito", maxDepth: depth, executableEntries: executable, scriptEntries: scripts, officeSubtype: detectedLabel ?? "No detectado", macros: macro }, partial: truncated || declaredEntries > ZIP_LIMITS.maxEntries || totalUncompressed > ZIP_LIMITS.maxExpandedBytes, detectedLabel };
}
