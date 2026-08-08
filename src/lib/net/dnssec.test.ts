import { describe, it, expect } from "vitest";
import { classifyDnssec, parseDnskey, parseDs } from "@/lib/net/dnssec";

describe("parseDnskey", () => {
  it("parsea una KSK (flags 257)", () => {
    const k = parseDnskey("257 3 13 mdsswUyr3DPW132mOi8V9xESWE8jTo0dxCjjnopKl+GqJxpVXckHAeF+KkxLbxILfDLUT0rAK9iUzy1L53eKGQ==");
    expect(k).not.toBeNull();
    expect(k!.flags).toBe(257);
    expect(k!.algorithm).toBe(13);
    expect(k!.role).toBe("KSK");
    expect(k!.algorithmName).toContain("ECDSA");
  });

  it("parsea una ZSK (flags 256)", () => {
    const k = parseDnskey("256 3 8 AwEAAae...");
    expect(k!.role).toBe("ZSK");
    expect(k!.algorithmName).toContain("SHA-256");
  });

  it("devuelve null con datos incompletos", () => {
    expect(parseDnskey("257 3")).toBeNull();
  });
});

describe("parseDs", () => {
  it("parsea un DS con SHA-256", () => {
    const d = parseDs("2371 13 2 3ac3fd7dbe5c6a3f...");
    expect(d).not.toBeNull();
    expect(d!.keyTag).toBe(2371);
    expect(d!.algorithm).toBe(13);
    expect(d!.digestType).toBe(2);
    expect(d!.digestTypeName).toBe("SHA-256");
    expect(d!.digest).toBe("3AC3FD7DBE5C6A3F...");
  });

  it("devuelve null con datos incompletos", () => {
    expect(parseDs("2371 13")).toBeNull();
  });
});

describe("classifyDnssec", () => {
  it("DS + DNSKEY + AD → activo y validado", () => {
    const c = classifyDnssec({ hasDnskey: true, hasDs: true, authenticated: true, bogus: false });
    expect(c.state).toBe("active-validated");
  });

  it("firmado pero sin poder validar → configurado sin validar", () => {
    const c = classifyDnssec({ hasDnskey: true, hasDs: true, authenticated: false, bogus: false });
    expect(c.state).toBe("signed-unvalidated");
  });

  it("bogus (falla validación) → posible problema", () => {
    const c = classifyDnssec({ hasDnskey: true, hasDs: true, authenticated: false, bogus: true });
    expect(c.state).toBe("validation-failure");
  });

  it("sin DS ni DNSKEY → no detectado", () => {
    const c = classifyDnssec({ hasDnskey: false, hasDs: false, authenticated: false, bogus: false });
    expect(c.state).toBe("absent");
    expect(c.detail).toContain("no significa");
  });

  it("solo DNSKEY con AD → activo y validado", () => {
    const c = classifyDnssec({ hasDnskey: true, hasDs: false, authenticated: true, bogus: false });
    expect(c.state).toBe("active-validated");
  });
});
