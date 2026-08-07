import { NextRequest } from "next/server";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { checkSsl } from "@/lib/providers/ssl";
import { normalizeDomain } from "@/lib/net/domain";
import { hostQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "ssl", 20, 60_000);
  if (limited) return limited;

  const parsed = hostQuerySchema.safeParse({ host: req.nextUrl.searchParams.get("host") ?? "" });
  if (!parsed.success) return jsonError("Introduce un dominio válido.", 400);

  // Acepta dominio o URL; normalizeDomain extrae el host y valida IDN/estructura.
  const norm = normalizeDomain(parsed.data.host);
  if (!norm.ok) return jsonError(norm.error, 422);

  try {
    const result = await checkSsl(norm.domain);
    if (!result.ok) {
      if (result.kind === "ssrf") return jsonError(result.error, 422);
      return jsonOk({
        host: norm.domain,
        found: false,
        state: "unavailable",
        stateLabel: "No disponible",
        stateDetail: result.error,
        errorKind: result.kind,
        checkedAt: new Date().toISOString(),
      });
    }
    return jsonOk(result.data);
  } catch (err) {
    return handleUnexpected(err, "ssl");
  }
}
