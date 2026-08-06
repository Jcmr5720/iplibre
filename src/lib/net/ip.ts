/**
 * Validación y clasificación de direcciones IP (IPv4 / IPv6).
 * Sin dependencias externas para poder usarse en Edge, Node y tests.
 */

export type IpVersion = 4 | 6;

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isIPv4(value: string): boolean {
  const m = IPV4_RE.exec(value.trim());
  if (!m) return false;
  for (let i = 1; i <= 4; i++) {
    const part = m[i];
    // Sin ceros a la izquierda (salvo "0"), rango 0-255.
    if (part.length > 1 && part[0] === "0") return false;
    const n = Number(part);
    if (n < 0 || n > 255) return false;
  }
  return true;
}

/**
 * Valida IPv6 incluyendo formas comprimidas (::) y IPv4 embebido
 * (p. ej. ::ffff:192.168.0.1).
 */
export function isIPv6(value: string): boolean {
  const v = value.trim();
  if (v.length < 2 || !v.includes(":")) return false;
  // Zona de scope (fe80::1%eth0) no se admite en consultas públicas.
  if (v.includes("%")) return false;

  const parts = v.split("::");
  if (parts.length > 2) return false;

  const hexGroup = /^[0-9a-fA-F]{1,4}$/;

  const parseSide = (side: string): number | null => {
    if (side === "") return 0;
    const groups = side.split(":");
    let count = 0;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      // Último grupo puede ser IPv4 embebido.
      if (i === groups.length - 1 && g.includes(".")) {
        if (!isIPv4(g)) return null;
        count += 2;
        continue;
      }
      if (!hexGroup.test(g)) return null;
      count += 1;
    }
    return count;
  };

  if (parts.length === 2) {
    const left = parseSide(parts[0]);
    const right = parseSide(parts[1]);
    if (left === null || right === null) return false;
    return left + right <= 7; // "::" cubre al menos un grupo de ceros
  }

  const total = parseSide(v);
  return total === 8;
}

export function ipVersion(value: string): IpVersion | null {
  if (isIPv4(value)) return 4;
  if (isIPv6(value)) return 6;
  return null;
}

export function isIP(value: string): boolean {
  return ipVersion(value) !== null;
}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

function inCidr(ipInt: number, base: string, bits: number): boolean {
  const baseInt = ipv4ToInt(base);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

/**
 * ¿La IP es privada, reservada o de loopback? Se usa para evitar SSRF:
 * nunca consultamos ni resolvemos hacia destinos internos.
 */
export function isPrivateOrReservedIp(value: string): boolean {
  const v = value.trim();
  if (isIPv4(v)) {
    const n = ipv4ToInt(v);
    const ranges: [string, number][] = [
      ["0.0.0.0", 8],
      ["10.0.0.0", 8],
      ["100.64.0.0", 10], // CGNAT
      ["127.0.0.0", 8],
      ["169.254.0.0", 16], // link-local
      ["172.16.0.0", 12],
      ["192.0.0.0", 24],
      ["192.0.2.0", 24], // TEST-NET
      ["192.168.0.0", 16],
      ["198.18.0.0", 15], // benchmarking
      ["198.51.100.0", 24],
      ["203.0.113.0", 24],
      ["224.0.0.0", 4], // multicast
      ["240.0.0.0", 4], // reserved
      ["255.255.255.255", 32],
    ];
    return ranges.some(([base, bits]) => inCidr(n, base, bits));
  }
  if (isIPv6(v)) {
    const lower = v.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    if (lower.startsWith("fe80")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
    if (lower.startsWith("ff")) return true; // multicast
    if (lower.startsWith("::ffff:")) {
      const embedded = lower.slice("::ffff:".length);
      if (isIPv4(embedded)) return isPrivateOrReservedIp(embedded);
    }
    if (lower.startsWith("2001:db8")) return true; // documentation
    return false;
  }
  return false;
}

/**
 * Extrae la primera IP válida de una cabecera tipo `x-forwarded-for`.
 */
export function firstPublicIp(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const candidates = headerValue
    .split(",")
    .map((s) => s.trim())
    // Normaliza IPv4 mapeada a IPv6 y elimina puerto de IPv4.
    .map((s) => {
      const mapped = s.toLowerCase().startsWith("::ffff:") ? s.slice(7) : s;
      if (isIPv4(mapped.split(":")[0]) && mapped.includes(":")) {
        return mapped.split(":")[0];
      }
      return mapped;
    })
    .filter((s) => isIP(s));
  return candidates.find((ip) => !isPrivateOrReservedIp(ip)) ?? candidates[0] ?? null;
}
