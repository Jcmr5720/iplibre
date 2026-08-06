import { describe, expect, it } from "vitest";
import { formatBitrate, formatBytes, formatMbps, formatMs, toMbps } from "./format";
import { maskIp, maskIpForLogs } from "./privacy";

describe("formatBitrate", () => {
  it("elige la unidad correcta", () => {
    expect(formatBitrate(500)).toEqual({ value: "500", unit: "bps" });
    expect(formatBitrate(1500)).toEqual({ value: "1.50", unit: "Kbps" });
    expect(formatBitrate(15_000_000)).toEqual({ value: "15.0", unit: "Mbps" });
    expect(formatBitrate(2_000_000_000)).toEqual({ value: "2.00", unit: "Gbps" });
  });
  it("gestiona valores no válidos", () => {
    expect(formatBitrate(-5)).toEqual({ value: "0", unit: "Mbps" });
  });
});

describe("formatMbps / toMbps", () => {
  it("convierte y formatea", () => {
    expect(toMbps(50_000_000)).toBe(50);
    expect(formatMbps(50_000_000)).toBe("50.0 Mbps");
    expect(formatMbps(150_000_000)).toBe("150 Mbps");
    expect(formatMbps(9_500_000)).toBe("9.50 Mbps");
  });
});

describe("formatMs y formatBytes", () => {
  it("formatea milisegundos", () => {
    expect(formatMs(12.345)).toBe("12.3 ms");
    expect(formatMs(150)).toBe("150 ms");
    expect(formatMs(Infinity)).toBe("—");
  });
  it("formatea bytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1048576)).toBe("1.0 MB");
    expect(formatBytes(500)).toBe("500 B");
  });
});

describe("privacidad - máscara de IP", () => {
  it("enmascara IPv4 conservando prefijo", () => {
    expect(maskIp("190.85.12.34")).toBe("190.85.x.x");
    expect(maskIpForLogs("190.85.12.34")).toBe("190.85.12.0");
  });
  it("enmascara IPv6", () => {
    expect(maskIp("2001:db8:1234::1")).toBe("2001:db8::");
  });
  it("gestiona entradas no IP", () => {
    expect(maskIp("no-ip")).toBe("IP oculta");
  });
});
