import { describe, expect, it } from "vitest";
import {
  relatedApps,
  menuGroups,
  learnLinks,
  tools,
  footerNav,
  verification,
  CANONICAL_URL,
} from "./config";

describe("verificaciones (Search Console / AdSense)", () => {
  it("expone el código de Search Console suministrado", () => {
    expect(verification.google).toBe("6oiOkE6VjEMaCmA9xY_axcB5dWIl35YioO7gomecuqI");
  });

  it("expone el publisher ID oficial de AdSense", () => {
    expect(verification.adsenseClient).toBe("ca-pub-1569989907195059");
  });
});

describe("otras aplicaciones (relatedApps)", () => {
  it("incluye PDFLibre con su URL oficial", () => {
    const pdf = relatedApps.find((a) => a.name === "PDFLibre");
    expect(pdf).toBeDefined();
    expect(pdf?.href).toBe("https://pdflibre.app");
    expect(pdf?.cta).toBeTruthy();
    expect(pdf?.description).toBeTruthy();
  });

  it("es escalable: todas las entradas tienen forma completa", () => {
    for (const app of relatedApps) {
      expect(app.name).toBeTruthy();
      expect(app.href.startsWith("https://")).toBe(true);
      expect(app.tagline).toBeTruthy();
    }
  });
});

describe("estructura del menú", () => {
  it("agrupa las herramientas sin dejar ninguna fuera", () => {
    const inMenu = menuGroups.flatMap((g) => g.items.map((i) => i.href));
    for (const t of tools) {
      expect(inMenu).toContain(t.href);
    }
  });

  it("incluye una sección 'Aprender' con las guías", () => {
    const aprender = menuGroups.find((g) => g.title === "Aprender");
    expect(aprender).toBeDefined();
    expect(aprender!.items.length).toBeGreaterThanOrEqual(5);
  });
});

describe("footer", () => {
  it("no tiene enlaces con href vacío", () => {
    for (const group of footerNav) {
      for (const item of group.items) {
        expect(item.href).toBeTruthy();
      }
    }
  });
});

describe("enlaces de aprendizaje", () => {
  it("cubre los conceptos clave", () => {
    const hrefs = learnLinks.map((l) => l.href);
    for (const h of ["/que-es-mi-ip", "/que-es-dns", "/que-es-el-ping", "/que-es-el-jitter", "/ipv4-vs-ipv6"]) {
      expect(hrefs).toContain(h);
    }
  });
});

describe("dominio canónico", () => {
  it("es el dominio oficial", () => {
    expect(CANONICAL_URL).toBe("https://iplibre.online");
  });
});
