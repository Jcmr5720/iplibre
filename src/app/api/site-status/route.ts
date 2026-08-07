import { NextRequest } from "next/server";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { checkWebsite } from "@/lib/providers/website";
import { urlQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "site-status", 20, 60_000);
  if (limited) return limited;

  const parsed = urlQuerySchema.safeParse({ url: req.nextUrl.searchParams.get("url") ?? "" });
  if (!parsed.success) return jsonError("Introduce un dominio o URL válido.", 400);

  try {
    const result = await checkWebsite(parsed.data.url);
    if (!result.ok) {
      // Errores de entrada/SSRF → 422; el resto (servidor inaccesible) → 200
      // con reachable:false para que la UI pueda diferenciarlo con claridad.
      if (result.kind === "input" || result.kind === "ssrf") {
        return jsonError(result.error, 422);
      }
      return jsonOk({
        input: parsed.data.url,
        reachable: false,
        state: "down",
        stateLabel: "No accesible",
        stateDetail: result.error,
        errorKind: result.kind,
        checkedAt: new Date().toISOString(),
      });
    }
    return jsonOk(result.data);
  } catch (err) {
    return handleUnexpected(err, "site-status");
  }
}
