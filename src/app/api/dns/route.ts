import { NextRequest } from "next/server";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { normalizeDomain } from "@/lib/net/domain";
import { isPrivateOrReservedIp, isIP } from "@/lib/net/ip";
import { DNS_TYPES, getResolver, queryDns, resolvers, type DnsRecordType } from "@/lib/providers/dns";
import { dnsQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "dns", 40, 60_000);
  if (limited) return limited;

  const sp = req.nextUrl.searchParams;
  const typeParam = (sp.get("type") || "A").toUpperCase();
  const all = sp.get("all") === "1";

  const parsed = dnsQuerySchema.safeParse({
    domain: sp.get("domain") ?? "",
    type: typeParam,
  });
  if (!parsed.success) {
    return jsonError(
      `Parámetros no válidos. Tipos admitidos: ${DNS_TYPES.join(", ")}.`,
      400,
    );
  }

  // Normaliza y valida el dominio (incluye IDN → punycode).
  const norm = normalizeDomain(parsed.data.domain);
  if (!norm.ok) return jsonError(norm.error, 422);

  // Protección SSRF: si el usuario mete una IP, no debe apuntar a rangos internos.
  if (isIP(norm.domain) && isPrivateOrReservedIp(norm.domain)) {
    return jsonError("No se permiten consultas hacia direcciones internas.", 422);
  }

  const type = parsed.data.type as DnsRecordType;
  const resolver = getResolver(sp.get("resolver") || "cloudflare") || resolvers[0];

  try {
    if (all) {
      // Consulta el mismo tipo en todos los tipos habituales del dominio.
      const results = await Promise.all(
        DNS_TYPES.map((t) =>
          queryDns(norm.domain, t, resolver).catch(() => ({
            question: norm.domain,
            type: t,
            resolver: resolver.name,
            status: "ERROR",
            answers: [],
            responseMs: 0,
          })),
        ),
      );
      return jsonOk({ domain: norm.domain, unicode: norm.unicode, resolver: resolver.name, results });
    }

    const result = await queryDns(norm.domain, type, resolver);
    return jsonOk({ domain: norm.domain, unicode: norm.unicode, ...result });
  } catch (err) {
    return handleUnexpected(err, "dns");
  }
}
