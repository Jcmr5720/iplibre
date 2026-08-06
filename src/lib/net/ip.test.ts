import { describe, expect, it } from "vitest";
import { firstPublicIp, ipVersion, isIP, isIPv4, isIPv6, isPrivateOrReservedIp } from "./ip";

describe("isIPv4", () => {
  it("acepta IPv4 válidas", () => {
    expect(isIPv4("8.8.8.8")).toBe(true);
    expect(isIPv4("0.0.0.0")).toBe(true);
    expect(isIPv4("255.255.255.255")).toBe(true);
    expect(isIPv4("190.85.12.34")).toBe(true);
  });
  it("rechaza IPv4 no válidas", () => {
    expect(isIPv4("256.1.1.1")).toBe(false);
    expect(isIPv4("1.1.1")).toBe(false);
    expect(isIPv4("01.2.3.4")).toBe(false); // cero a la izquierda
    expect(isIPv4("1.2.3.4.5")).toBe(false);
    expect(isIPv4("a.b.c.d")).toBe(false);
    expect(isIPv4("")).toBe(false);
  });
});

describe("isIPv6", () => {
  it("acepta IPv6 válidas", () => {
    expect(isIPv6("2001:4860:4860::8888")).toBe(true);
    expect(isIPv6("::1")).toBe(true);
    expect(isIPv6("::")).toBe(true);
    expect(isIPv6("fe80::1")).toBe(true);
    expect(isIPv6("2001:db8:0:0:0:0:0:1")).toBe(true);
    expect(isIPv6("::ffff:192.168.0.1")).toBe(true);
  });
  it("rechaza IPv6 no válidas", () => {
    expect(isIPv6("2001::db8::1")).toBe(false); // doble ::
    expect(isIPv6("gggg::1")).toBe(false);
    expect(isIPv6("8.8.8.8")).toBe(false);
    expect(isIPv6("fe80::1%eth0")).toBe(false); // scope no admitido
  });
});

describe("ipVersion / isIP", () => {
  it("detecta la versión", () => {
    expect(ipVersion("8.8.8.8")).toBe(4);
    expect(ipVersion("::1")).toBe(6);
    expect(ipVersion("no-ip")).toBeNull();
    expect(isIP("1.1.1.1")).toBe(true);
    expect(isIP("nope")).toBe(false);
  });
});

describe("isPrivateOrReservedIp", () => {
  it("detecta rangos privados/reservados", () => {
    expect(isPrivateOrReservedIp("10.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.1.1")).toBe(true);
    expect(isPrivateOrReservedIp("172.16.5.4")).toBe(true);
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.1.1")).toBe(true);
    expect(isPrivateOrReservedIp("100.64.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("::1")).toBe(true);
    expect(isPrivateOrReservedIp("fd00::1")).toBe(true);
    expect(isPrivateOrReservedIp("::ffff:10.0.0.1")).toBe(true);
  });
  it("considera públicas las IP normales", () => {
    expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
    expect(isPrivateOrReservedIp("1.1.1.1")).toBe(false);
    expect(isPrivateOrReservedIp("2001:4860:4860::8888")).toBe(false);
  });
});

describe("firstPublicIp", () => {
  it("extrae la primera IP pública de x-forwarded-for", () => {
    expect(firstPublicIp("203.0.113.1, 10.0.0.1")).toBe("203.0.113.1");
    expect(firstPublicIp("8.8.8.8")).toBe("8.8.8.8");
    expect(firstPublicIp("")).toBeNull();
    expect(firstPublicIp(null)).toBeNull();
  });
  it("prefiere la pública aunque venga después", () => {
    expect(firstPublicIp("10.0.0.1, 8.8.4.4")).toBe("8.8.4.4");
  });
});
