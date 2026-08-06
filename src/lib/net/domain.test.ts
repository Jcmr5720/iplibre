import { describe, expect, it } from "vitest";
import { normalizeDomain } from "./domain";
import { normalizeAsn, isAsnInput } from "./asn";
import { reverseName } from "./reverse";

describe("normalizeDomain", () => {
  it("normaliza dominios con esquema y ruta", () => {
    const r = normalizeDomain("https://www.Ejemplo.com/ruta?x=1");
    expect(r.ok && r.domain).toBe("www.ejemplo.com");
  });
  it("quita el punto final y el puerto", () => {
    const r = normalizeDomain("ejemplo.com.:8080");
    expect(r.ok && r.domain).toBe("ejemplo.com");
  });
  it("convierte IDN a punycode", () => {
    const r = normalizeDomain("españa.com");
    expect(r.ok && r.domain.startsWith("xn--")).toBe(true);
  });
  it("rechaza entradas sin punto", () => {
    expect(normalizeDomain("localhost").ok).toBe(false);
  });
  it("rechaza vacío", () => {
    expect(normalizeDomain("").ok).toBe(false);
  });
  it("rechaza TLD numérico", () => {
    expect(normalizeDomain("ejemplo.123").ok).toBe(false);
  });
});

describe("normalizeAsn", () => {
  it("acepta formatos AS15169, as15169 y 15169", () => {
    expect(normalizeAsn("AS15169")).toMatchObject({ ok: true, asn: 15169, label: "AS15169" });
    expect(normalizeAsn("as15169")).toMatchObject({ ok: true, asn: 15169 });
    expect(normalizeAsn("15169")).toMatchObject({ ok: true, asn: 15169 });
  });
  it("rechaza fuera de rango y no numéricos", () => {
    expect(normalizeAsn("AS4294967296").ok).toBe(false);
    expect(normalizeAsn("ASXYZ").ok).toBe(false);
    expect(isAsnInput("AS13335")).toBe(true);
    expect(isAsnInput("hola")).toBe(false);
  });
});

describe("reverseName", () => {
  it("construye in-addr.arpa para IPv4", () => {
    expect(reverseName("8.8.4.4")).toBe("4.4.8.8.in-addr.arpa");
  });
  it("construye ip6.arpa para IPv6", () => {
    const name = reverseName("2001:4860:4860::8888");
    expect(name?.endsWith(".ip6.arpa")).toBe(true);
    expect(name?.split(".").length).toBe(34); // 32 nibbles + ip6 + arpa
  });
  it("devuelve null para entradas no IP", () => {
    expect(reverseName("no-ip")).toBeNull();
  });
});
