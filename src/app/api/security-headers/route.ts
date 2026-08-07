import { NextRequest } from "next/server";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { followRedirectsSafely } from "@/lib/providers/website";
import { analyzeSecurityHeaders } from "@/lib/security/headers";
import { urlQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "security-headers", 20, 60_000);
  if (limited) return limited;

  const parsed = urlQuerySchema.safeParse({ url: req.nextUrl.searchParams.get("url") ?? "" });
  if (!parsed.success) return jsonError("Introduce un dominio o URL válido.", 400);

  try {
    const outcome = await followRedirectsSafely(parsed.data.url);
    if (!outcome.ok) {
      if (outcome.kind === "input" || outcome.kind === "ssrf") {
        return jsonError(outcome.error, 422);
      }
      return jsonOk({
        input: parsed.data.url,
        reachable: false,
        stateDetail: outcome.error,
        errorKind: outcome.kind,
        checkedAt: new Date().toISOString(),
      });
    }

    const { finalUrl, res, status, redirectChain } = outcome.data;
    const report = analyzeSecurityHeaders((name) => res.headers.get(name));

    return jsonOk({
      input: parsed.data.url,
      finalUrl,
      status,
      reachable: true,
      redirectCount: redirectChain.length,
      ...report,
    });
  } catch (err) {
    return handleUnexpected(err, "security-headers");
  }
}
