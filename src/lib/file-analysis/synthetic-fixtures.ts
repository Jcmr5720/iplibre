/** Fixtures generados en memoria. Solo contienen texto y estructuras sinteticas seguras. */
const text = (value: string) => new TextEncoder().encode(value);

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function write16(target: number[], value: number) { target.push(value & 255, (value >>> 8) & 255); }
function write32(target: number[], value: number) { write16(target, value & 0xffff); write16(target, value >>> 16); }

export function makeStoredZip(entries: { name: string; content: Uint8Array; declaredSize?: number }[]): Uint8Array {
  const output: number[] = [];
  const central: number[] = [];
  for (const entry of entries) {
    const name = text(entry.name);
    const offset = output.length;
    const crc = crc32(entry.content);
    output.push(0x50, 0x4b, 0x03, 0x04); write16(output, 20); write16(output, 0); write16(output, 0); write16(output, 0); write16(output, 0); write32(output, crc); write32(output, entry.content.length); write32(output, entry.declaredSize ?? entry.content.length); write16(output, name.length); write16(output, 0); output.push(...name, ...entry.content);
    central.push(0x50, 0x4b, 0x01, 0x02); write16(central, 20); write16(central, 20); write16(central, 0); write16(central, 0); write16(central, 0); write16(central, 0); write32(central, crc); write32(central, entry.content.length); write32(central, entry.declaredSize ?? entry.content.length); write16(central, name.length); write16(central, 0); write16(central, 0); write16(central, 0); write16(central, 0); write32(central, 0); write32(central, offset); central.push(...name);
  }
  const centralOffset = output.length;
  output.push(...central, 0x50, 0x4b, 0x05, 0x06); write16(output, 0); write16(output, 0); write16(output, entries.length); write16(output, entries.length); write32(output, central.length); write32(output, centralOffset); write16(output, 0);
  return new Uint8Array(output);
}

export function makeMinimalPe(): Uint8Array {
  const bytes = new Uint8Array(1024);
  const view = new DataView(bytes.buffer);
  bytes[0] = 0x4d; bytes[1] = 0x5a; view.setUint32(0x3c, 0x80, true);
  bytes.set(text("PE\0\0"), 0x80);
  view.setUint16(0x84, 0x8664, true);
  view.setUint16(0x86, 1, true);
  view.setUint32(0x88, 1_700_000_000, true);
  view.setUint16(0x94, 240, true);
  view.setUint16(0x96, 0x2022, true);
  const optional = 0x98;
  view.setUint16(optional, 0x20b, true);
  view.setUint32(optional + 16, 0x1000, true);
  view.setUint32(optional + 24, 0x400000, true);
  view.setUint32(optional + 28, 1, true);
  view.setUint32(optional + 32, 0x1000, true);
  view.setUint32(optional + 36, 0x200, true);
  view.setUint16(optional + 92, 3, true);
  view.setUint16(optional + 94, 0x8160, true);
  view.setUint32(optional + 108, 16, true);
  const section = optional + 240;
  bytes.set(text(".text\0\0\0"), section);
  view.setUint32(section + 8, 0x200, true);
  view.setUint32(section + 12, 0x1000, true);
  view.setUint32(section + 16, 0x200, true);
  view.setUint32(section + 20, 0x200, true);
  view.setUint32(section + 36, 0x60000020, true);
  bytes.fill(0x90, 0x200, 0x400);
  return bytes;
}

export const syntheticFixtures = {
  normalTxt: text("Documento de prueba sintetico y completamente inocuo.\n"),
  normalJpg: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, ...text("JFIF"), 0xff, 0xd9]),
  normalPng: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 0, 0, 0, 0]),
  normalPdf: text("%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF"),
  pdfWithIncidentalMz: text("%PDF-1.7\n1 0 obj << /Type /Catalog /Metadata (texto MZ dentro de metadata normal) >> endobj\n2 0 obj << /Length 18 >> stream\nimagen MZ falsa\nendstream\nendobj\n%%EOF"),
  flaggedPdf: text("%PDF-1.7\n1 0 obj << /OpenAction 2 0 R /JavaScript /JS (synthetic-test) /Launch >> endobj\n%%EOF"),
  normalScript: text("const saludo = 'hola'; console.log(saludo);"),
  flaggedScript: text("powershell -EncodedCommand U0FGRV9TWU5USEVUSUNfVEVTVA==; Invoke-WebRequest https://example.invalid/test; Start-Process test.exe"),
  minimalPe: makeMinimalPe(),
  normalZip: makeStoredZip([{ name: "nota.txt", content: text("seguro") }]),
  zipWithSyntheticExe: makeStoredZip([{ name: "factura.pdf.exe", content: makeMinimalPe() }]),
  zipBombDeclaration: makeStoredZip([{ name: "datos.bin", content: new Uint8Array([0]), declaredSize: 300 * 1024 * 1024 }]),
  corrupt: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
  empty: new Uint8Array(),
} as const;
