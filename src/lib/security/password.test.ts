import { describe, it, expect } from "vitest";
import {
  AMBIGUOUS,
  buildCharPools,
  estimateEntropyBits,
  estimateStrength,
  generatePassword,
  strengthFromBits,
  validateOptions,
  type PasswordOptions,
} from "@/lib/security/password";

const base: PasswordOptions = {
  length: 20,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

describe("buildCharPools", () => {
  it("incluye todas las categorías seleccionadas", () => {
    const { pools, alphabet } = buildCharPools(base);
    expect(pools).toHaveLength(4);
    expect(alphabet).toContain("a");
    expect(alphabet).toContain("Z");
    expect(alphabet).toContain("5");
    expect(alphabet).toContain("@");
  });

  it("respeta las categorías desactivadas", () => {
    const { pools, alphabet } = buildCharPools({ ...base, symbols: false, numbers: false });
    expect(pools).toHaveLength(2);
    expect(alphabet).not.toContain("@");
    expect(alphabet).not.toMatch(/[0-9]/);
  });

  it("excluye caracteres ambiguos cuando se pide", () => {
    const { alphabet } = buildCharPools({ ...base, excludeAmbiguous: true });
    for (const ch of alphabet) {
      expect(AMBIGUOUS.has(ch)).toBe(false);
    }
    expect(alphabet).not.toContain("0");
    expect(alphabet).not.toContain("O");
    expect(alphabet).not.toContain("l");
  });
});

describe("validateOptions", () => {
  it("rechaza longitudes fuera de rango", () => {
    expect(validateOptions({ ...base, length: 4 }).ok).toBe(false);
    expect(validateOptions({ ...base, length: 500 }).ok).toBe(false);
    expect(validateOptions({ ...base, length: 12.5 }).ok).toBe(false);
  });

  it("rechaza cuando no hay ninguna categoría", () => {
    const res = validateOptions({
      ...base,
      lowercase: false,
      uppercase: false,
      numbers: false,
      symbols: false,
    });
    expect(res.ok).toBe(false);
  });

  it("acepta opciones válidas", () => {
    expect(validateOptions(base).ok).toBe(true);
  });
});

describe("generatePassword", () => {
  it("respeta la longitud pedida", () => {
    for (const length of [8, 16, 32, 64, 128]) {
      expect(generatePassword({ ...base, length })).toHaveLength(length);
    }
  });

  it("solo usa caracteres del alfabeto seleccionado", () => {
    const opts: PasswordOptions = { ...base, symbols: false };
    const { alphabet } = buildCharPools(opts);
    const pw = generatePassword(opts);
    for (const ch of pw) expect(alphabet).toContain(ch);
  });

  it("garantiza al menos un carácter de cada categoría seleccionada", () => {
    // Repetido para reducir la probabilidad de un falso positivo por azar.
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword(base);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[^a-zA-Z0-9]/);
    }
  });

  it("no repite el mismo valor entre generaciones", () => {
    const a = generatePassword({ ...base, length: 40 });
    const b = generatePassword({ ...base, length: 40 });
    expect(a).not.toBe(b);
  });

  it("nunca incluye ambiguos cuando se excluyen", () => {
    for (let i = 0; i < 30; i++) {
      const pw = generatePassword({ ...base, excludeAmbiguous: true });
      for (const ch of pw) expect(AMBIGUOUS.has(ch)).toBe(false);
    }
  });

  it("lanza con opciones inválidas", () => {
    expect(() =>
      generatePassword({ ...base, lowercase: false, uppercase: false, numbers: false, symbols: false }),
    ).toThrow();
  });
});

describe("entropía y fuerza", () => {
  it("calcula bits = longitud × log2(alfabeto)", () => {
    // 94 caracteres imprimibles aprox.; comprobamos la fórmula exacta.
    expect(estimateEntropyBits(10, 26)).toBeCloseTo(10 * Math.log2(26), 5);
    expect(estimateEntropyBits(0, 26)).toBe(0);
    expect(estimateEntropyBits(10, 1)).toBe(0);
  });

  it("clasifica por umbrales", () => {
    expect(strengthFromBits(30).level).toBe("weak");
    expect(strengthFromBits(50).level).toBe("fair");
    expect(strengthFromBits(75).level).toBe("strong");
    expect(strengthFromBits(120).level).toBe("veryStrong");
  });

  it("una contraseña larga con todo el alfabeto es muy fuerte", () => {
    const s = estimateStrength(base);
    expect(s.level).toBe("veryStrong");
    expect(s.percent).toBeGreaterThan(50);
  });

  it("una contraseña corta solo numérica es débil", () => {
    const s = estimateStrength({ ...base, length: 8, lowercase: false, uppercase: false, symbols: false });
    expect(s.level).toBe("weak");
  });
});
