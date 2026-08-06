import { NextRequest } from "next/server";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { isIP, isPrivateOrReservedIp } from "@/lib/net/ip";
import { normalizeDomain } from "@/lib/net/domain";
import { reverseName } from "@/lib/net/reverse";
import { queryDns, resolvers } from "@/lib/providers/dns";
import { asnQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reverse DNS (PTR) para una IP, o resolución directa (A/AAAA) para un dominio,
 * dejando clara la diferencia entre ambas.
 */
export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "reverse-dns", 40, 60_000);
  if (limited) return limited;

  const parsed = asnQuerySchema.safeParse({
    query: req.nextUrl.searchParams.get("query") ?? "",
  });
  if (!parsed.success) return jsonError("Introduce una IP o un dominio.", 400);

  const raw = parsed.data.query.trim();
  const resolver = resolvers[0]; // Cloudflare

  try {
    if (isIP(raw)) {
      if (isPrivateOrReservedIp(raw)) {
        return jsonError("Esa IP es privada o reservada; no tiene PTR público.", 422);
      }
      const name = reverseName(raw);
      if (!name) return jsonError("No se pudo construir el nombre inverso.", 422);
      const res = await queryDns(name, "PTR", resolver);
      const hostnames = res.answers.map((a) => a.data.replace(/\.$/, ""));
      return jsonOk({
        mode: "reverse",
        ip: raw,
        reverseName: name,
        resolver: resolver.name,
        responseMs: res.responseMs,
        status: res.status,
        hostnames,
        hasPtr: hostnames.length > 0,
        note:
          hostnames.length === 0
            ? "No existe registro PTR para esta IP. Es habitual en muchas IP residenciales; no es un error."
            : undefined,
      });
    }

    // Resolución directa.
    const norm = normalizeDomain(raw);
    if (!norm.ok) return jsonError(norm.error, 422);
    const [a, aaaa] = await Promise.all([
      queryDns(norm.domain, "A", resolver).catch(() => null),
      queryDns(norm.domain, "AAAA", resolver).catch(() => null),
    ]);
    const ipv4 = a?.answers.map((x) => x.data) ?? [];
    const ipv6 = aaaa?.answers.map((x) => x.data) ?? [];
    return jsonOk({
      mode: "forward",
      domain: norm.domain,
      unicode: norm.unicode,
      resolver: resolver.name,
      ipv4,
      ipv6,
      responseMs: (a?.responseMs ?? 0) + (aaaa?.responseMs ?? 0),
    });
  } catch (err) {
    return handleUnexpected(err, "reverse-dns");
  }
}
