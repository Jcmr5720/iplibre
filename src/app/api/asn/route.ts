import { NextRequest } from "next/server";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { isIP, isPrivateOrReservedIp } from "@/lib/net/ip";
import { normalizeAsn } from "@/lib/net/asn";
import { ipToAsn, lookupAsn } from "@/lib/providers/asninfo";
import { rdapAutnum } from "@/lib/providers/rdap";
import { asnQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "asn", 25, 60_000);
  if (limited) return limited;

  const parsed = asnQuerySchema.safeParse({
    query: req.nextUrl.searchParams.get("query") ?? "",
  });
  if (!parsed.success) return jsonError("Introduce un ASN (p. ej. AS15169) o una IP.", 400);

  const raw = parsed.data.query.trim();

  try {
    // Si es una IP, primero resolvemos su ASN.
    if (isIP(raw)) {
      if (isPrivateOrReservedIp(raw)) {
        return jsonError("Esa IP es privada o reservada; no pertenece a un ASN público.", 422);
      }
      const mapping = await ipToAsn(raw);
      if (!mapping.asn) return jsonError("No se encontró un ASN para esa IP.", 404);
      const info = await lookupAsn(mapping.asn);
      const rdap = await rdapAutnum(mapping.asn).catch(() => null);
      if (!info.country && rdap?.country) info.country = rdap.country;
      return jsonOk({ via: "ip", mapping, info, rdap });
    }

    const asn = normalizeAsn(raw);
    if (!asn.ok) return jsonError(asn.error, 422);
    const info = await lookupAsn(asn.asn);
    const rdap = await rdapAutnum(asn.asn).catch(() => null);
    if (!info.country && rdap?.country) info.country = rdap.country;
    return jsonOk({ via: "asn", info, rdap });
  } catch (err) {
    return handleUnexpected(err, "asn");
  }
}
