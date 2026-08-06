/**
 * Utilidades de red para las llamadas del servidor a fuentes externas:
 * timeout, reintentos controlados y cabeceras seguras.
 */

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export async function fetchWithTimeout(
  url: string,
  { timeoutMs = 8000, retries = 0, retryDelayMs = 400, ...init }: FetchOptions = {},
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          "user-agent": "IPLibre/1.0 (+https://iplibre.vercel.app)",
          accept: "application/json",
          ...(init.headers || {}),
        },
      });
      clearTimeout(timer);
      // Reintenta solo en errores transitorios del servidor.
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        lastError = new HttpError(`HTTP ${res.status}`, res.status);
        await delay(retryDelayMs * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < retries) {
        await delay(retryDelayMs * (attempt + 1));
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Error de red");
}

export async function fetchJson<T>(url: string, options?: FetchOptions): Promise<T> {
  const res = await fetchWithTimeout(url, options);
  if (!res.ok) {
    throw new HttpError(`La fuente respondió ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
