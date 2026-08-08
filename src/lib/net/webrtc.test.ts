import { describe, it, expect } from "vitest";
import {
  analyzeCandidates,
  parseCandidate,
  type ParsedCandidate,
} from "@/lib/net/webrtc";

describe("parseCandidate", () => {
  it("parsea un candidato srflx público", () => {
    const c = parseCandidate(
      "candidate:1 1 udp 2122260223 93.184.216.34 49923 typ srflx raddr 0.0.0.0 rport 0",
    );
    expect(c).not.toBeNull();
    expect(c!.type).toBe("srflx");
    expect(c!.protocol).toBe("udp");
    expect(c!.address).toBe("93.184.216.34");
    expect(c!.port).toBe(49923);
    expect(c!.ipVersion).toBe(4);
    expect(c!.isPublic).toBe(true);
    expect(c!.isPrivate).toBe(false);
    expect(c!.isMdns).toBe(false);
  });

  it("detecta candidatos mDNS (*.local) como IP local ofuscada", () => {
    const c = parseCandidate(
      "candidate:2 1 udp 2122194687 a1b2c3d4-0000-0000-0000-abcdef012345.local 51234 typ host",
    );
    expect(c!.isMdns).toBe(true);
    expect(c!.ipVersion).toBeNull();
    expect(c!.isPublic).toBe(false);
    expect(c!.isPrivate).toBe(false);
    expect(c!.type).toBe("host");
  });

  it("detecta una IP privada revelada directamente", () => {
    const c = parseCandidate("candidate:3 1 udp 2122260223 192.168.1.20 5000 typ host");
    expect(c!.isPrivate).toBe(true);
    expect(c!.isPublic).toBe(false);
  });

  it("acepta el prefijo a= y candidatos IPv6", () => {
    const c = parseCandidate(
      "a=candidate:4 1 udp 2122260223 2606:4700:4700::1111 443 typ srflx",
    );
    expect(c!.ipVersion).toBe(6);
    expect(c!.isPublic).toBe(true);
  });

  it("devuelve null para basura", () => {
    expect(parseCandidate("")).toBeNull();
    expect(parseCandidate("candidate:incompleto")).toBeNull();
  });
});

function make(over: Partial<ParsedCandidate>): ParsedCandidate {
  return {
    raw: "",
    type: "host",
    protocol: "udp",
    address: "",
    port: 1,
    ipVersion: 4,
    isMdns: false,
    isPrivate: false,
    isPublic: false,
    ...over,
  };
}

describe("analyzeCandidates", () => {
  it("sin candidatos → no determinado", () => {
    expect(analyzeCandidates([], "203.0.113.1").state).toBe("unknown");
  });

  it("solo mDNS → restringido (sin fuga)", () => {
    const res = analyzeCandidates(
      [make({ isMdns: true, address: "x.local", ipVersion: null })],
      "203.0.113.1",
    );
    expect(res.state).toBe("restricted");
    expect(res.publicIps).toHaveLength(0);
    expect(res.mdnsCount).toBe(1);
  });

  it("IP pública igual a la del servidor → sin fuga aparente", () => {
    const res = analyzeCandidates(
      [make({ type: "srflx", address: "203.0.113.1", isPublic: true })],
      "203.0.113.1",
    );
    expect(res.state).toBe("noLeak");
    expect(res.exposesDifferentIp).toBe(false);
  });

  it("IP pública distinta de la del servidor → posible exposición", () => {
    const res = analyzeCandidates(
      [make({ type: "srflx", address: "198.51.100.9", isPublic: true })],
      "203.0.113.1",
    );
    expect(res.state).toBe("possibleLeak");
    expect(res.exposesDifferentIp).toBe(true);
    expect(res.publicIps).toContain("198.51.100.9");
  });

  it("IP privada revelada directamente → posible exposición", () => {
    const res = analyzeCandidates(
      [make({ type: "host", address: "10.0.0.5", isPrivate: true })],
      "203.0.113.1",
    );
    expect(res.state).toBe("possibleLeak");
    expect(res.privateIps).toContain("10.0.0.5");
  });

  it("IP pública sin poder comparar con el servidor → no determinado", () => {
    const res = analyzeCandidates(
      [make({ type: "srflx", address: "198.51.100.9", isPublic: true })],
      null,
    );
    expect(res.state).toBe("unknown");
  });
});
