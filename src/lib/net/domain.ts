/**
 * Normalización y validación de nombres de dominio, con soporte para
 * dominios internacionalizados (IDN → punycode).
 */

const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export type DomainResult =
  | { ok: true; domain: string; unicode: string }
  | { ok: false; error: string };

/**
 * Convierte a ASCII/punycode usando la API URL del runtime (sin dependencias).
 * Devuelve null si la conversión falla.
 */
function toAscii(input: string): { ascii: string; unicode: string } | null {
  try {
    // `new URL` aplica el algoritmo IDNA del host y produce punycode.
    const u = new URL(`http://${input}`);
    const ascii = u.hostname;
    if (!ascii) return null;
    let unicode = ascii;
    try {
      // Reconstruye la forma legible (unicode) cuando es posible.
      unicode = decodeURIComponent(escape(ascii));
    } catch {
      unicode = ascii;
    }
    return { ascii, unicode };
  } catch {
    return null;
  }
}

/**
 * Normaliza un dominio introducido por el usuario:
 * - elimina esquema, ruta, credenciales y puerto,
 * - pasa a minúsculas y quita el punto final,
 * - convierte IDN a punycode,
 * - valida la estructura de etiquetas.
 */
export function normalizeDomain(raw: string): DomainResult {
  if (typeof raw !== "string") return { ok: false, error: "Dominio no válido" };
  let value = raw.trim().toLowerCase();
  if (!value) return { ok: false, error: "Introduce un dominio" };
  if (value.length > 253) return { ok: false, error: "El dominio es demasiado largo" };

  // Quita esquema y todo lo que no sea el host.
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  value = value.split("/")[0];
  value = value.split("@").pop() as string; // credenciales
  value = value.split("?")[0].split("#")[0];
  // Elimina puerto (pero no rompe IPv6, que aquí no aplica a dominios).
  value = value.replace(/:\d+$/, "");
  value = value.replace(/\.$/, "");

  if (!value) return { ok: false, error: "Introduce un dominio válido" };
  if (!value.includes(".")) {
    return { ok: false, error: "El dominio debe incluir al menos un punto" };
  }

  const converted = toAscii(value);
  if (!converted) return { ok: false, error: "El dominio contiene caracteres no válidos" };

  const { ascii, unicode } = converted;
  const labels = ascii.split(".");
  if (labels.length < 2) return { ok: false, error: "Dominio incompleto" };
  for (const label of labels) {
    if (!LABEL_RE.test(label)) {
      return { ok: false, error: "El dominio contiene una etiqueta no válida" };
    }
  }
  // TLD no puede ser totalmente numérico.
  const tld = labels[labels.length - 1];
  if (/^\d+$/.test(tld)) return { ok: false, error: "TLD no válido" };

  return { ok: true, domain: ascii, unicode };
}

export function getRegistrableParts(domain: string): string[] {
  return domain.split(".");
}
