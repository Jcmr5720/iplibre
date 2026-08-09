import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CANONICAL_URL, footerNav, tools } from "@/lib/config";
import { indexableRoutes, nonIndexableRoutes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

const appDir = path.join(process.cwd(), "src", "app");

function pageFile(route: string): string {
  return route === "/"
    ? path.join(appDir, "page.tsx")
    : path.join(appDir, route.slice(1), "page.tsx");
}

describe("metadata basica", () => {
  it("pageMetadata genera canonical y Open Graph absolutos en el dominio oficial", () => {
    const metadata = pageMetadata({
      title: "Prueba",
      description: "Descripcion de prueba",
      path: "/ssl-checker",
    });
    expect(metadata.alternates?.canonical).toBe(`${CANONICAL_URL}/ssl-checker`);
    expect(metadata.openGraph?.url).toBe(`${CANONICAL_URL}/ssl-checker`);
  });

  it("cada URL indexable tiene metadata declarada o hereda la home del layout", () => {
    const missing = indexableRoutes
      .map((route) => route.path || "/")
      .filter((route) => route !== "/")
      .filter((route) => !fs.readFileSync(pageFile(route), "utf8").includes("export const metadata"));
    expect(missing).toEqual([]);
  });

  it("la unica pagina noindex declarada queda fuera del sitemap", () => {
    const source = fs.readFileSync(pageFile("/donar/exito"), "utf8");
    expect(source).toContain("robots");
    expect(source).toContain("index: false");
    expect(indexableRoutes.map((route) => route.path)).not.toContain(nonIndexableRoutes[0]);
  });
});

describe("enlazado interno rastreable", () => {
  it("/herramientas renderiza todas las herramientas desde la fuente central", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src", "components", "home", "ToolsGrid.tsx"), "utf8");
    expect(source).toContain("toolCategories.map");
    expect(source).toContain("<Link");
    expect(source).toContain("href={tool.href}");
  });

  it("el footer enlaza todas las herramientas", () => {
    const footerTools = new Set(footerNav.flatMap((group) => group.items.map((item) => item.href)));
    for (const tool of tools) expect(footerTools.has(tool.href)).toBe(true);
  });

  it("las herramientas tienen al menos dos rutas internas de descubrimiento", () => {
    const homeSource = fs.readFileSync(path.join(appDir, "page.tsx"), "utf8");
    const navSource = fs.readFileSync(path.join(process.cwd(), "src", "components", "layout", "Header.tsx"), "utf8");
    const weak: string[] = [];
    for (const tool of tools) {
      let count = 0;
      count += 1; // /herramientas
      count += 1; // footer
      if (homeSource.includes(tool.href)) count += 1;
      if (navSource.includes(tool.href)) count += 1;
      if (count < 2) weak.push(tool.href);
    }
    expect(weak).toEqual([]);
  });
});
