import { describe, expect, it } from "vitest";
import { contactSchema, dnsQuerySchema } from "./validation";
import { InMemoryRateLimiter } from "./rate-limit";

describe("contactSchema", () => {
  const valid = {
    name: "Ana",
    email: "ana@example.com",
    subject: "Hola",
    message: "Este es un mensaje de prueba.",
    consent: true as const,
    website: "",
  };
  it("acepta datos válidos", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });
  it("exige consentimiento", () => {
    expect(contactSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });
  it("rechaza email inválido", () => {
    expect(contactSchema.safeParse({ ...valid, email: "no-email" }).success).toBe(false);
  });
  it("rechaza mensaje demasiado corto", () => {
    expect(contactSchema.safeParse({ ...valid, message: "corto" }).success).toBe(false);
  });
});

describe("dnsQuerySchema", () => {
  it("solo admite tipos conocidos", () => {
    expect(dnsQuerySchema.safeParse({ domain: "a.com", type: "A" }).success).toBe(true);
    expect(dnsQuerySchema.safeParse({ domain: "a.com", type: "ZZZ" }).success).toBe(false);
  });
});

describe("InMemoryRateLimiter", () => {
  it("bloquea al superar el límite", () => {
    const limiter = new InMemoryRateLimiter(3, 60_000);
    expect(limiter.check("k").ok).toBe(true);
    expect(limiter.check("k").ok).toBe(true);
    expect(limiter.check("k").ok).toBe(true);
    expect(limiter.check("k").ok).toBe(false);
  });
  it("mantiene claves independientes", () => {
    const limiter = new InMemoryRateLimiter(1, 60_000);
    expect(limiter.check("a").ok).toBe(true);
    expect(limiter.check("b").ok).toBe(true);
    expect(limiter.check("a").ok).toBe(false);
  });
});
