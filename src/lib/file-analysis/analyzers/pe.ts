import { shannonEntropy } from "../entropy";
import { indicator } from "../indicator";
import type { AnalysisDetails, Indicator } from "../types";

type PeSection = {
  name: string;
  virtualAddress: number;
  virtualSize: number;
  rawOffset: number;
  rawSize: number;
};

type PeValidation = {
  valid: boolean;
  reason?: string;
  peOffset?: number;
  machine?: number;
  sectionCount?: number;
  optionalMagic?: number;
  optionalSize?: number;
  sections: PeSection[];
  entryPointRva?: number;
  subsystem?: number;
  dllCharacteristics?: number;
  timestamp?: number;
  dataDirectoryOffset?: number;
  imageEnd?: number;
};

function readAscii(bytes: Uint8Array, start: number, length: number): string {
  if (start < 0 || start + length > bytes.length) return "";
  return String.fromCharCode(...bytes.subarray(start, start + length)).replace(/\0.*$/, "");
}

function readCString(bytes: Uint8Array, start: number, max = 260): string {
  if (start < 0 || start >= bytes.length) return "";
  let end = start;
  while (end < Math.min(bytes.length, start + max) && bytes[end] !== 0) end += 1;
  return readAscii(bytes, start, end - start);
}

export function validatePeStructure(bytes: Uint8Array, start = 0): PeValidation {
  const remaining = bytes.length - start;
  if (remaining < 160) return { valid: false, reason: "muy corto", sections: [] };
  if (bytes[start] !== 0x4d || bytes[start + 1] !== 0x5a) return { valid: false, reason: "sin MZ", sections: [] };
  const view = new DataView(bytes.buffer, bytes.byteOffset + start, remaining);
  const peOffset = view.getUint32(0x3c, true);
  if (peOffset < 0x40 || peOffset > remaining - 24) return { valid: false, reason: "e_lfanew fuera de limites", peOffset, sections: [] };
  if (readAscii(bytes, start + peOffset, 4) !== "PE") return { valid: false, reason: "firma PE ausente", peOffset, sections: [] };

  const machine = view.getUint16(peOffset + 4, true);
  const sectionCount = view.getUint16(peOffset + 6, true);
  const timestamp = view.getUint32(peOffset + 8, true);
  const optionalSize = view.getUint16(peOffset + 20, true);
  const characteristics = view.getUint16(peOffset + 22, true);
  const optionalOffset = peOffset + 24;
  const sectionTable = optionalOffset + optionalSize;
  if (![0x14c, 0x8664, 0x1c0, 0xaa64].includes(machine)) return { valid: false, reason: "arquitectura COFF no reconocida", peOffset, machine, sectionCount, optionalSize, sections: [] };
  if (sectionCount < 1 || sectionCount > 96) return { valid: false, reason: "numero de secciones invalido", peOffset, machine, sectionCount, optionalSize, sections: [] };
  if (optionalSize < 64 || sectionTable + sectionCount * 40 > remaining) return { valid: false, reason: "optional header o secciones fuera de limites", peOffset, machine, sectionCount, optionalSize, sections: [] };
  const optionalMagic = view.getUint16(optionalOffset, true);
  if (optionalMagic !== 0x10b && optionalMagic !== 0x20b) return { valid: false, reason: "optional header no PE32/PE32+", peOffset, machine, sectionCount, optionalMagic, optionalSize, sections: [] };
  const minOptional = optionalMagic === 0x20b ? 112 : 96;
  if (optionalSize < minOptional) return { valid: false, reason: "optional header truncado", peOffset, machine, sectionCount, optionalMagic, optionalSize, sections: [] };

  const sections: PeSection[] = [];
  let imageEnd = 0;
  for (let i = 0; i < sectionCount; i += 1) {
    const offset = sectionTable + i * 40;
    const rawSize = view.getUint32(offset + 16, true);
    const rawOffset = view.getUint32(offset + 20, true);
    const section = {
      name: readAscii(bytes, start + offset, 8) || `(seccion ${i + 1})`,
      virtualSize: view.getUint32(offset + 8, true),
      virtualAddress: view.getUint32(offset + 12, true),
      rawSize,
      rawOffset,
    };
    if (rawSize && (rawOffset < optionalOffset || rawOffset > remaining || rawOffset + rawSize > remaining)) return { valid: false, reason: "seccion fuera del archivo", peOffset, machine, sectionCount, optionalMagic, optionalSize, sections };
    sections.push(section);
    imageEnd = Math.max(imageEnd, rawOffset + rawSize);
  }

  const entryPointRva = view.getUint32(optionalOffset + 16, true);
  const subsystemOffset = optionalMagic === 0x20b ? optionalOffset + 92 : optionalOffset + 68;
  return {
    valid: Boolean(characteristics),
    reason: characteristics ? undefined : "caracteristicas COFF vacias",
    peOffset,
    machine,
    sectionCount,
    optionalMagic,
    optionalSize,
    sections,
    entryPointRva,
    subsystem: view.getUint16(subsystemOffset, true),
    dllCharacteristics: view.getUint16(subsystemOffset + 2, true),
    timestamp,
    dataDirectoryOffset: optionalOffset + minOptional,
    imageEnd,
  };
}

