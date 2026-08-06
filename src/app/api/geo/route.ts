import { NextRequest } from "next/server";
import { enforceRateLimit, handleUnexpected, jsonError, jsonOk } from "@/lib/api";
import { isIP, isPrivateOrReservedIp } from "@/lib/net/ip";
import { lookupGeo } from "@/lib/providers/geo";
import { ipQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "geo", 30, 60_000);
  if (limited) return limited;

  const parsed = ipQuerySchema.safeParse({
    ip: req.nextUrl.searchParams.get("ip") ?? "",
  });
  if (!parsed.success) {
    return jsonError("Introduce una dirección IP para geolocalizar.", 400);
  }

  const ip = parsed.data.ip;
  if (!isIP(ip)) {
    return jsonError("La dirección IP no es válida (IPv4 o IPv6).", 422);
  }
  if (isPrivateOrReservedIp(ip)) {
    return jsonError(
      "Esa IP es privada o reservada y no tiene ubicación pública.",
      422,
    );
  }

  try {
    const geo = await lookupGeo(ip);
    return jsonOk(geo);
  } catch (err) {
    return handleUnexpected(err, "geo");
  }
}
