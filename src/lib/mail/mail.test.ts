import { describe, it, expect } from "vitest";
import { parseSpf } from "@/lib/mail/spf";
import { parseDmarc } from "@/lib/mail/dmarc";
import { parseDkim } from "@/lib/mail/dkim";

describe("parseSpf", () => {
  it("detecta ausencia de SPF", () => {
    const r = parseSpf(["some other txt", "google-site-verification=abc"]);
    expect(r.status).toBe("missing");
    expect(r.found).toBe(false);
  });

  it("parsea includes, ip4 y política estricta -all", () => {
    const r = parseSpf(["v=spf1 include:_spf.google.com ip4:203.0.113.0/24 -all"]);
    expect(r.found).toBe(true);
    expect(r.includes).toContain("_spf.google.com");
    expect(r.ip4).toContain("203.0.113.0/24");
    expect(r.allQualifier).toBe("-");
    expect(r.status).toBe("ok");
    expect(r.observations.some((o) => o.tone === "success")).toBe(true);
  });

  it("marca +all como inseguro", () => {
    const r = parseSpf(["v=spf1 +all"]);
    expect(r.allQualifier).toBe("+");
    expect(r.status).toBe("warning");
    expect(r.observations.some((o) => o.tone === "danger")).toBe(true);
  });

  it("detecta múltiples registros SPF como inválido", () => {
    const r = parseSpf(["v=spf1 -all", "v=spf1 include:example.com ~all"]);
    expect(r.multipleRecords).toBe(true);
    expect(r.status).toBe("invalid");
  });

  it("cuenta las búsquedas DNS y avisa si superan 10", () => {
    const includes = Array.from({ length: 11 }, (_, i) => `include:a${i}.example.com`).join(" ");
    const r = parseSpf([`v=spf1 ${includes} -all`]);
    expect(r.dnsLookups).toBe(11);
    expect(r.observations.some((o) => o.text.includes("PermError"))).toBe(true);
  });

  it("cuenta redirect como búsqueda DNS", () => {
    const r = parseSpf(["v=spf1 redirect=_spf.example.com"]);
    expect(r.redirect).toBe("_spf.example.com");
    expect(r.dnsLookups).toBe(1);
  });
});

describe("parseDmarc", () => {
  it("detecta ausencia de DMARC", () => {
    expect(parseDmarc(["random"]).status).toBe("missing");
  });

  it("parsea p=reject con informes", () => {
    const r = parseDmarc(["v=DMARC1; p=reject; rua=mailto:agg@example.com; adkim=s; aspf=s"]);
    expect(r.policy).toBe("reject");
    expect(r.rua).toContain("mailto:agg@example.com");
    expect(r.adkim).toBe("s");
    expect(r.status).toBe("ok");
  });

  it("p=none no se trata como error absoluto", () => {
    const r = parseDmarc(["v=DMARC1; p=none; rua=mailto:agg@example.com"]);
    expect(r.policy).toBe("none");
    expect(r.status).toBe("warning");
    expect(r.observations.some((o) => o.tone === "info")).toBe(true);
  });

  it("avisa de pct<100 con política aplicada", () => {
    const r = parseDmarc(["v=DMARC1; p=quarantine; pct=50"]);
    expect(r.pct).toBe(50);
    expect(r.observations.some((o) => o.text.includes("pct=50"))).toBe(true);
  });

  it("marca inválido si falta p", () => {
    const r = parseDmarc(["v=DMARC1; rua=mailto:x@example.com"]);
    expect(r.status).toBe("invalid");
  });
});

describe("parseDkim", () => {
  it("detecta ausencia de DKIM en el selector", () => {
    const r = parseDkim(["not dkim"], "google");
    expect(r.status).toBe("missing");
  });

  it("parsea una clave pública válida", () => {
    const r = parseDkim(["v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ=="], "selector1");
    expect(r.found).toBe(true);
    expect(r.keyType).toBe("rsa");
    expect(r.publicKey).toContain("MIGf");
    expect(r.status).toBe("ok");
  });

  it("detecta una clave revocada (p= vacío)", () => {
    const r = parseDkim(["v=DKIM1; k=rsa; p="], "selector1");
    expect(r.status).toBe("invalid");
    expect(r.observations.some((o) => o.text.includes("revocado"))).toBe(true);
  });

  it("señala el modo de prueba t=y", () => {
    const r = parseDkim(["v=DKIM1; k=rsa; t=y; p=AAAA"], "selector1");
    expect(r.flags).toContain("y");
    expect(r.status).toBe("warning");
  });
});
