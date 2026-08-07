import { describe, expect, it } from "vitest";
import { analyzeCsp, cspRestrictsFraming, parseCsp } from "./csp";

describe("parseCsp", () => {
  it("parsea directivas y valores", () => {
    const d = parseCsp("default-src 'self'; script-src 'self' 'unsafe-inline'");
    expect(d["default-src"]).toEqual(["'self'"]);
    expect(d["script-src"]).toContain("'unsafe-inline'");
  });
});

describe("analyzeCsp", () => {
  it("ausente cuando no hay valor", () => {
    expect(analyzeCsp(undefined).present).toBe(false);
  });
  it("advierte sobre unsafe-inline y unsafe-eval", () => {
    const r = analyzeCsp("default-src 'self'; script-src 'unsafe-inline' 'unsafe-eval'");
    const msgs = r.findings.map((f) => f.message).join(" ");
    expect(msgs).toContain("unsafe-inline");
    expect(msgs).toContain("unsafe-eval");
    expect(r.findings.every((f) => f.severity !== "error")).toBe(true);
  });
  it("advierte sobre comodines amplios", () => {
    const r = analyzeCsp("default-src *");
    expect(r.findings.some((f) => f.message.includes("Comodín"))).toBe(true);
  });
  it("no marca como débil una CSP correcta", () => {
    const r = analyzeCsp("default-src 'self'; frame-ancestors 'none'");
    expect(r.findings.some((f) => f.severity === "warning")).toBe(false);
  });
});

describe("cspRestrictsFraming", () => {
  it("detecta frame-ancestors restrictivo", () => {
    expect(cspRestrictsFraming("frame-ancestors 'none'")).toBe(true);
    expect(cspRestrictsFraming("frame-ancestors 'self'")).toBe(true);
  });
  it("no considera restrictivo un comodín", () => {
    expect(cspRestrictsFraming("frame-ancestors *")).toBe(false);
    expect(cspRestrictsFraming("default-src 'self'")).toBe(false);
  });
});
