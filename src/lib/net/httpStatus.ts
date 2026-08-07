/**
 * Textos y clasificación de códigos de estado HTTP en español, para la
 * herramienta de estado web. Diferencia claramente entre "servidor inaccesible"
 * y "servidor accesible que responde con un error HTTP".
 */

export type StatusClass = "ok" | "redirect" | "clientError" | "serverError" | "unknown";

const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Creado",
  204: "Sin contenido",
  301: "Movido permanentemente",
  302: "Encontrado (redirección temporal)",
  303: "Ver otro recurso",
  304: "No modificado",
  307: "Redirección temporal",
  308: "Redirección permanente",
  400: "Petición incorrecta",
  401: "No autorizado",
  403: "Acceso prohibido",
  404: "No encontrado",
  405: "Método no permitido",
  408: "Tiempo de espera agotado",
  410: "Ya no disponible",
  418: "Soy una tetera",
  421: "Petición mal dirigida",
  429: "Demasiadas peticiones",
  451: "No disponible por motivos legales",
  500: "Error interno del servidor",
  501: "No implementado",
  502: "Puerta de enlace incorrecta",
  503: "Servicio no disponible",
  504: "Tiempo de espera de la puerta de enlace",
  505: "Versión HTTP no soportada",
};

export function statusText(code: number): string {
  return STATUS_TEXT[code] ?? "Respuesta HTTP";
}

export function classifyStatus(code: number): StatusClass {
  if (code >= 200 && code < 300) return "ok";
  if (code >= 300 && code < 400) return "redirect";
  if (code >= 400 && code < 500) return "clientError";
  if (code >= 500 && code < 600) return "serverError";
  return "unknown";
}

export type OverallState = "up" | "warning" | "down";

/**
 * Estado general legible a partir del código HTTP final (cuando el servidor
 * respondió). Un 403/404 NO es "caído": el servidor está accesible.
 */
export function overallFromStatus(code: number): { state: OverallState; label: string; detail: string } {
  const cls = classifyStatus(code);
  switch (cls) {
    case "ok":
      return { state: "up", label: "Funcionando", detail: "El sitio responde correctamente." };
    case "redirect":
      return {
        state: "up",
        label: "Funcionando (con redirección)",
        detail: "El servidor responde y redirige a otra dirección.",
      };
    case "clientError":
      return {
        state: "warning",
        label: "Accesible con error de cliente",
        detail:
          code === 403
            ? "El servidor está accesible pero bloqueó esta petición (403)."
            : code === 404
              ? "El servidor está accesible pero el recurso no existe (404)."
              : "El servidor responde, pero con un error del lado del cliente.",
      };
    case "serverError":
      return {
        state: "down",
        label: "Error del servidor",
        detail: "El servidor está accesible pero devuelve un error interno.",
      };
    default:
      return { state: "warning", label: "Respuesta inesperada", detail: "Código HTTP no habitual." };
  }
}
