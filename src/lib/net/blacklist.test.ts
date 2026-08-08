import { describe, it, expect } from "vitest";
import {
  dnsblQueryName,
  interpretDnsbl,
  isRefusalResponse,
  reverseIpv4,
  summarizeBlacklist,
  type Dnsbl,
  type DnsblResult,
} from "@/lib/net/blacklist";

const list: Dnsbl = { zone: "bl.example.net", name: "Example BL" };

describe("reverseIpv4 / dnsblQueryName", () => {
  it("invierte los octetos", () => {
    expect(reverseIpv4("1.2.3.4")).toBe("4.3.2.1");
    expect(reverseIpv4("203.0.113.5")).toBe("5.113.0.203");
  });

  it("rechaza entradas no IPv4", () => {
    expect(reverseIpv4("no-ip")).toBeNull();
    expect(reverseIpv4("2001:db8::1")).toBeNull();
  });

  it("construye el nombre de consulta", () => {
    expect(dnsblQueryName("1.2.3.4", "bl.example.net")).toBe("4.3.2.1.bl.example.net");
  });
});

describe("isRefusalResponse", () => {
  it("detecta las respuestas de rechazo 127.255.255.x", () => {
    expect(isRefusalResponse("127.255.255.252")).toBe(true);
    expect(isRefusalResponse("127.0.0.2")).toBe(false);
  });
});

describe("interpretDnsbl", () => {
  it("clasifica una IP listada (127.0.0.2)", () => {
    const r = interpretDnsbl(list, { addresses: ["127.0.0.2"], notFound: false });
    expect(r.outcome).toBe("listed");
    expect(r.responses).toContain("127.0.0.2");
  });

  it("clasifica NXDOMAIN como limpia", () => {
    const r = interpretDnsbl(list, { addresses: null, notFound: true });
    expect(r.outcome).toBe("clean");
  });

  it("trata las respuestas de rechazo como error, no como listada", () => {
    const r = interpretDnsbl(list, { addresses: ["127.255.255.252"], notFound: false });
    expect(r.outcome).toBe("error");
  });

  it("clasifica un fallo de red como error", () => {
    const r = interpretDnsbl(list, { addresses: null, notFound: false, errorCode: "ETIMEOUT" });
    expect(r.outcome).toBe("error");
    expect(r.detail).toContain("ETIMEOUT");
  });
});

function res(outcome: DnsblResult["outcome"]): DnsblResult {
  return { zone: "z", name: "n", outcome, responses: [] };
}

describe("summarizeBlacklist", () => {
  it("sin coincidencias cuando todas responden limpio", () => {
    const s = summarizeBlacklist("1.2.3.4", [res("clean"), res("clean")]);
    expect(s.state).toBe("clean");
    expect(s.listedCount).toBe(0);
  });

  it("aparece en N listas cuando hay listados", () => {
    const s = summarizeBlacklist("1.2.3.4", [res("listed"), res("clean"), res("listed")]);
    expect(s.state).toBe("listed");
    expect(s.listedCount).toBe(2);
    expect(s.stateLabel).toContain("2 listas");
  });

  it("resultado incompleto si solo hay errores", () => {
    const s = summarizeBlacklist("1.2.3.4", [res("error"), res("error")]);
    expect(s.state).toBe("incomplete");
  });

  it("ordena listadas primero", () => {
    const s = summarizeBlacklist("1.2.3.4", [res("clean"), res("listed"), res("error")]);
    expect(s.results[0].outcome).toBe("listed");
  });
});
