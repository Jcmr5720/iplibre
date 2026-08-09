import { extensionMatches, extensionOf, hasDoubleExtension } from "../detect";
import { shannonEntropy } from "../entropy";
import { indicator } from "../indicator";
import type { DetectedType, Indicator } from "../types";

const EXECUTABLE_EXTENSIONS = new Set(["exe", "dll", "scr", "com", "sys", "cpl", "msi", "jar", "apk", "elf", "so", "run"]);

export function analyzeGeneric(bytes: Uint8Array, name: string, type: DetectedType): { indicators: Indicator[]; entropy: number } {
  const indicators: Indicator[] = [];
  const extension = extensionOf(name);
  if (!extensionMatches(type, extension)) {
    indicators.push(indicator("type-mismatch", "alta", "La extension y el contenido no coinciden", `El nombre declara .${extension}, pero las cabeceras corresponden a ${type.label}.`, `${name} -> ${type.label}`, "formato", "No abras el archivo hasta confirmar su origen y su tipo real.", "alta", "generic"));
  }
  if (hasDoubleExtension(name)) {
    indicators.push(indicator("double-extension", "media", "Nombre con doble extension", "Una extension visible puede ocultar que el archivo termina en un formato ejecutable o de script.", name, "general", "Activa la visualizacion de extensiones y confirma el tipo antes de abrirlo.", "alta", "generic"));
  }
  if (EXECUTABLE_EXTENSIONS.has(extension) || ["pe", "elf"].includes(type.id)) {
    indicators.push(indicator("executable-file", "media", "Archivo ejecutable", "Los ejecutables pueden realizar cambios en el dispositivo. Su presencia no implica malware por si sola.", type.label, "ejecutable", "Ejecutalo solo si confias en la fuente y tras revisarlo con un antivirus completo.", "alta", "generic"));
  }
  if (/\b(?:invoice|factura|pago|urgente|password|contrasena|crack|keygen|update|actualizacion)\b/i.test(name)) {
    indicators.push(indicator("suspicious-name", "baja", "Nombre que merece contexto", "El nombre usa terminos frecuentes en senuelos, aunque tambien puede ser legitimo.", name, "general", "Comprueba quien envio el archivo y si esperabas recibirlo.", "media", "generic"));
  }
  if (bytes.length > 48 * 1024 * 1024) {
    indicators.push(indicator("large-file", "baja", "Archivo de gran tamano", "El tamano dificulta una revision manual y limita algunas comprobaciones locales.", `${(bytes.length / 1024 / 1024).toFixed(1)} MiB`, "general", "Analizalo tambien con una solucion de seguridad actualizada.", "alta", "generic"));
  }
  const entropy = shannonEntropy(bytes);
  if (bytes.length > 4096 && entropy > 7.75 && !["png", "jpeg", "zip", "gzip", "rar", "7z", "pdf"].includes(type.id)) {
    indicators.push(indicator("high-entropy", "media", "Entropia inusualmente alta", "Puede indicar cifrado, compresion, packing u ofuscacion; no demuestra que exista malware.", `${entropy.toFixed(2)} bits por byte`, "general", "Revisa el origen y combina este dato con los demas indicadores.", "media", "generic"));
  }
  return { indicators, entropy };
}
