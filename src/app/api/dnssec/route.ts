import { NextRequest } from "next/server";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { checkDnssec } from "@/lib/providers/dnssec";
import { normalizeDomain } from "@/lib/net/domain";
import { domainQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "dnssec", 20, 60_000);
  if (limited) return limited;

  const parsed = domainQuerySchema.safeParse({ domain: req.nextUrl.searchParams.get("domain") ?? "" });
  if (!parsed.success) return jsonError("Introduce un dominio válido.", 400);

  const norm = normalizeDomain(parsed.data.domain);
  if (!norm.ok) return jsonError(norm.error, 422);

  try {
    const result = await checkDnssec(norm.domain);
    return jsonOk({ ...result, unicode: norm.unicode });
  } catch (err) {
    return handleUnexpected(err, "dnssec");
  }
}
