/**
 * Ofuscación de direcciones IP para compartir resultados sin exponer
 * la IP completa del usuario.
 */
import { isIPv4, isIPv6 } from "@/lib/net/ip";

/**
 * Enmascara una IP conservando el prefijo de red:
 *  - IPv4: 190.85.12.34  → 190.85.x.x
 *  - IPv6: 2a01:cb00::1   → 2a01:cb00::/xx (solo primeros grupos)
 */
export function maskIp(ip: string): string {
  const value = (ip || "").trim();
  if (isIPv4(value)) {
    const parts = value.split(".");
    return `${parts[0]}.${parts[1]}.x.x`;
  }
  if (isIPv6(value)) {
    const groups = value.split(":");
    return `${groups.slice(0, 2).join(":")}::`;
  }
  return "IP oculta";
}

/** Enmascara para telemetría/registro: nunca guardamos la IP completa. */
export function maskIpForLogs(ip: string): string {
  const value = (ip || "").trim();
  if (isIPv4(value)) {
    const parts = value.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  if (isIPv6(value)) {
    const groups = value.split(":");
    return `${groups.slice(0, 3).join(":")}::`;
  }
  return "unknown";
}
