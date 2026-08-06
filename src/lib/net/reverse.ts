/**
 * Construye el nombre inverso (.in-addr.arpa / .ip6.arpa) para consultas PTR.
 */
import { isIPv4, isIPv6 } from "@/lib/net/ip";

/** Expande una IPv6 a sus 32 nibbles completos. */
function expandIPv6(ip: string): string[] | null {
  if (!isIPv6(ip)) return null;
  let value = ip.toLowerCase();

  // Convierte IPv4 embebido a hextetos.
  const embeddedMatch = value.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (embeddedMatch && isIPv4(embeddedMatch[1])) {
    const octets = embeddedMatch[1].split(".").map((o) => Number(o));
    const h1 = ((octets[0] << 8) | octets[1]).toString(16).padStart(4, "0");
    const h2 = ((octets[2] << 8) | octets[3]).toString(16).padStart(4, "0");
    value = value.replace(embeddedMatch[1], `${h1}:${h2}`);
  }

  const parts = value.split("::");
  const head = parts[0] ? parts[0].split(":") : [];
  const tail = parts.length > 1 && parts[1] ? parts[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (missing < 0) return null;
  const groups = [...head, ...Array(parts.length > 1 ? missing : 0).fill("0"), ...tail];
  const full = groups.map((g) => g.padStart(4, "0"));
  if (full.length !== 8) return null;

  // 32 nibbles.
  return full.join("").split("");
}

export function reverseName(ip: string): string | null {
  if (isIPv4(ip)) {
    return `${ip.split(".").reverse().join(".")}.in-addr.arpa`;
  }
  const nibbles = expandIPv6(ip);
  if (!nibbles) return null;
  return `${nibbles.reverse().join(".")}.ip6.arpa`;
}
