import { NextRequest } from "next/server";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { isIP, isPrivateOrReservedIp } from "@/lib/net/ip";
import { normalizeAsn } from "@/lib/net/asn";
import { normalizeDomain } from "@/lib/net/domain";
import { rdapAutnum, rdapDomain, rdapIp, RdapNotFoundError } from "@/lib/providers/rdap";
import { rdapQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WHOIS/RDAP unificado: detecta si la consulta es dominio, IP o ASN y usa
 * el endpoint RDAP correspondiente.
 */
export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "rdap", 25, 60_000);
  if (limited) return limited;

  const parsed = rdapQuerySchema.safeParse({
    query: req.nextUrl.searchParams.get("query") ?? "",
  });
  if (!parsed.success) return jsonError("Introduce un dominio, IP o ASN.", 400);

  const raw = parsed.data.query.trim();

  try {
    // 1) ASN
    const asn = normalizeAsn(raw);
    if (/^as/i.test(raw) && asn.ok) {
      const data = await rdapAutnum(asn.asn);
      return jsonOk({ kind: "asn", input: asn.label, ...data });
    }

    // 2) IP
    if (isIP(raw)) {
      if (isPrivateOrReservedIp(raw)) {
        return jsonError("Esa IP es privada o reservada; no hay registro público.", 422);
      }
      const data = await rdapIp(raw);
      return jsonOk({ kind: "ip", input: raw, ...data });
    }

    // 3) ASN sin prefijo "AS" pero claramente numérico corto
    if (/^\d+$/.test(raw) && asn.ok) {
      const data = await rdapAutnum(asn.asn);
      return jsonOk({ kind: "asn", input: asn.label, ...data });
    }

    // 4) Dominio
    const norm = normalizeDomain(raw);
    if (!norm.ok) return jsonError(norm.error, 422);
    const data = await rdapDomain(norm.domain);
    return jsonOk({ kind: "domain", input: norm.domain, unicode: norm.unicode, ...data });
  } catch (err) {
    if (err instanceof RdapNotFoundError) {
      return jsonError(err.message, 404, { notFound: true });
    }
    return handleUnexpected(err, "rdap");
  }
}
