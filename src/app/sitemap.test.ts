import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CANONICAL_URL, tools } from "@/lib/config";
import { indexableRoutes, nonIndexableRoutes } from "@/lib/routes";
import sitemap from "./sitemap";
import robots from "./robots";

const appDir = path.join(process.cwd(), "src", "app");

function pageRoutes(): string[] {
  const routes: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      if (entry.isFile() && entry.name === "page.tsx") {
        const route = `/${path.relative(appDir, path.dirname(full)).replace(/\\/g, "/")}`;
        routes.push(route === "/." ? "/" : route);
      }
    }
  }
  walk(appDir);
  return routes.sort();
}

describe("inventario SEO", () => {
  it("todas las page routes estan clasificadas como indexables o noindex", () => {
    const known = new Set([
      ...indexableRoutes.map((route) => route.path || "/"),
      ...nonIndexableRoutes,
    ]);
    expect(pageRoutes().filter((route) => !known.has(route))).toEqual([]);
  });

  it("todas las herramientas reales estan en la fuente unica de rutas indexables", () => {
    const paths = new Set(indexableRoutes.map((route) => route.path));
    for (const tool of tools) expect(paths.has(tool.href)).toBe(true);
  });
});

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  it("coincide exactamente con las URLs indexables", () => {
    const expected = indexableRoutes.map((route) => `${CANONICAL_URL}${route.path}`);
    expect([...urls].sort()).toEqual([...expected].sort());
  });

  it("no contiene duplicados, HTTP, www, parametros, API ni noindex", () => {
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expect(url.startsWith(CANONICAL_URL)).toBe(true);
      expect(url).not.toMatch(/^http:\/\//);
      expect(url).not.toContain("://www.");
      expect(url).not.toContain("?");
      expect(url).not.toContain("/api/");
      for (const noindex of nonIndexableRoutes) {
        expect(url).not.toBe(`${CANONICAL_URL}${noindex}`);
      }
    }
  });
});

describe("robots", () => {
  const r = robots();

  it("permite el sitio publico, bloquea API y declara sitemap canonico", () => {
    expect(r.sitemap).toBe(`${CANONICAL_URL}/sitemap.xml`);
    expect(r.host).toBe(CANONICAL_URL);
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    expect(rules.some((rule) => rule.allow === "/")).toBe(true);
    const disallow = rules.flatMap((rule) =>
      Array.isArray(rule.disallow) ? rule.disallow : rule.disallow ? [rule.disallow] : [],
    );
    expect(disallow).toContain("/api/");
    expect(disallow).not.toContain("/_next/");
  });
});
