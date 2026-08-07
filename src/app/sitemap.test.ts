import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import robots from "./robots";

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("incluye la home y las herramientas", () => {
    expect(urls.some((u) => u.endsWith("/mi-ip"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/test-de-velocidad"))).toBe(true);
  });

  it("incluye las nuevas páginas de aterrizaje SEO", () => {
    for (const p of ["/cual-es-mi-ip", "/medir-velocidad-internet", "/test-de-velocidad-wifi", "/comprobar-dns"]) {
      expect(urls.some((u) => u.endsWith(p))).toBe(true);
    }
  });

  it("incluye las páginas informativas", () => {
    for (const p of ["/que-es-mi-ip", "/que-es-dns", "/que-es-el-ping", "/que-es-el-jitter", "/ipv4-vs-ipv6"]) {
      expect(urls.some((u) => u.endsWith(p))).toBe(true);
    }
  });

  it("no incluye rutas redirigidas (evita 308 en el sitemap)", () => {
    expect(urls.some((u) => u.endsWith("/mi-ip-publica"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/test-de-internet"))).toBe(false);
  });

  it("no incluye rutas de API", () => {
    expect(urls.some((u) => u.includes("/api/"))).toBe(false);
  });
});

describe("robots", () => {
  const r = robots();

  it("apunta al sitemap", () => {
    expect(String(r.sitemap)).toMatch(/\/sitemap\.xml$/);
  });

  it("bloquea /api/ pero permite el resto", () => {
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule?.allow).toBe("/");
    expect(rule?.disallow).toContain("/api/");
  });
});
