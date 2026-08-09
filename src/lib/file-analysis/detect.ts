import type { DetectedType } from "./types";

export function extensionOf(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

function starts(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

export function detectFileType(bytes: Uint8Array, name = ""): DetectedType {
  const ext = extensionOf(name);
  if (bytes.length === 0) return { id: "empty", label: "Archivo vacio", mime: "application/x-empty", extensions: [], confidence: "alta", analysis: "parcial" };
  if (starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { id: "png", label: "Imagen PNG", mime: "image/png", extensions: ["png"], confidence: "alta", analysis: "profundo" };
  if (starts(bytes, [0xff, 0xd8, 0xff])) return { id: "jpeg", label: "Imagen JPEG", mime: "image/jpeg", extensions: ["jpg", "jpeg", "jpe"], confidence: "alta", analysis: "profundo" };
  if (ascii(bytes, 0, 4) === "%PDF") return { id: "pdf", label: "Documento PDF", mime: "application/pdf", extensions: ["pdf"], confidence: "alta", analysis: "profundo" };
  if (starts(bytes, [0x4d, 0x5a])) return { id: "pe", label: "Ejecutable Windows (PE)", mime: "application/vnd.microsoft.portable-executable", extensions: ["exe", "dll", "scr", "com", "sys", "cpl"], confidence: "alta", analysis: "profundo" };
  if (starts(bytes, [0x50, 0x4b, 0x03, 0x04]) || starts(bytes, [0x50, 0x4b, 0x05, 0x06]) || starts(bytes, [0x50, 0x4b, 0x07, 0x08])) return { id: "zip", label: "Archivo ZIP / Office Open XML", mime: "application/zip", extensions: ["zip", "docx", "xlsx", "pptx", "docm", "xlsm", "pptm", "jar", "apk"], confidence: "alta", analysis: "profundo" };
  if (starts(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return { id: "ole", label: "Documento Office antiguo (OLE)", mime: "application/x-ole-storage", extensions: ["doc", "xls", "ppt", "msi"], confidence: "alta", analysis: "parcial" };
  if (starts(bytes, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07])) return { id: "rar", label: "Archivo RAR", mime: "application/vnd.rar", extensions: ["rar"], confidence: "alta", analysis: "parcial" };
  if (starts(bytes, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return { id: "7z", label: "Archivo 7Z", mime: "application/x-7z-compressed", extensions: ["7z"], confidence: "alta", analysis: "parcial" };
  if (starts(bytes, [0x1f, 0x8b])) return { id: "gzip", label: "Archivo GZIP", mime: "application/gzip", extensions: ["gz", "tgz"], confidence: "alta", analysis: "parcial" };
  if (starts(bytes, [0x7f, 0x45, 0x4c, 0x46])) return { id: "elf", label: "Ejecutable ELF", mime: "application/x-elf", extensions: ["elf", "so", "bin", "run", ""], confidence: "alta", analysis: "parcial" };
  if (bytes.length > 262 && ascii(bytes, 257, 5) === "ustar") return { id: "tar", label: "Archivo TAR", mime: "application/x-tar", extensions: ["tar"], confidence: "alta", analysis: "parcial" };
  const scriptExtensions = ["js", "mjs", "cjs", "vbs", "vbe", "ps1", "bat", "cmd", "hta", "sh"];
  const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, Math.min(bytes.length, 4096)));
  if (scriptExtensions.includes(ext) || /^#!.*\b(?:sh|bash|node|python)\b/m.test(head)) return { id: "script", label: "Script de texto", mime: "text/plain", extensions: scriptExtensions, confidence: scriptExtensions.includes(ext) ? "media" : "alta", analysis: "profundo" };
  const printable = bytes.subarray(0, Math.min(bytes.length, 4096)).reduce((n, b) => n + (b === 9 || b === 10 || b === 13 || (b >= 32 && b < 127) ? 1 : 0), 0);
  if (printable / Math.min(bytes.length, 4096) > 0.85) return { id: "text", label: "Archivo de texto", mime: "text/plain", extensions: ["txt", "csv", "log", "md", "json", "xml", "html", "css"], confidence: "media", analysis: "profundo" };
  return { id: "unknown", label: "Formato binario no identificado", mime: "application/octet-stream", extensions: [], confidence: "baja", analysis: "parcial" };
}

export function hasDoubleExtension(name: string): boolean {
  const parts = name.toLowerCase().split(".");
  if (parts.length < 3) return false;
  const dangerous = new Set(["exe", "dll", "scr", "com", "bat", "cmd", "js", "vbs", "ps1", "hta", "jar", "msi"]);
  return dangerous.has(parts.at(-1) ?? "") && ["pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx", "txt"].includes(parts.at(-2) ?? "");
}

export function extensionMatches(type: DetectedType, extension: string): boolean {
  if (!extension || type.confidence === "baja") return true;
  return type.extensions.includes(extension);
}

