import { describe, expect, it } from "vitest";
import { analyzeBytes } from "./engine";
import { makeStoredZip, syntheticFixtures } from "./synthetic-fixtures";

const encoder = new TextEncoder();

describe("false-positive-regression", () => {
  it("no eleva PDF normales con texto, formularios, enlaces o MZ incidental", () => {
    const cases = [
      ["texto.pdf", syntheticFixtures.normalPdf],
      ["formulario.pdf", encoder.encode("%PDF-1.7\n1 0 obj << /Type /Catalog /AcroForm 2 0 R >> endobj\n2 0 obj << /Fields [] >> endobj\n%%EOF")],
      ["enlaces.pdf", encoder.encode("%PDF-1.7\n1 0 obj << /Type /Annot /Subtype /Link /A << /URI (https://example.test) >> >> endobj\n%%EOF")],
      ["imagen-fuente-mz.pdf", syntheticFixtures.pdfWithIncidentalMz],
    ] as const;
    for (const [name, bytes] of cases) {
      const result = analyzeBytes(bytes, { name });
      expect(result.score).toBeLessThan(20);
      expect(result.indicators.map((item) => item.id)).not.toEqual(expect.arrayContaining(["embedded-executable", "pdf-embedded-pe", "pdf-launch"]));
    }
  });

  it("mantiene Office normal y enlaces visibles sin alerta grave", () => {
    const docx = makeStoredZip([
      { name: "[Content_Types].xml", content: encoder.encode("<Types></Types>") },
      { name: "word/document.xml", content: encoder.encode("<w:document><w:body><w:p>Hola</w:p></w:body></w:document>") },
      { name: "word/_rels/document.xml.rels", content: encoder.encode("<Relationships><Relationship Target=\"https://example.test\" /></Relationships>") },
    ]);
    const result = analyzeBytes(docx, { name: "normal.docx" });
    expect(result.score).toBeLessThan(20);
    expect(result.indicators.some((item) => item.severity === "alta" || item.severity === "critica")).toBe(false);
  });

  it("no trata JS minificado o Base64 corto legitimo como malware", () => {
    const minified = encoder.encode("function app(){const a='SG9sYSBJUExpYnJl';return a.split('').reverse().join('')}console.log(app());");
    const result = analyzeBytes(minified, { name: "app.min.js" });
    expect(result.score).toBeLessThan(20);
    expect(result.indicators.map((item) => item.id)).not.toContain("script-powershell-download-chain");
  });

  it("reconoce PE sintetico benigno sin convertir imports ausentes en riesgo alto", () => {
    const result = analyzeBytes(syntheticFixtures.minimalPe, { name: "herramienta.exe" });
    expect(result.file.detectedType.id).toBe("pe");
    expect(result.details.peValidation).toBe("Estructura PE validada");
    expect(result.score).toBeLessThan(40);
  });

  it("maneja entradas truncadas o aleatorias sin excepciones no controladas", () => {
    const cases = [
      syntheticFixtures.corrupt,
      new Uint8Array([0x4d, 0x5a, 1, 2, 3, 4, 5]),
      new Uint8Array(Array.from({ length: 2048 }, (_, index) => (index * 31) % 256)),
    ];
    for (const bytes of cases) expect(() => analyzeBytes(bytes, { name: "malformado.bin" })).not.toThrow();
  });
});
