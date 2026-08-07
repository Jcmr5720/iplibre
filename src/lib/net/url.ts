/**
 * Normalización y validación de URLs introducidas por el usuario para las
 * herramientas de sitios web (estado, headers). Acepta tanto un dominio
 * (`google.com`) como una URL completa (`https://google.com/ruta`).
 */
import { isAllowedProtocol } from "@/lib/net/ssrf";

export type UrlResult =
  | { ok: true; url: string; protocol: "http:" | "https:"; hostname: string; origin: string }
  | { ok: false; error: string };

/**
 * Normaliza la entrada a una URL absoluta con esquema http/https.
 * - Si no incluye esquema, se asume https://.
 * - Rechaza esquemas no permitidos (file:, ftp:, javascript:, data:, …).
 * - Rechaza credenciales embebidas (user:pass@host) para evitar confusión.
 */
export function normalizeWebUrl(raw: string): UrlResult {
  if (typeof raw !== "string") return { ok: false, error: "Entrada no válida." };
  let value = raw.trim();
  if (!value) return { ok: false, error: "Introduce un dominio o URL." };
  if (value.length > 2048) return { ok: false, error: "La URL es demasiado larga." };

  // Detecta un esquema explícito. Si es uno no permitido, se rechaza antes de asumir https.
  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(value);
  if (schemeMatch) {
    const scheme = `${schemeMatch[1].toLowerCase()}:`;
    if (!isAllowedProtocol(scheme)) {
      return { ok: false, error: `Esquema no permitido: solo se admiten http y https.` };
    }
  } else {
    value = `https://${value}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, error: "La URL no tiene un formato válido." };
  }

  if (!isAllowedProtocol(parsed.protocol)) {
    return { ok: false, error: "Solo se admiten direcciones http y https." };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: "No se admiten URLs con credenciales embebidas." };
  }
  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    // Permite IPv6/IPv4 literales; para nombres exige al menos un punto.
    const isBracketedV6 = parsed.hostname.startsWith("[");
    const looksIp = /^\d/.test(parsed.hostname) || isBracketedV6;
    if (!looksIp) return { ok: false, error: "El dominio debe incluir al menos un punto." };
  }

  return {
    ok: true,
    url: parsed.toString(),
    protocol: parsed.protocol as "http:" | "https:",
    hostname: parsed.hostname.replace(/^\[|\]$/g, ""),
    origin: parsed.origin,
  };
}
