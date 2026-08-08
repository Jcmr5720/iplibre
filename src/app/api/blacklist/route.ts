import { NextRequest } from "next/server";
import { promises as dns } from "node:dns";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { checkBlacklists } from "@/lib/providers/blacklist";
import { isIPv4, isIPv6, isPrivateOrReservedIp } from "@/lib/net/ip";
import { normalizeDomain } from "@/lib/net/domain";
import { ipQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Resuelve un dominio a su primera IPv4 pública. */
async function resolveDomainToIpv4(domain: string): Promise<string | null> {
  try {
    const records = await dns.lookup(domain, { all: true, family: 4 });
    for (const { address } of records) {
      if (isIPv4(address) && !isPrivateOrReservedIp(address)) return address;
    }
  } catch {
    return null;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "blacklist", 10, 60_000);
  if (limited) return limited;

  const raw = (req.nextUrl.searchParams.get("query") ?? "").trim();
  const parsed = ipQuerySchema.safeParse({ ip: raw || "-" });
  if (!parsed.success && !raw) return jsonError("Introduce una IP o un dominio.", 400);

  let ip = raw;
  let resolvedFrom: string | undefined;

  if (isIPv6(raw)) {
    return jsonError(
      "Las listas DNSBL de esta herramienta solo admiten IPv4 por ahora. La mayoría de listas de reputación no cubren IPv6 de forma fiable.",
      422,
    );
  }

  if (!isIPv4(raw)) {
    // Se interpreta como dominio: se resuelve a su IPv4 pública.
    const norm = normalizeDomain(raw);
    if (!norm.ok) return jsonError("Introduce una IPv4 válida o un dominio.", 422);
    const resolved = await resolveDomainToIpv4(norm.domain);
    if (!resolved) {
      return jsonError("No se pudo resolver el dominio a una dirección IPv4 pública.", 422);
    }
    ip = resolved;
    resolvedFrom = norm.domain;
  }

  if (isPrivateOrReservedIp(ip)) {
    return jsonError("No se pueden comprobar direcciones privadas o reservadas.", 422);
  }

  try {
    const summary = await checkBlacklists(ip);
    return jsonOk({ ...summary, resolvedFrom });
  } catch (err) {
    return handleUnexpected(err, "blacklist");
  }
}
