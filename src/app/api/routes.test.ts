import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as geoGet } from "./geo/route";
import { GET as dnsGet } from "./dns/route";
import { GET as reverseGet } from "./reverse-dns/route";
import { GET as healthGet } from "./health/route";

function req(url: string) {
  return new NextRequest(`http://localhost${url}`);
}

function mockFetchOnce(payload: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(payload), { status: ok ? status : status })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/geo", () => {
  it("rechaza entrada vacía (400)", async () => {
    const res = await geoGet(req("/api/geo"));
    expect(res.status).toBe(400);
  });

  it("rechaza IP no válida (422)", async () => {
    const res = await geoGet(req("/api/geo?ip=999.1.1.1"));
    expect(res.status).toBe(422);
  });

  it("rechaza IP privada (422)", async () => {
    const res = await geoGet(req("/api/geo?ip=192.168.0.1"));
    expect(res.status).toBe(422);
  });

  it("devuelve datos con proveedor simulado", async () => {
    mockFetchOnce({
      success: true,
      ip: "8.8.8.8",
      country: "United States",
      country_code: "US",
      city: "Mountain View",
      latitude: 37.4,
      longitude: -122,
      connection: { asn: 15169, isp: "Google LLC", org: "Google LLC" },
      timezone: { id: "America/Los_Angeles", utc: "-08:00" },
    });
    const res = await geoGet(req("/api/geo?ip=8.8.8.8"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.ip).toBe("8.8.8.8");
    expect(body.data.asn).toBe(15169);
  });

  it("gestiona todos los proveedores caídos (502)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const res = await geoGet(req("/api/geo?ip=8.8.8.8"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.errorId).toBeTruthy();
  });
});

describe("GET /api/dns", () => {
  it("rechaza dominio no válido (422)", async () => {
    const res = await dnsGet(req("/api/dns?domain=sinpunto&type=A"));
    expect(res.status).toBe(422);
  });

  it("resuelve un registro A con DoH simulado", async () => {
    mockFetchOnce({
      Status: 0,
      Answer: [{ name: "ejemplo.com.", type: 1, TTL: 300, data: "93.184.216.34" }],
    });
    const res = await dnsGet(req("/api/dns?domain=ejemplo.com&type=A"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.answers[0].data).toBe("93.184.216.34");
    expect(body.data.answers[0].type).toBe("A");
  });
});

describe("GET /api/reverse-dns", () => {
  it("rechaza entrada vacía (400)", async () => {
    const res = await reverseGet(req("/api/reverse-dns"));
    expect(res.status).toBe(400);
  });

  it("resuelve PTR con DoH simulado", async () => {
    mockFetchOnce({
      Status: 0,
      Answer: [{ name: "8.8.8.8.in-addr.arpa.", type: 12, TTL: 300, data: "dns.google." }],
    });
    const res = await reverseGet(req("/api/reverse-dns?query=8.8.8.8"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.mode).toBe("reverse");
    expect(body.data.hostnames).toContain("dns.google");
  });
});

describe("GET /api/health", () => {
  it("responde estado ok", async () => {
    const res = await healthGet();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });
});
