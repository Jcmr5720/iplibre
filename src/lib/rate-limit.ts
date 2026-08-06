/**
 * Rate limiting básico en memoria (token bucket por clave).
 *
 * Nota de arquitectura: en Vercel las funciones son efímeras y pueden
 * escalar a varias instancias, por lo que este limitador es una defensa
 * local de "mejor esfuerzo", no una garantía global. La interfaz
 * `RateLimiter` permite sustituirlo por una solución distribuida
 * (p. ej. Upstash Redis) sin tocar los route handlers.
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  limit: number;
  resetMs: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, Bucket>();
  private readonly capacity: number;
  private readonly refillPerMs: number;
  private readonly windowMs: number;

  constructor(limit = 30, windowMs = 60_000) {
    this.capacity = limit;
    this.windowMs = windowMs;
    this.refillPerMs = limit / windowMs;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, updatedAt: now };

    // Rellena en función del tiempo transcurrido.
    const elapsed = now - bucket.updatedAt;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillPerMs);
    bucket.updatedAt = now;

    if (bucket.tokens < 1) {
      this.buckets.set(key, bucket);
      const resetMs = Math.ceil((1 - bucket.tokens) / this.refillPerMs);
      return { ok: false, remaining: 0, limit: this.capacity, resetMs };
    }

    bucket.tokens -= 1;
    this.buckets.set(key, bucket);

    // Limpieza oportunista para no crecer sin límite.
    if (this.buckets.size > 5000) this.cleanup(now);

    return {
      ok: true,
      remaining: Math.floor(bucket.tokens),
      limit: this.capacity,
      resetMs: this.windowMs,
    };
  }

  private cleanup(now: number) {
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.updatedAt > this.windowMs * 2) this.buckets.delete(key);
    }
  }
}

// Limitadores compartidos por categoría de endpoint.
const limiters = new Map<string, InMemoryRateLimiter>();

export function getLimiter(name: string, limit: number, windowMs: number): InMemoryRateLimiter {
  let l = limiters.get(name);
  if (!l) {
    l = new InMemoryRateLimiter(limit, windowMs);
    limiters.set(name, l);
  }
  return l;
}

/** Deriva una clave de cliente a partir de las cabeceras de la petición. */
export function clientKey(req: Request): string {
  const h = req.headers;
  const ip =
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anon";
  return ip;
}
