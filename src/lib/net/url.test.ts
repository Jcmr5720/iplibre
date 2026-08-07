import { describe, expect, it } from "vitest";
import { normalizeWebUrl } from "./url";
import { isAllowedProtocol } from "./ssrf";

describe("normalizeWebUrl", () => {
  it("acepta un dominio sin esquema y asume https", () => {
    const r = normalizeWebUrl("google.com");
    expect(r.ok && r.url).toBe("https://google.com/");
    expect(r.ok && r.protocol).toBe("https:");
  });
  it("conserva la ruta de una URL completa", () => {
    const r = normalizeWebUrl("https://ejemplo.com/ruta?x=1");
    expect(r.ok && r.hostname).toBe("ejemplo.com");
  });
  it("acepta http explícito", () => {
    const r = normalizeWebUrl("http://ejemplo.com");
    expect(r.ok && r.protocol).toBe("http:");
  });
  it("rechaza esquemas no permitidos", () => {
    for (const bad of ["file:///etc/passwd", "ftp://x.com", "javascript:alert(1)", "data:text/html,x", "gopher://x"]) {
      expect(normalizeWebUrl(bad).ok).toBe(false);
    }
  });
  it("rechaza credenciales embebidas", () => {
    expect(normalizeWebUrl("https://user:pass@ejemplo.com").ok).toBe(false);
  });
  it("exige un punto en el host", () => {
    expect(normalizeWebUrl("localhost").ok).toBe(false);
  });
  it("rechaza vacío", () => {
    expect(normalizeWebUrl("").ok).toBe(false);
  });
});

describe("isAllowedProtocol", () => {
  it("solo permite http y https", () => {
    expect(isAllowedProtocol("http:")).toBe(true);
    expect(isAllowedProtocol("https:")).toBe(true);
    expect(isAllowedProtocol("ftp:")).toBe(false);
    expect(isAllowedProtocol("file:")).toBe(false);
  });
});
