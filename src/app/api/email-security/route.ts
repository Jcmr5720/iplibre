import { NextRequest } from "next/server";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { checkMailSecurity } from "@/lib/providers/mail";
import { normalizeDomain } from "@/lib/net/domain";
import { domainQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SELECTOR_RE = /^[a-z0-9]([a-z0-9._-]{0,62})$/i;

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "email-security", 20, 60_000);
  if (limited) return limited;

  const parsed = domainQuerySchema.safeParse({ domain: req.nextUrl.searchParams.get("domain") ?? "" });
  if (!parsed.success) return jsonError("Introduce un dominio válido.", 400);

  const norm = normalizeDomain(parsed.data.domain);
  if (!norm.ok) return jsonError(norm.error, 422);

  const rawSelector = (req.nextUrl.searchParams.get("selector") ?? "").trim();
  let selector: string | undefined;
  if (rawSelector) {
    if (!SELECTOR_RE.test(rawSelector)) {
      return jsonError("El selector DKIM no es válido.", 422);
    }
    selector = rawSelector.toLowerCase();
  }

  try {
    const result = await checkMailSecurity(norm.domain, selector);
    return jsonOk({ ...result, unicode: norm.unicode });
  } catch (err) {
    return handleUnexpected(err, "email-security");
  }
}
