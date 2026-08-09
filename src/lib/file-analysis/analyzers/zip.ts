import { ZIP_LIMITS } from "../constants";
import { detectFileType, hasDoubleExtension } from "../detect";
import { indicator } from "../indicator";
import { analyzeScript } from "./script";
import { findEmbeddedPe, validatePeStructure } from "./pe";
import type { AnalysisDetails, Indicator, PositiveCheck } from "../types";

type ZipEntry = { name: string; compressed: number; uncompressed: number; method: number; flags: number; localOffset: number };

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
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressed = view.getUint32(offset + 20, true);
    const uncompressed = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    if (offset + 46 + nameLength + extraLength + commentLength > bytes.length) break;
    const name = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    entries.push({ name, compressed, uncompressed, method, flags, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return { entries, declaredEntries, truncated: entries.length !== declaredEntries };
}

function readStoredEntry(bytes: Uint8Array, entry: ZipEntry): Uint8Array | null {
  if (entry.method !== 0 || entry.compressed > 4 * 1024 * 1024 || entry.localOffset + 30 > bytes.length) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(entry.localOffset, true) !== 0x04034b50) return null;
  const nameLength = view.getUint16(entry.localOffset + 26, true);
  const extraLength = view.getUint16(entry.localOffset + 28, true);
  const start = entry.localOffset + 30 + nameLength + extraLength;
  const end = start + entry.compressed;
  return end <= bytes.length ? bytes.subarray(start, end) : null;
}

