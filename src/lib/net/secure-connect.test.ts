import { describe, it, expect, vi } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";

import {
  resolvePublicAddresses,
  pinnedLookup,
  secureRequest,
  SecureRequestError,
  type HostLookup,
} from "@/lib/net/secure-connect";
import { SsrfError, DnsResolutionError } from "@/lib/net/ssrf";

/** Resolutor inyectado que devuelve un conjunto fijo de IP (sin tocar la red). */
const fakeLookup =
  (records: { address: string; family: number }[]): HostLookup =>
  async () =>
    records;

const failingLookup: HostLookup = async () => {
  throw Object.assign(new Error("not found"), { code: "ENOTFOUND" });
};

describe("resolvePublicAddresses", () => {
  it("acepta una IPv4 pública literal sin consultar DNS", async () => {
    const spy = vi.fn();
    await expect(resolvePublicAddresses("93.184.216.34", spy)).resolves.toEqual([
      { address: "93.184.216.34", family: 4 },
    ]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rechaza IPv4 privadas/reservadas literales", async () => {
    for (const ip of ["10.0.0.5", "127.0.0.1", "169.254.169.254", "192.168.1.1", "172.16.0.1"]) {
      await expect(resolvePublicAddresses(ip)).rejects.toBeInstanceOf(SsrfError);
    }
  });

  it("rechaza IPv6 privadas/reservadas literales", async () => {
    for (const ip of ["::1", "fd00::1", "fe80::1"]) {
      await expect(resolvePublicAddresses(ip)).rejects.toBeInstanceOf(SsrfError);
    }
  });

  it("rechaza localhost y nombres .local/.localhost", async () => {
    for (const h of ["localhost", "printer.local", "app.localhost"]) {
      await expect(resolvePublicAddresses(h)).rejects.toBeInstanceOf(SsrfError);
    }
  });

  it("acepta un hostname que resuelve a IP pública", async () => {
    await expect(
      resolvePublicAddresses("example.com", fakeLookup([{ address: "93.184.216.34", family: 4 }])),
    ).resolves.toEqual([{ address: "93.184.216.34", family: 4 }]);
  });

  it("REBINDING: un hostname que ahora resuelve a IP privada se bloquea", async () => {
    await expect(
      resolvePublicAddresses("rebind.example", fakeLookup([{ address: "10.0.0.5", family: 4 }])),
    ).rejects.toBeInstanceOf(SsrfError);
  });

  it("rechaza el conjunto entero si una sola IP es privada (record-set poisoning)", async () => {
    await expect(
      resolvePublicAddresses(
        "mixed.example",
        fakeLookup([
          { address: "93.184.216.34", family: 4 },
          { address: "192.168.1.10", family: 4 },
        ]),
      ),
    ).rejects.toBeInstanceOf(SsrfError);
  });

  it("bloquea el endpoint de metadatos incluso resuelto por nombre", async () => {
    await expect(
      resolvePublicAddresses("metadata.example", fakeLookup([{ address: "169.254.169.254", family: 4 }])),
    ).rejects.toBeInstanceOf(SsrfError);
  });

  it("propaga un fallo de DNS como DnsResolutionError", async () => {
    await expect(resolvePublicAddresses("nope.example", failingLookup)).rejects.toBeInstanceOf(
      DnsResolutionError,
    );
  });

  it("marca family 6 para IPv6 pública", async () => {
    await expect(
      resolvePublicAddresses("cf.example", fakeLookup([{ address: "2606:4700:4700::1111", family: 6 }])),
    ).resolves.toEqual([{ address: "2606:4700:4700::1111", family: 6 }]);
  });
});

describe("pinnedLookup", () => {
  it("devuelve SIEMPRE la IP fijada e ignora el hostname (forma callback)", () => {
    const fn = pinnedLookup({ address: "93.184.216.34", family: 4 });
    const cb = vi.fn();
    // Un hostname totalmente distinto: la IP devuelta debe ser la fijada.
    (fn as unknown as (h: string, o: unknown, c: typeof cb) => void)(
      "cualquier-otro-host.example",
      {},
      cb,
    );
    expect(cb).toHaveBeenCalledWith(null, "93.184.216.34", 4);
  });

  it("soporta la forma { all: true } devolviendo un array", () => {
    const fn = pinnedLookup({ address: "93.184.216.34", family: 4 });
    const cb = vi.fn();
    (fn as unknown as (h: string, o: unknown, c: typeof cb) => void)("x", { all: true }, cb);
    expect(cb).toHaveBeenCalledWith(null, [{ address: "93.184.216.34", family: 4 }]);
  });

  it("conserva la familia IPv6", () => {
    const fn = pinnedLookup({ address: "2606:4700:4700::1111", family: 6 });
    const cb = vi.fn();
    (fn as unknown as (h: string, o: unknown, c: typeof cb) => void)("x", {}, cb);
    expect(cb).toHaveBeenCalledWith(null, "2606:4700:4700::1111", 6);
  });
});

describe("secureRequest · rechazos antes de tocar la red", () => {
  it("rechaza esquemas no http/https", async () => {
    await expect(secureRequest("file:///etc/passwd")).rejects.toMatchObject({ kind: "input" });
    await expect(secureRequest("ftp://example.com/")).rejects.toMatchObject({ kind: "input" });
    await expect(secureRequest("gopher://example.com/")).rejects.toMatchObject({ kind: "input" });
  });

  it("bloquea IP privadas/metadatos literales (ssrf)", async () => {
    await expect(secureRequest("http://127.0.0.1/")).rejects.toMatchObject({ kind: "ssrf" });
    await expect(secureRequest("http://10.0.0.1/")).rejects.toMatchObject({ kind: "ssrf" });
    await expect(secureRequest("http://169.254.169.254/latest/meta-data/")).rejects.toMatchObject({
      kind: "ssrf",
    });
    await expect(secureRequest("http://[::1]/")).rejects.toMatchObject({ kind: "ssrf" });
  });

  it("los errores son instancias de SecureRequestError", async () => {
    await expect(secureRequest("http://127.0.0.1/")).rejects.toBeInstanceOf(SecureRequestError);
  });
});

describe("PRUEBA DE PINNING: la conexión usa la IP fijada y no re-resuelve el hostname", () => {
  it("un lookup fijado fuerza la IP aprobada aunque el hostname no exista en DNS", async () => {
    // Servidor local que responde una marca reconocible.
    const server = http.createServer((_req, res) => {
      res.statusCode = 200;
      res.end("pinned-ok");
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const port = (server.address() as AddressInfo).port;

    try {
      const body = await new Promise<string>((resolve, reject) => {
        const req = http.request(
          {
            // Un hostname que NO existe: si la librería resolviera por su cuenta,
            // la conexión fallaría. Con el lookup fijado, va a 127.0.0.1:port.
            hostname: "host-que-no-existe.invalid",
            port,
            path: "/",
            method: "GET",
            lookup: pinnedLookup({ address: "127.0.0.1", family: 4 }),
          },
          (res) => {
            let data = "";
            res.on("data", (c) => (data += c));
            res.on("end", () => resolve(data));
          },
        );
        req.on("error", reject);
        req.end();
      });
      expect(body).toBe("pinned-ok");
    } finally {
      server.close();
    }
  });
});
