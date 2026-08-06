/**
 * Helpers compartidos para los route handlers: respuestas JSON consistentes,
 * cabeceras de rate limit, y manejo de errores sin filtrar información interna.
 */
import { NextResponse } from "next/server";
import { clientKey, getLimiter } from "@/lib/rate-limit";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(
    { ok: true, data },
    {
      ...init,
      headers: {
        "cache-control": "no-store",
        ...(init?.headers || {}),
      },
    },
  );
}

export function jsonError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
): NextResponse {
  const errorId = Math.random().toString(36).slice(2, 10).toUpperCase();
  return NextResponse.json(
    { ok: false, error: message, errorId, ...extra },
    { status, headers: { "cache-control": "no-store" } },
  );
}

/**
 * Aplica rate limiting a una petición. Devuelve `null` si está permitida,
 * o una respuesta 429 lista para retornar.
 */
export function enforceRateLimit(
  req: Request,
  name: string,
  limit = 30,
  windowMs = 60_000,
): NextResponse | null {
  const limiter = getLimiter(name, limit, windowMs);
  const result = limiter.check(`${name}:${clientKey(req)}`);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Has alcanzado el límite temporal de consultas. Inténtalo de nuevo en unos segundos.",
        code: "rate_limited",
      },
      {
        status: 429,
        headers: {
          "cache-control": "no-store",
          "retry-after": Math.ceil(result.resetMs / 1000).toString(),
          "x-ratelimit-limit": result.limit.toString(),
          "x-ratelimit-remaining": result.remaining.toString(),
        },
      },
    );
  }
  return null;
}

/** Convierte cualquier error en una respuesta segura y registra lo mínimo. */
export function handleUnexpected(err: unknown, context: string): NextResponse {
  const errorId = Math.random().toString(36).slice(2, 10).toUpperCase();
  // Registro técnico mínimo, sin datos personales.
  console.error(`[${context}] error ${errorId}:`, err instanceof Error ? err.message : "unknown");
  return NextResponse.json(
    {
      ok: false,
      error: "No se pudo completar la consulta. La fuente externa podría no estar disponible.",
      errorId,
    },
    { status: 502, headers: { "cache-control": "no-store" } },
  );
}
