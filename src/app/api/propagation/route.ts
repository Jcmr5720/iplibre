import { NextRequest } from "next/server";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { normalizeDomain } from "@/lib/net/domain";
import { DNS_TYPES, queryDns, resolvers, type DnsRecordType } from "@/lib/providers/dns";
import { propagationQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Compara la respuesta DNS de un dominio entre varios resolutores públicos.
 * IMPORTANTE (honestidad técnica): esto compara RESOLUTORES, no puntos de
 * presencia físicos en distintos países. Los resolutores usados son anycast
 * globales; una discrepancia sugiere propagación incompleta o respuestas
 * geo-dependientes, pero no equivale a "visto desde el país X".
 */
export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "propagation", 20, 60_000);
  if (limited) return limited;

  const sp = req.nextUrl.searchParams;
  const parsed = propagationQuerySchema.safeParse({
    domain: sp.get("domain") ?? "",
    type: (sp.get("type") || "A").toUpperCase(),
  });
  if (!parsed.success) {
    return jsonError(`Parámetros no válidos. Tipos: ${DNS_TYPES.join(", ")}.`, 400);
  }

  const norm = normalizeDomain(parsed.data.domain);
  if (!norm.ok) return jsonError(norm.error, 422);
  const type = parsed.data.type as DnsRecordType;

  try {
    const perResolver = await Promise.all(
      resolvers.map(async (r) => {
        try {
          const res = await queryDns(norm.domain, type, r);
          const values = res.answers.map((a) => a.data).sort();
          return {
            resolverId: r.id,
            resolver: r.name,
            location: r.location,
            status: res.status,
            responseMs: res.responseMs,
            values,
            fingerprint: values.join("|"),
          };
        } catch {
          return {
            resolverId: r.id,
            resolver: r.name,
            location: r.location,
            status: "ERROR",
            responseMs: 0,
            values: [] as string[],
            fingerprint: "__error__",
          };
        }
      }),
    );

    // Calcula coincidencia: agrupa por fingerprint de respuestas exitosas.
    const successful = perResolver.filter((r) => r.status !== "ERROR" && r.values.length > 0);
    const groups = new Map<string, number>();
    for (const r of successful) {
      groups.set(r.fingerprint, (groups.get(r.fingerprint) || 0) + 1);
    }
    const largest = Math.max(0, ...groups.values());
    const agreementPct = successful.length
      ? Math.round((largest / successful.length) * 100)
      : 0;
    const consistent = groups.size <= 1 && successful.length > 0;

    return jsonOk({
      domain: norm.domain,
      unicode: norm.unicode,
      type,
      resolvers: perResolver,
      summary: {
        total: perResolver.length,
        answered: successful.length,
        distinctAnswers: groups.size,
        agreementPct,
        consistent,
      },
    });
  } catch (err) {
    return handleUnexpected(err, "propagation");
  }
}
