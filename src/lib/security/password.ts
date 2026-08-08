/**
 * Generación de contraseñas seguras en el navegador.
 *
 * Principios:
 *  - Aleatoriedad criptográfica: SIEMPRE `crypto.getRandomValues`, nunca
 *    `Math.random()`.
 *  - Muestreo por rechazo para eliminar el sesgo de módulo al mapear bytes a
 *    un alfabeto de tamaño arbitrario.
 *  - Todo ocurre en el cliente: estas funciones no dependen de red ni de estado
 *    del servidor, y las contraseñas nunca salen del dispositivo.
 */

export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  /** Excluir caracteres ambiguos (0 O o I l 1 | etc.). */
  excludeAmbiguous: boolean;
}

export const PASSWORD_LIMITS = { min: 8, max: 128, default: 20 } as const;

export const CHARSETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  // Conjunto de símbolos amplio pero compatible con la mayoría de servicios.
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
} as const;

/** Caracteres fáciles de confundir visualmente. */
export const AMBIGUOUS = new Set("0OoIl1|`'\"{}[]()/\\".split(""));

export type PasswordCategory = keyof typeof CHARSETS;

const CATEGORY_ORDER: PasswordCategory[] = ["lowercase", "uppercase", "numbers", "symbols"];

/** Categorías activas según las opciones. */
export function activeCategories(opts: PasswordOptions): PasswordCategory[] {
  return CATEGORY_ORDER.filter((c) => opts[c]);
}

/**
 * Construye el alfabeto resultante a partir de las opciones, filtrando los
 * caracteres ambiguos cuando corresponde. Devuelve las categorías ya filtradas
 * para poder garantizar la inclusión de al menos una de cada una.
 */
export function buildCharPools(opts: PasswordOptions): { pools: string[]; alphabet: string } {
  const pools = activeCategories(opts)
    .map((c) => {
      const chars = CHARSETS[c];
      return opts.excludeAmbiguous
        ? chars
            .split("")
            .filter((ch) => !AMBIGUOUS.has(ch))
            .join("")
        : chars;
    })
    .filter((p) => p.length > 0);
  return { pools, alphabet: pools.join("") };
}

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateOptions(opts: PasswordOptions): ValidationResult {
  if (!Number.isInteger(opts.length)) return { ok: false, error: "La longitud debe ser un número entero." };
  if (opts.length < PASSWORD_LIMITS.min)
    return { ok: false, error: `La longitud mínima es ${PASSWORD_LIMITS.min} caracteres.` };
  if (opts.length > PASSWORD_LIMITS.max)
    return { ok: false, error: `La longitud máxima es ${PASSWORD_LIMITS.max} caracteres.` };
  const { pools, alphabet } = buildCharPools(opts);
  if (pools.length === 0 || alphabet.length === 0)
    return { ok: false, error: "Selecciona al menos un tipo de carácter." };
  return { ok: true };
}

/** Obtiene el objeto crypto seguro disponible en el entorno (navegador o Node). */
function getCrypto(): Crypto {
  const c = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (!c || typeof c.getRandomValues !== "function") {
    throw new Error("Este navegador no dispone de una fuente de aleatoriedad segura (crypto.getRandomValues).");
  }
  return c;
}

/**
 * Devuelve un entero aleatorio en [0, max) usando muestreo por rechazo sobre
 * bytes criptográficos, evitando el sesgo de módulo.
 */
function secureRandomInt(max: number, crypto: Crypto): number {
  if (max <= 0) throw new Error("max debe ser positivo");
  if (max === 1) return 0;
  // Mayor múltiplo de `max` que cabe en 256, para descartar el resto.
  const limit = Math.floor(256 / max) * max;
  const buf = new Uint8Array(1);
  // El bucle termina con probabilidad 1; el rechazo es < 50% en el peor caso.
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

function pick(chars: string, crypto: Crypto): string {
  return chars[secureRandomInt(chars.length, crypto)];
}

/**
 * Genera una contraseña que cumple las opciones dadas. Garantiza al menos un
 * carácter de cada categoría seleccionada (cuando la longitud lo permite) y
 * mezcla el resultado con Fisher–Yates usando la misma fuente segura.
 *
 * Lanza si las opciones no son válidas: quien llama debe validar antes para
 * mostrar el error en la interfaz.
 */
export function generatePassword(opts: PasswordOptions): string {
  const v = validateOptions(opts);
  if (!v.ok) throw new Error(v.error);
  const crypto = getCrypto();
  const { pools, alphabet } = buildCharPools(opts);

  const chars: string[] = [];
  // Garantiza representación de cada categoría seleccionada.
  for (const pool of pools) {
    if (chars.length < opts.length) chars.push(pick(pool, crypto));
  }
  // Rellena el resto desde el alfabeto completo.
  while (chars.length < opts.length) {
    chars.push(pick(alphabet, crypto));
  }
  // Mezcla Fisher–Yates para que las posiciones garantizadas no queden fijas.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1, crypto);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export type StrengthLevel = "weak" | "fair" | "strong" | "veryStrong";

export interface StrengthResult {
  bits: number;
  level: StrengthLevel;
  label: string;
  /** 0–100 para la barra de progreso. */
  percent: number;
}

/**
 * Estimación orientativa de entropía: longitud × log2(tamaño del alfabeto).
 * Es una cota superior del azar del *generador*, no una medida de la
 * resistencia real (que depende también del uso y almacenamiento).
 */
export function estimateEntropyBits(length: number, alphabetSize: number): number {
  if (length <= 0 || alphabetSize <= 1) return 0;
  return length * Math.log2(alphabetSize);
}

const LEVEL_LABELS: Record<StrengthLevel, string> = {
  weak: "Débil",
  fair: "Aceptable",
  strong: "Fuerte",
  veryStrong: "Muy fuerte",
};

export function strengthFromBits(bits: number): StrengthResult {
  let level: StrengthLevel;
  if (bits < 40) level = "weak";
  else if (bits < 60) level = "fair";
  else if (bits < 90) level = "strong";
  else level = "veryStrong";
  // Escala la barra hasta 128 bits (a partir de ahí, "lleno").
  const percent = Math.max(4, Math.min(100, Math.round((bits / 128) * 100)));
  return { bits: Math.round(bits), level, label: LEVEL_LABELS[level], percent };
}

/** Fuerza estimada para unas opciones concretas. */
export function estimateStrength(opts: PasswordOptions): StrengthResult {
  const { alphabet } = buildCharPools(opts);
  return strengthFromBits(estimateEntropyBits(opts.length, alphabet.length));
}
