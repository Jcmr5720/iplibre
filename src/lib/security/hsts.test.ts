import { describe, expect, it } from "vitest";
import { analyzeHsts } from "./hsts";

describe("analyzeHsts", () => {
  it("ausente sin cabecera", () => {
    const r = analyzeHsts(null);
    expect(r.present).toBe(false);
    expect(r.longEnough).toBe(false);
  });
  it("parsea max-age, includeSubDomains y preload", () => {
    const r = analyzeHsts("max-age=63072000; includeSubDomains; preload");
    expect(r.maxAge).toBe(63072000);
    expect(r.includeSubDomains).toBe(true);
    expect(r.preload).toBe(true);
    expect(r.longEnough).toBe(true);
  });
  it("marca max-age insuficiente", () => {
    const r = analyzeHsts("max-age=3600");
    expect(r.longEnough).toBe(false);
    expect(r.notes.join(" ")).toContain("6 meses");
  });
});
