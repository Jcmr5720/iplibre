import { describe, expect, it } from "vitest";
import { classifyStatus, overallFromStatus, statusText } from "./httpStatus";

describe("classifyStatus", () => {
  it("clasifica por rango", () => {
    expect(classifyStatus(200)).toBe("ok");
    expect(classifyStatus(301)).toBe("redirect");
    expect(classifyStatus(404)).toBe("clientError");
    expect(classifyStatus(503)).toBe("serverError");
  });
});

describe("overallFromStatus", () => {
  it("200 → funcionando", () => {
    expect(overallFromStatus(200).state).toBe("up");
  });
  it("301 → funcionando con redirección", () => {
    expect(overallFromStatus(301).state).toBe("up");
  });
  it("403 → accesible con error (no caído)", () => {
    const r = overallFromStatus(403);
    expect(r.state).toBe("warning");
    expect(r.detail).toContain("403");
  });
  it("404 → accesible con error (no caído)", () => {
    expect(overallFromStatus(404).state).toBe("warning");
  });
  it("500 → error del servidor", () => {
    expect(overallFromStatus(500).state).toBe("down");
  });
});

describe("statusText", () => {
  it("devuelve texto conocido y por defecto", () => {
    expect(statusText(404)).toBe("No encontrado");
    expect(statusText(299)).toBe("Respuesta HTTP");
  });
});
