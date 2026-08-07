/**
 * Protección SSRF para las herramientas que realizan peticiones a URLs
 * introducidas por el usuario (estado web, headers de seguridad).
 *
 * Estrategia:
 *  - Solo se permiten los esquemas http y https.
 *  - Antes de cada petición se resuelve el hostname (A/AAAA) y se comprueba que
 *    NINGUNA de las IP resueltas sea privada, reservada o de loopback.
 *  - Tras cada redirección se vuelve a validar el destino (ver providers/website).
 *
 * Limitación conocida (documentada): existe una ventana TOCTOU entre nuestra
 * resolución DNS y la que realiza `fetch` internamente (posible DNS rebinding).
 * Para el modelo de amenaza de una herramienta pública de diagnóstico esto es
 * aceptable: no se exponen servicios internos en la plataforma de despliegue y
 * nunca se devuelve el cuerpo de la respuesta al cliente.
 */
import { promises as dns } from "node:dns";
import { isIP, isPrivateOrReservedIp } from "@/lib/net/ip";

/** El destino apunta (o podría apuntar) a una red interna: se bloquea. */
export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

/** No se pudo resolver el host (DNS). Distinto de un bloqueo SSRF. */
export class DnsResolutionError extends Error {
  constructor(message = "No se pudo resolver el dominio (DNS).") {
    super(message);
    this.name = "DnsResolutionError";
  }
}

/** Esquemas permitidos. Cualquier otro (file:, ftp:, gopher:, data:, …) se rechaza. */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function isAllowedProtocol(protocol: string): boolean {
  return ALLOWED_PROTOCOLS.has(protocol.toLowerCase());
}

/**
 * Resuelve un hostname a todas sus IP y verifica que sean públicas.
 * Lanza SsrfError si el destino apunta (o podría apuntar) a una red interna.
 * Devuelve la lista de IP públicas resueltas.
 */
export async function assertPublicHost(hostname: string): Promise<string[]> {
  const host = hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) throw new SsrfError("Host vacío.");

  // Si el propio host ya es una IP literal, se valida directamente.
  if (isIP(host)) {
    if (isPrivateOrReservedIp(host)) {
      throw new SsrfError("No se permiten destinos hacia direcciones internas o reservadas.");
    }
    return [host];
  }

  // Nunca resolver nombres locales evidentes.
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new SsrfError("No se permiten destinos locales.");
  }

  let records: { address: string }[];
  try {
    records = await dns.lookup(host, { all: true, verbatim: true });
  } catch {
    throw new DnsResolutionError();
  }

  if (!records.length) throw new DnsResolutionError("El dominio no tiene direcciones IP.");

  for (const { address } of records) {
    if (isPrivateOrReservedIp(address)) {
      throw new SsrfError("El dominio resuelve a una dirección interna o reservada.");
    }
  }
  return records.map((r) => r.address);
}
