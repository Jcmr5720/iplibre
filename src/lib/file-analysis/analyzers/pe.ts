import { shannonEntropy } from "../entropy";
import { indicator } from "../indicator";
import type { AnalysisDetails, Indicator } from "../types";

function safeAscii(bytes: Uint8Array, start: number, length: number): string {
  if (start < 0 || start + length > bytes.length) return "";
  return String.fromCharCode(...bytes.subarray(start, start + length)).replace(/\0.*$/, "");
}

export function analyzePe(bytes: Uint8Array): { indicators: Indicator[]; details: AnalysisDetails; partial: boolean } {
  const indicators: Indicator[] = [];
  const details: AnalysisDetails = { mzHeader: true };
  if (bytes.length < 64) return { indicators: [indicator("pe-invalid", "media", "Ejecutable truncado o corrupto", "La cabecera MZ existe, pero el archivo es demasiado corto para una estructura PE valida.", `${bytes.length} bytes`, "ejecutable", "No intentes ejecutarlo; consigue una copia valida de una fuente fiable.")], details, partial: true };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const peOffset = view.getUint32(0x3c, true);
  if (peOffset > bytes.length - 24 || safeAscii(bytes, peOffset, 4) !== "PE") return { indicators: [indicator("pe-invalid", "media", "Firma PE ausente o inconsistente", "El archivo empieza por MZ, pero no contiene una cabecera PE valida en el desplazamiento declarado.", `e_lfanew=${peOffset}`, "ejecutable", "No ejecutes un archivo con estructura inconsistente.")], details: { ...details, peOffset }, partial: true };
  const machine = view.getUint16(peOffset + 4, true);
  const sectionCount = Math.min(view.getUint16(peOffset + 6, true), 96);
  const timestamp = view.getUint32(peOffset + 8, true);
  const optionalSize = view.getUint16(peOffset + 20, true);
  const sectionTable = peOffset + 24 + optionalSize;
  const machineNames: Record<number, string> = { 0x14c: "x86", 0x8664: "x64", 0x1c0: "ARM", 0xaa64: "ARM64" };
  const sectionNames: string[] = [];
  const sections: { virtualAddress: number; virtualSize: number; rawOffset: number; rawSize: number }[] = [];
  let imageEnd = 0;
  for (let i = 0; i < sectionCount; i += 1) {
    const offset = sectionTable + i * 40;
    if (offset + 40 > bytes.length) break;
    const name = safeAscii(bytes, offset, 8) || `(seccion ${i + 1})`;
    const rawSize = view.getUint32(offset + 16, true);
    const rawOffset = view.getUint32(offset + 20, true);
    sections.push({ virtualAddress: view.getUint32(offset + 12, true), virtualSize: view.getUint32(offset + 8, true), rawOffset, rawSize });
    sectionNames.push(name);
    imageEnd = Math.max(imageEnd, rawOffset + rawSize);
    if (rawSize > 4096 && rawOffset < bytes.length) {
      const end = Math.min(bytes.length, rawOffset + rawSize);
      const entropy = shannonEntropy(bytes.subarray(rawOffset, end), 262_144);
      if (entropy > 7.7) indicators.push(indicator("pe-packed-section", "media", "Seccion PE con entropia alta", "Una seccion muy uniforme puede estar comprimida, cifrada o empaquetada; tambien puede contener recursos legitimos.", `${name}: ${entropy.toFixed(2)} bits por byte`, "ejecutable", "Confirma la firma y el origen del ejecutable antes de usarlo."));
    }
  }
  const optionalOffset = peOffset + 24;
  const optionalMagic = optionalSize >= 2 ? view.getUint16(optionalOffset, true) : 0;
  const dataDirectoryOffset = optionalOffset + (optionalMagic === 0x20b ? 112 : 96);
  const rvaToOffset = (rva: number): number | null => {
    const section = sections.find((item) => rva >= item.virtualAddress && rva < item.virtualAddress + Math.max(item.virtualSize, item.rawSize));
    if (!section) return null;
    const offset = section.rawOffset + (rva - section.virtualAddress);
    return offset < bytes.length ? offset : null;
  };
  const importedLibraries: string[] = [];
  let hasResources = false;
  if ((optionalMagic === 0x10b || optionalMagic === 0x20b) && dataDirectoryOffset + 24 <= optionalOffset + optionalSize && dataDirectoryOffset + 24 <= bytes.length) {
    const importRva = view.getUint32(dataDirectoryOffset + 8, true);
    const resourceRva = view.getUint32(dataDirectoryOffset + 16, true);
    hasResources = resourceRva !== 0;
    const importOffset = rvaToOffset(importRva);
    if (importOffset !== null) {
      for (let i = 0; i < 128; i += 1) {
        const descriptor = importOffset + i * 20;
        if (descriptor + 20 > bytes.length) break;
        const nameRva = view.getUint32(descriptor + 12, true);
        if (!nameRva) break;
        const nameOffset = rvaToOffset(nameRva);
        if (nameOffset === null) break;
        let end = nameOffset;
        while (end < Math.min(bytes.length, nameOffset + 260) && bytes[end] !== 0) end += 1;
        const library = safeAscii(bytes, nameOffset, end - nameOffset);
        if (library) importedLibraries.push(library);
      }
    }
  }
  if (imageEnd > 0 && bytes.length - imageEnd > 64 * 1024) indicators.push(indicator("pe-overlay", "baja", "Datos adicionales tras la imagen PE", "El archivo contiene datos despues de la ultima seccion. Algunos instaladores lo hacen legitimamente.", `${bytes.length - imageEnd} bytes adicionales`, "ejecutable", "Comprueba si el archivo es un instalador esperado y verifica su procedencia."));
  return { indicators, details: { ...details, peSignature: true, architecture: machineNames[machine] ?? `0x${machine.toString(16)}`, sections: sectionCount, sectionNames, timestamp: timestamp ? new Date(timestamp * 1000).toISOString() : "No disponible", importedLibraries, hasResources, overlayBytes: Math.max(0, bytes.length - imageEnd) }, partial: sectionNames.length !== sectionCount };
}
