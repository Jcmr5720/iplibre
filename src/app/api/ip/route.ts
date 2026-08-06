import { NextRequest } from "next/server";
import { enforceRateLimit, jsonError, jsonOk } from "@/lib/api";
import { firstPublicIp } from "@/lib/net/ip";
import { lookupGeo } from "@/lib/providers/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Detecta la IP pública del visitante a partir de las cabeceras de la
 * petición y la enriquece con datos de red/ubicación aproximada.
 * No se almacena la IP.
 */
export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "ip", 40, 60_000);
  if (limited) return limited;

  const h = req.headers;
  const ip =
    firstPublicIp(h.get("x-forwarded-for")) ||
    firstPublicIp(h.get("x-real-ip")) ||
    firstPublicIp(h.get("cf-connecting-ip")) ||
    "";

  if (!ip) {
    return jsonError(
      "No se pudo determinar tu IP pública desde la petición. En desarrollo local esto es normal.",
      404,
    );
  }

  try {
    const geo = await lookupGeo(ip);
    return jsonOk({ ...geo, detectedFrom: "request-headers" });
  } catch {
    // Degradación honesta: al menos devolvemos la IP detectada.
    return jsonOk({
      ip,
      version: ip.includes(":") ? 6 : 4,
      source: "cabeceras de la petición",
      fetchedAt: new Date().toISOString(),
      partial: true,
      note: "La IP se detectó, pero el proveedor de geolocalización no respondió.",
    });
  }
}
