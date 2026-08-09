import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CANONICAL_URL, getBaseUrl, siteConfig, tools } from "@/lib/config";
import sitemap from "./sitemap";
import robots from "./robots";
import nextConfig from "../../next.config";

const CANONICAL = "https://iplibre.online";

describe("dominio canónico", () => {
  it("el dominio oficial es iplibre.online", () => {
    expect(CANONICAL_URL).toBe(CANONICAL);
    expect(siteConfig.url).toBe(CANONICAL);
  });

  it("no queda ninguna referencia a iplibre.vercel.app en la config", () => {
    expect(JSON.stringify(siteConfig)).not.toContain("iplibre.vercel.app");
    expect(CANONICAL_URL).not.toContain("vercel.app");
  });
});

describe("getBaseUrl", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });

  it("en producción usa el dominio oficial aunque falte la variable", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_ENV = "production";
    expect(getBaseUrl()).toBe(CANONICAL);
  });

  it("ignora overrides de entorno para senales canonicas", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.iplibre.online";
    process.env.VERCEL_ENV = "production";
    expect(getBaseUrl()).toBe(CANONICAL);
  });
});

describe("sitemap.xml", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = CANONICAL;
  });
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("todas las URLs comienzan con el dominio oficial", () => {
    const entries = sitemap();
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.url.startsWith(`${CANONICAL}/`) || entry.url === CANONICAL).toBe(true);
      expect(entry.url).not.toContain("vercel.app");
    }
  });

  it("incluye las páginas públicas clave y todas las herramientas", () => {
    const urls = sitemap().map((e) => e.url);
    const required = [
      "",
      "/herramientas",
      "/preguntas-frecuentes",
      "/acerca-de",
      "/contacto",
      "/terminos",
      "/privacidad",
      "/cookies",
      "/aviso-legal",
      ...tools.map((t) => t.href),
    ];
    for (const path of required) {
      expect(urls).toContain(`${CANONICAL}${path}`);
    }
  });
});

describe("robots.txt", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = CANONICAL;
  });
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("enlaza al sitemap oficial y bloquea /api/", () => {
    const r = robots();
    expect(r.sitemap).toBe(`${CANONICAL}/sitemap.xml`);
    expect(r.host).toBe(CANONICAL);
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    const disallow = rules.flatMap((rule) =>
      Array.isArray(rule.disallow) ? rule.disallow : rule.disallow ? [rule.disallow] : [],
    );
    expect(disallow).toContain("/api/");
  });
});

describe("redirects de dominio", () => {
  it("mantiene reglas permanentes para www y dominio legacy hacia el apex canonico", async () => {
    const redirects = typeof nextConfig.redirects === "function" ? await nextConfig.redirects() : [];
    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/:path*",
          destination: `${CANONICAL}/:path*`,
          permanent: true,
          has: expect.arrayContaining([expect.objectContaining({ type: "host", value: "www.iplibre.online" })]),
        }),
        expect.objectContaining({
          source: "/:path*",
          destination: `${CANONICAL}/:path*`,
          permanent: true,
          has: expect.arrayContaining([expect.objectContaining({ type: "host", value: "iplibre.vercel.app" })]),
        }),
      ]),
    );
  });
});
