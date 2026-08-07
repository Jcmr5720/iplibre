/**
 * Lógica cliente del Test IPv6. Mide la conectividad REAL del visitante desde
 * el navegador usando endpoints específicos por familia:
 *   - https://ipv4.icanhazip.com  → solo tiene registro A (fuerza IPv4)
 *   - https://ipv6.icanhazip.com  → solo tiene registro AAAA (fuerza IPv6)
 *
 * Metodología y limitaciones (documentadas):
 *  - La conectividad se detecta con `fetch(..., { mode: 'no-cors' })`: si el
 *    navegador no puede establecer la conexión (p. ej. no hay ruta IPv6), la
 *    promesa se rechaza. Esto es fiable y no depende de cabeceras CORS.
 *  - La IP pública se lee con una petición CORS adicional (best-effort). Si el
 *    endpoint no expone CORS, el veredicto de conectividad sigue siendo válido
 *    aunque no se muestre la IP.
 *  - No se puede inferir con total fiabilidad la "preferencia" del navegador;
 *    se aproxima observando con qué familia se llegó al propio servidor.
 */

export interface FamilyResult {
  family: 4 | 6;
  reachable: boolean;
  ip?: string;
  ms?: number;
}

const IPV4_ENDPOINT = "https://ipv4.icanhazip.com";
const IPV6_ENDPOINT = "https://ipv6.icanhazip.com";
const TIMEOUT_MS = 8000;

function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function detectReachable(url: string, signal: AbortSignal): Promise<boolean> {
  try {
    // `no-cors` resuelve con respuesta opaca si la conexión se establece, y
    // rechaza si falla a nivel de red (sin ruta a esa familia).
    await fetch(url, { mode: "no-cors", cache: "no-store", signal });
    return true;
  } catch {
    return false;
  }
}

async function readIp(url: string, signal: AbortSignal): Promise<string | undefined> {
  try {
    const res = await fetch(url, { cache: "no-store", signal });
    if (!res.ok) return undefined;
    const text = (await res.text()).trim();
    return text || undefined;
  } catch {
    return undefined; // CORS o red: no crítico para el veredicto.
  }
}

async function testFamily(family: 4 | 6, url: string): Promise<FamilyResult> {
  const started =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const { signal, clear } = withTimeout(TIMEOUT_MS);
  try {
    const reachable = await detectReachable(url, signal);
    const elapsed =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - started;
    if (!reachable) return { family, reachable: false };
    const ip = await readIp(url, signal);
    return { family, reachable: true, ip, ms: Math.round(elapsed) };
  } finally {
    clear();
  }
}

export type Ipv6Compat = "excellent" | "ipv6-issues" | "ipv4-only" | "ipv6-only" | "unknown";

export interface Ipv6TestResult {
  ipv4: FamilyResult;
  ipv6: FamilyResult;
  compat: Ipv6Compat;
}

export function classifyCompat(ipv4: FamilyResult, ipv6: FamilyResult): Ipv6Compat {
  if (ipv4.reachable && ipv6.reachable) return "excellent";
  if (!ipv4.reachable && ipv6.reachable) return "ipv6-only";
  if (ipv4.reachable && !ipv6.reachable) return "ipv4-only";
  return "unknown";
}

export async function runIpv6Test(): Promise<Ipv6TestResult> {
  const [ipv4, ipv6] = await Promise.all([
    testFamily(4, IPV4_ENDPOINT),
    testFamily(6, IPV6_ENDPOINT),
  ]);
  return { ipv4, ipv6, compat: classifyCompat(ipv4, ipv6) };
}