export function analyzeZip(bytes: Uint8Array, extension: string): { indicators: Indicator[]; details: AnalysisDetails; checks: PositiveCheck[]; partial: boolean; detectedLabel?: string } {
  const { entries, declaredEntries, truncated } = readZipEntries(bytes);
  const indicators: Indicator[] = [];
  const checks: PositiveCheck[] = [];
  const names = entries.map((entry) => entry.name);
  const executable = names.filter((name) => /\.(?:exe|dll|scr|com|msi|cpl|sys)$/i.test(name));
  const scripts = names.filter((name) => /\.(?:js|vbs|vbe|ps1|bat|cmd|hta|sh)$/i.test(name));
  const double = names.filter(hasDoubleExtension);
  const nested = names.filter((name) => /\.(?:zip|rar|7z|gz|tgz|tar)$/i.test(name));
  const encryptedEntries = entries.filter((entry) => (entry.flags & 1) === 1);
  const totalCompressed = entries.reduce((sum, entry) => sum + entry.compressed, 0);
  const totalUncompressed = entries.reduce((sum, entry) => sum + entry.uncompressed, 0);
  const ratio = totalCompressed ? totalUncompressed / totalCompressed : totalUncompressed ? Infinity : 0;
  const depth = names.reduce((max, name) => Math.max(max, name.split("/").filter(Boolean).length - 1), 0);

  if (executable.length) indicators.push(indicator("archive-executable", "alta", "Ejecutable dentro del archivo", "El contenedor incluye archivos capaces de ejecutarse en Windows.", executable.slice(0, 5).join(", "), "archivo", "No extraigas ni ejecutes esos archivos sin un analisis antivirus completo.", "alta", "archive"));
  if (scripts.length) indicators.push(indicator("archive-script", "media", "Scripts dentro del archivo", "Los scripts pueden automatizar comandos; su presencia requiere contexto.", scripts.slice(0, 5).join(", "), "archivo", "Revisa el contenido de los scripts antes de ejecutarlos.", "alta", "archive"));
  if (double.length) indicators.push(indicator("archive-double-extension", "media", "Nombre enganoso dentro del archivo", "Una entrada combina una extension habitual con otra ejecutable o de script.", double.slice(0, 5).join(", "), "archivo", "No abras esas entradas y verifica el origen del contenedor.", "alta", "archive"));
  if (nested.length) indicators.push(indicator("archive-nested", "media", "Archivos comprimidos anidados", "Varias capas pueden ocultar contenido y dificultar la inspeccion. No implican malware por si solas.", nested.slice(0, 5).join(", "), "archivo", "Extrae solo en un entorno controlado y revisa cada capa.", "media", "archive"));
  if (ratio > ZIP_LIMITS.maxRatio || totalUncompressed > ZIP_LIMITS.maxExpandedBytes) indicators.push(indicator("zip-bomb-ratio", "critica", "Expansion ZIP potencialmente peligrosa", "Los tamanos declarados superan los limites seguros y podrian agotar memoria o almacenamiento al extraer.", `Ratio ${Number.isFinite(ratio) ? ratio.toFixed(1) : "infinito"}x; ${(totalUncompressed / 1024 / 1024).toFixed(1)} MiB declarados`, "archivo", "No extraigas este archivo en tu dispositivo principal.", "alta", "archive"));
  if (declaredEntries > ZIP_LIMITS.maxEntries || depth > ZIP_LIMITS.maxDepth || truncated) indicators.push(indicator("zip-limits", "media", "Analisis limitado por seguridad", "La estructura supera un limite o es inconsistente; IPLibre detuvo la inspeccion defensiva.", `${declaredEntries} entradas declaradas; profundidad ${depth}`, "archivo", "Trata el resultado como parcial y usa una herramienta especializada en un entorno aislado.", "alta", "archive"));
  if (encryptedEntries.length) indicators.push(indicator("archive-encrypted", "baja", "Entradas cifradas en el contenedor", "El contenido cifrado limita el analisis estatico; no significa malware por si solo.", `${encryptedEntries.length} entrada(s) cifrada(s)`, "archivo", "Considera la cobertura limitada y verifica el origen.", "alta", "archive"));

  const hasWord = names.includes("word/document.xml");
  const hasExcel = names.includes("xl/workbook.xml");
  const hasPowerPoint = names.includes("ppt/presentation.xml");
  const macro = names.some((name) => /vbaProject\.bin$/i.test(name));
  const externalText = new TextDecoder("latin1").decode(bytes.subarray(0, Math.min(bytes.length, 4 * 1024 * 1024)));
  const externalRelations = /TargetMode=["']External["']/i.test(externalText);
  const embedded = names.filter((name) => /\/(?:embeddings|oleObject|activeX)\//i.test(name) || /\.(?:exe|dll|bin)$/i.test(name));
  const customUi = names.some((name) => /customUI\//i.test(name));
  const externalTemplates = /attachedTemplate|TargetMode=["']External["'][^>]+(?:dotm|dotx|xltm|potm)/i.test(externalText);
  const dde = /DDEAUTO|DDE|ddeLink/i.test(externalText);
  if (macro || ["docm", "xlsm", "pptm"].includes(extension)) indicators.push(indicator("office-macro", "alta", "Documento con macros", "Las macros VBA pueden ejecutar automatizaciones. No implican malware, pero amplian el riesgo.", macro ? "vbaProject.bin presente" : `Extension .${extension}`, "office", "Abre el documento con macros desactivadas y confirma su procedencia.", macro ? "alta" : "media", "office"));
  if (externalRelations || externalTemplates) indicators.push(indicator("office-external-relation", "media", "Relaciones externas en Office", "El documento contiene referencias que pueden intentar cargar recursos externos.", externalTemplates ? "Plantilla externa o TargetMode=External" : "TargetMode=External", "office", "No habilites contenido externo en un documento inesperado.", "alta", "office"));
  if (embedded.length) indicators.push(indicator("office-embedded-object", "alta", "Objetos incrustados en Office", "El paquete contiene objetos OLE, ActiveX o binarios adicionales.", embedded.slice(0, 5).join(", "), "office", "No actives ni abras objetos incrustados sin verificar el documento.", "alta", "office"));
  if (dde) indicators.push(indicator("office-dde", "alta", "Referencias DDE en Office", "DDE puede iniciar comandos externos desde documentos Office antiguos o preparados.", "Cadena DDE/DDEAUTO visible", "office", "No habilites contenido ni enlaces externos si el documento no era esperado.", "media", "office"));

  let storedEntriesInspected = 0;
  for (const entry of entries.slice(0, 80)) {
    const content = readStoredEntry(bytes, entry);
    if (!content) continue;
    storedEntriesInspected += 1;
    const type = detectFileType(content, entry.name);
    if (type.id === "pe" && validatePeStructure(content).valid) {
      indicators.push(indicator("archive-valid-pe", "alta", "PE valido dentro del contenedor", "Una entrada contiene una estructura PE completa y validada.", entry.name, "archivo", "No ejecutes esa entrada sin un analisis dedicado.", "alta", "archive"));
    } else if (type.id === "script") {
      const scriptResult = analyzeScript(content);
      indicators.push(...scriptResult.indicators.map((item) => ({ ...item, id: `archive-${item.id}`, evidence: `${entry.name}: ${item.evidence}`, family: "archive" })));
    } else {
      const embeddedPe = findEmbeddedPe(content);
      if (embeddedPe) indicators.push(indicator("archive-valid-pe", "alta", "PE valido dentro del contenedor", "Una entrada contiene una estructura PE completa y validada.", `${entry.name}, offset ${embeddedPe.offset}`, "archivo", "No ejecutes esa entrada sin un analisis dedicado.", "alta", "archive"));
    }
  }

  if (!executable.length) checks.push({ id: "zip-no-executables", label: "No encontramos ejecutables por nombre dentro del contenedor" });
  if (!scripts.length) checks.push({ id: "zip-no-scripts", label: "No encontramos scripts por nombre dentro del contenedor" });
  if (!macro) checks.push({ id: "office-no-macros", label: "No detectamos vbaProject.bin" });
  if (!externalRelations) checks.push({ id: "office-no-external-relations", label: "No detectamos relaciones externas visibles" });

  const isApk = extension === "apk" || names.includes("AndroidManifest.xml");
  const isJar = extension === "jar" || names.some((name) => /^META-INF\/MANIFEST\.MF$/i.test(name));
  const detectedLabel = isApk ? "APK Android" : isJar ? "Archivo JAR" : hasWord ? "Documento Word (Office Open XML)" : hasExcel ? "Libro Excel (Office Open XML)" : hasPowerPoint ? "Presentacion PowerPoint (Office Open XML)" : undefined;
  return {
    indicators,
    checks,
    details: {
      entriesInspected: entries.length,
      entriesDeclared: declaredEntries,
      storedEntriesInspected,
      totalCompressedBytes: totalCompressed,
      totalUncompressedBytes: totalUncompressed,
      expansionRatio: Number.isFinite(ratio) ? Number(ratio.toFixed(2)) : "Infinito",
      maxDepth: depth,
      encryptedEntries: encryptedEntries.length,
      executableEntries: executable,
      scriptEntries: scripts,
      officeSubtype: detectedLabel ?? "No detectado",
      macros: macro,
      activeXOrCustomUi: customUi || names.some((name) => /activeX/i.test(name)),
      externalTemplates,
      dde,
      apkManifest: isApk && names.includes("AndroidManifest.xml"),
      apkDex: isApk && names.some((name) => /\.dex$/i.test(name)),
      apkNativeLibraries: isApk ? names.filter((name) => /^lib\/.*\.so$/i.test(name)).length : 0,
      jarManifest: isJar && names.some((name) => /^META-INF\/MANIFEST\.MF$/i.test(name)),
    },
    partial: truncated || encryptedEntries.length > 0 || declaredEntries > ZIP_LIMITS.maxEntries || totalUncompressed > ZIP_LIMITS.maxExpandedBytes,
    detectedLabel,
  };
}
