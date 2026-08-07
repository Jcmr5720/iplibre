import { describe, expect, it } from "vitest";
import { analyzeSecurityHeaders } from "./headers";

function getter(headers: Record<string, string>) {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v;
  return (name: string) => lower[name.toLowerCase()] ?? null;
}

describe("analyzeSecurityHeaders", () => {
  it("da 0 sin ninguna cabecera", () => {
    const r = analyzeSecurityHeaders(getter({}));
    expect(r.score).toBe(0);
    expect(r.rating).toBe("Débil");
    expect(r.maxScore).toBe(100);
  });

  it("puntúa alto con un conjunto completo y sólido", () => {
    const r = analyzeSecurityHeaders(
      getter({
        "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
        "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
        "permissions-policy": "geolocation=()",
        "cross-origin-opener-policy": "same-origin",
        "cross-origin-resource-policy": "same-origin",
        "cross-origin-embedder-policy": "require-corp",
      }),
    );
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.rating).toBe("Excelente");
  });

  it("no penaliza la falta de X-Frame-Options si la CSP tiene frame-ancestors", () => {
    const r = analyzeSecurityHeaders(
      getter({ "content-security-policy": "default-src 'self'; frame-ancestors 'none'" }),
    );
    const xfo = r.checks.find((c) => c.key === "x-frame-options");
    expect(xfo?.earned).toBe(xfo?.weight);
  });

  it("marca Server y X-Powered-By como información expuesta", () => {
    const r = analyzeSecurityHeaders(getter({ server: "nginx", "x-powered-by": "PHP/8" }));
    expect(r.informational.map((i) => i.name)).toEqual(["Server", "X-Powered-By"]);
  });

  it("penaliza parcialmente una CSP con unsafe-inline", () => {
    const full = analyzeSecurityHeaders(getter({ "content-security-policy": "default-src 'self'" }));
    const weak = analyzeSecurityHeaders(
      getter({ "content-security-policy": "default-src 'self'; script-src 'unsafe-inline'" }),
    );
    const fullCsp = full.checks.find((c) => c.key === "content-security-policy")!;
    const weakCsp = weak.checks.find((c) => c.key === "content-security-policy")!;
    expect(weakCsp.earned).toBeLessThan(fullCsp.earned);
  });
});
