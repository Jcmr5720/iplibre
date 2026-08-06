/** Cliente ligero para consumir la API interna desde el navegador. */

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}
export interface ApiFailure {
  ok: false;
  error: string;
  status: number;
  code?: string;
}
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(path, { signal, headers: { accept: "application/json" } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.ok === false) {
      return {
        ok: false,
        error: body.error || `Error ${res.status}`,
        status: res.status,
        code: body.code,
      };
    }
    return { ok: true, data: body.data as T };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "Consulta cancelada", status: 0, code: "aborted" };
    }
    return {
      ok: false,
      error: "No hay conexión o la petición falló.",
      status: 0,
      code: "network",
    };
  }
}

export async function apiPost<T>(path: string, data: unknown): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.ok === false) {
      return { ok: false, error: body.error || `Error ${res.status}`, status: res.status, code: body.code };
    }
    return { ok: true, data: body.data as T };
  } catch {
    return { ok: false, error: "No hay conexión o la petición falló.", status: 0, code: "network" };
  }
}
