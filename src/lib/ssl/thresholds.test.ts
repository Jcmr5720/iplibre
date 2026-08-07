import { describe, expect, it } from "vitest";
import { classifySsl, daysUntil } from "./thresholds";

describe("daysUntil", () => {
  it("calcula días completos restantes", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(daysUntil(new Date("2026-01-11T00:00:00Z"), now)).toBe(10);
    expect(daysUntil(new Date("2025-12-31T00:00:00Z"), now)).toBe(-1);
  });
});

describe("classifySsl", () => {
  const base = { valid: true, hostnameValid: true, expired: false, notYetValid: false };
  it("seguro con muchos días", () => {
    expect(classifySsl({ ...base, daysRemaining: 90 }).state).toBe("secure");
  });
  it("próximo a vencer entre 8 y 30 días", () => {
    expect(classifySsl({ ...base, daysRemaining: 20 }).state).toBe("expiringSoon");
  });
  it("crítico con 7 días o menos", () => {
    expect(classifySsl({ ...base, daysRemaining: 5 }).state).toBe("critical");
  });
  it("expirado", () => {
    expect(classifySsl({ ...base, expired: true, daysRemaining: -2 }).state).toBe("expired");
  });
  it("inválido por hostname que no coincide", () => {
    expect(classifySsl({ ...base, hostnameValid: false, daysRemaining: 90 }).state).toBe("invalid");
  });
  it("aún no válido", () => {
    expect(classifySsl({ ...base, notYetValid: true, daysRemaining: 90 }).state).toBe("notYetValid");
  });
});
