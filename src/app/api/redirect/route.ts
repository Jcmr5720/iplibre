import { NextRequest } from "next/server";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { traceRedirects } from "@/lib/providers/redirect";
import { urlQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "redirect", 20, 60_000);
  if (limited) return limited;

  const parsed = urlQuerySchema.safeParse({ url: req.nextUrl.searchParams.get("url") ?? "" });
  if (!parsed.success) return jsonError("Introduce una URL o dominio válido.", 400);

  try {
    const outcome = await traceRedirects(parsed.data.url);
    if (!outcome.ok) {
      const status = outcome.kind === "ssrf" || outcome.kind === "input" ? 422 : 502;
      return jsonError(outcome.error, status, { kind: outcome.kind });
    }
    return jsonOk(outcome.data);
  } catch (err) {
    return handleUnexpected(err, "redirect");
  }
}
