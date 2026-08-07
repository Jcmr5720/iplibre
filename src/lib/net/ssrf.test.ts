import { describe, expect, it } from "vitest";
import { assertPublicHost, SsrfError } from "./ssrf";

describe("assertPublicHost (literales IP, sin DNS)", () => {
  it("rechaza IPv4 privadas y de loopback", async () => {
    for (const ip of ["127.0.0.1", "10.0.0.5", "192.168.1.1", "172.16.0.1", "169.254.169.254", "0.0.0.0"]) {
      await expect(assertPublicHost(ip)).rejects.toBeInstanceOf(SsrfError);
    }
  });
  it("rechaza IPv6 de loopback y ULA", async () => {
    for (const ip of ["::1", "fd00::1", "fe80::1"]) {
      await expect(assertPublicHost(ip)).rejects.toBeInstanceOf(SsrfError);
    }
  });
  it("acepta IP públicas literales", async () => {
    await expect(assertPublicHost("8.8.8.8")).resolves.toEqual(["8.8.8.8"]);
    await expect(assertPublicHost("1.1.1.1")).resolves.toEqual(["1.1.1.1"]);
  });
  it("rechaza nombres locales evidentes sin resolver", async () => {
    for (const host of ["localhost", "app.localhost", "servidor.local"]) {
      await expect(assertPublicHost(host)).rejects.toBeInstanceOf(SsrfError);
    }
  });
});
