/**
 * Utilidades puras para el análisis de cadenas de redirección HTTP.
 * La traza real (con protección SSRF) vive en `@/lib/providers/redirect`.
 */

export type RedirectKind = "permanent" | "temporary" | "other";

export interface RedirectTypeInfo {
  kind: RedirectKind;
  label: string;
}

/** Clasifica el tipo de redirección a partir del código 3xx. */
export function redirectType(status: number): RedirectTypeInfo {
  switch (status) {
    case 301:
      return { kind: "permanent", label: "301 Permanente" };
    case 308:
      return { kind: "permanent", label: "308 Permanente" };
    case 302:
      return { kind: "temporary", label: "302 Temporal" };
    case 303:
      return { kind: "temporary", label: "303 Ver otro" };
    case 307:
      return { kind: "temporary", label: "307 Temporal" };
    default:
      return { kind: "other", label: `${status} Redirección` };
  }
}

export function isRedirectStatus(status: number): boolean {
  return status >= 300 && status < 400;
}

/**
 * Normaliza una URL para comparar y detectar bucles. Ignora el fragmento y una
 * barra final redundante, pero conserva query y mayúsculas de la ruta.
 */
export function canonicalForLoop(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    let s = u.toString();
    // Quita una barra final del path cuando no hay query.
    if (!u.search && u.pathname.endsWith("/") && u.pathname !== "/") {
      s = s.replace(/\/$/, "");
    }
    return s;
  } catch {
    return url;
  }
}

/**
 * ¿La siguiente URL ya se ha visitado? Detecta bucles de redirección.
 * `visited` debe contener URLs ya canonicalizadas.
 */
export function isLoop(visited: string[], next: string): boolean {
  return visited.includes(canonicalForLoop(next));
}