export function findEmbeddedPe(bytes: Uint8Array, maxBytes = bytes.length): { offset: number; validation: PeValidation } | null {
  const limit = Math.min(bytes.length - 1, maxBytes);
  for (let i = 1; i < limit; i += 1) {
    if (bytes[i] !== 0x4d || bytes[i + 1] !== 0x5a) continue;
    const validation = validatePeStructure(bytes, i);
    if (validation.valid) return { offset: i, validation };
  }
  return null;
}

function rvaToOffset(rva: number, sections: PeSection[], bytesLength: number): number | null {
  const section = sections.find((item) => rva >= item.virtualAddress && rva < item.virtualAddress + Math.max(item.virtualSize, item.rawSize));
  if (!section) return null;
  const offset = section.rawOffset + (rva - section.virtualAddress);
  return offset >= 0 && offset < bytesLength ? offset : null;
}

export function analyzePe(bytes: Uint8Array): { indicators: Indicator[]; details: AnalysisDetails; partial: boolean } {
  const indicators: Indicator[] = [];
  const validation = validatePeStructure(bytes);
  const details: AnalysisDetails = { mzHeader: bytes[0] === 0x4d && bytes[1] === 0x5a };
  if (!validation.valid) {
    return {
      indicators: [indicator("pe-invalid", "media", "Estructura PE no validada", "Existe una cabecera MZ, pero la estructura PE no supera las comprobaciones necesarias.", validation.reason ?? "Cabecera inconsistente", "ejecutable", "No ejecutes un archivo con estructura inconsistente.", "alta", "pe")],
      details: { ...details, peOffset: validation.peOffset ?? "No disponible", validationError: validation.reason ?? "No disponible" },
      partial: true,
    };
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const machineNames: Record<number, string> = { 0x14c: "x86", 0x8664: "x64", 0x1c0: "ARM", 0xaa64: "ARM64" };
  const importedLibraries: string[] = [];
  const importedFunctions: string[] = [];
  let hasResources = false;
  let hasExports = false;
  let hasSecurityDirectory = false;
  let hasDebugDirectory = false;
  const dataDirectoryOffset = validation.dataDirectoryOffset ?? 0;
  if (dataDirectoryOffset + 64 <= (validation.peOffset ?? 0) + 24 + (validation.optionalSize ?? 0) && dataDirectoryOffset + 64 <= bytes.length) {
    const exportRva = view.getUint32(dataDirectoryOffset, true);
    const importRva = view.getUint32(dataDirectoryOffset + 8, true);
    const resourceRva = view.getUint32(dataDirectoryOffset + 16, true);
    const securitySize = view.getUint32(dataDirectoryOffset + 36, true);
    const debugRva = view.getUint32(dataDirectoryOffset + 48, true);
    hasExports = exportRva !== 0;
    hasResources = resourceRva !== 0;
    hasSecurityDirectory = securitySize !== 0;
    hasDebugDirectory = debugRva !== 0;
    const importOffset = rvaToOffset(importRva, validation.sections, bytes.length);
    if (importOffset !== null) {
      for (let i = 0; i < 128; i += 1) {
        const descriptor = importOffset + i * 20;
        if (descriptor + 20 > bytes.length) break;
        const thunkRva = view.getUint32(descriptor, true) || view.getUint32(descriptor + 16, true);
        const nameRva = view.getUint32(descriptor + 12, true);
        if (!nameRva) break;
        const nameOffset = rvaToOffset(nameRva, validation.sections, bytes.length);
        if (nameOffset === null) break;
        const library = readCString(bytes, nameOffset);
        if (library) importedLibraries.push(library);
        const thunkOffset = rvaToOffset(thunkRva, validation.sections, bytes.length);
        if (thunkOffset !== null) {
          for (let t = 0; t < 64; t += 1) {
            const itemOffset = thunkOffset + t * (validation.optionalMagic === 0x20b ? 8 : 4);
            if (itemOffset + 4 > bytes.length) break;
            const hintNameRva = view.getUint32(itemOffset, true);
            if (!hintNameRva) break;
            const hintNameOffset = rvaToOffset(hintNameRva, validation.sections, bytes.length);
            if (hintNameOffset !== null) {
              const fn = readCString(bytes, hintNameOffset + 2, 120);
              if (fn) importedFunctions.push(fn);
            }
          }
        }
      }
    }
  }

  for (const section of validation.sections) {
    if (section.rawSize > 4096 && section.rawOffset < bytes.length) {
      const end = Math.min(bytes.length, section.rawOffset + section.rawSize);
      const entropy = shannonEntropy(bytes.subarray(section.rawOffset, end), 262_144);
      if (entropy > 7.7) indicators.push(indicator("pe-packed-section", "media", "Seccion PE con entropia alta", "La seccion puede estar comprimida, cifrada o empaquetada. Esta señal necesita contexto.", `${section.name}: ${entropy.toFixed(2)} bits por byte`, "ejecutable", "Verifica la firma y el origen del ejecutable antes de usarlo.", "media", "pe"));
    }
  }

  const imports = new Set(importedFunctions.map((name) => name.toLowerCase()));
  const injection = ["virtualalloc", "virtualprotect", "writeprocessmemory", "createremotethread", "openprocess"].filter((name) => imports.has(name));
  const network = ["urldownloadtofilea", "urldownloadtofilew", "internetopen", "internetreadfile"].filter((name) => imports.has(name));
  const execution = ["winexec", "shellexecutea", "shellexecutew", "createprocessa", "createprocessw"].filter((name) => imports.has(name));
  if (injection.length >= 3) indicators.push(indicator("pe-injection-imports", "alta", "Imports PE compatibles con inyeccion de procesos", "Varias APIs de memoria/proceso aparecen juntas. La combinacion es mas relevante que una API aislada.", injection.join(", "), "ejecutable", "Revisa firma, reputacion y origen antes de ejecutar.", "media", "pe"));
  if (network.length && execution.length) indicators.push(indicator("pe-network-execution-imports", "alta", "Imports PE combinan red y ejecucion", "El ejecutable importa funciones de descarga y creacion de procesos.", [...network, ...execution].join(", "), "ejecutable", "Ejecutalo solo si esperabas ese comportamiento.", "media", "pe"));

  const overlayBytes = Math.max(0, bytes.length - (validation.imageEnd ?? bytes.length));
  if (overlayBytes > 64 * 1024) indicators.push(indicator("pe-overlay", "baja", "Datos adicionales tras la imagen PE", "El archivo contiene datos despues de la ultima seccion. Algunos instaladores lo hacen legitimamente.", `${overlayBytes} bytes adicionales`, "ejecutable", "Comprueba si el archivo es un instalador esperado y verifica su procedencia.", "media", "pe"));

  return {
    indicators,
    details: {
      ...details,
      peSignature: true,
      peValidation: "Estructura PE validada",
      architecture: machineNames[validation.machine ?? 0] ?? `0x${(validation.machine ?? 0).toString(16)}`,
      sections: validation.sectionCount ?? validation.sections.length,
      sectionNames: validation.sections.map((section) => section.name),
      timestamp: validation.timestamp ? new Date(validation.timestamp * 1000).toISOString() : "No disponible",
      entryPointRva: validation.entryPointRva ?? 0,
      subsystem: validation.subsystem ?? 0,
      dllCharacteristics: validation.dllCharacteristics ?? 0,
      importedLibraries,
      importedFunctions: importedFunctions.slice(0, 40),
      hasExports,
      hasResources,
      hasSecurityDirectory,
      hasDebugDirectory,
      overlayBytes,
    },
    partial: false,
  };
}
