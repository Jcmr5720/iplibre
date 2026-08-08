import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  DONATION_CURRENCY,
  DONATION_MAX_AMOUNT,
  DONATION_MIN_AMOUNT,
  sanitizeDonationAmount,
} from "@/lib/donation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  amount: z.union([z.number(), z.string()]),
});

// Limitador anti-abuso en memoria (ventana fija por IP) para no permitir spam de
// creación de preferencias. Suficiente para una función serverless de baja frecuencia.
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function noStoreJson(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function resolveBaseUrl(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (proto && host) return `${proto}://${host}`;

  const origin = request.headers.get("origin");
  if (origin) return origin;

  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  return "https://iplibre.online";
}

function resolveAccessToken(): string | undefined {
  const mode = String(process.env.MERCADOPAGO_MODE || "").toLowerCase();
  if (mode === "sandbox") {
    return process.env.MERCADOPAGO_ACCESS_TOKEN_TEST || process.env.MERCADOPAGO_ACCESS_TOKEN;
  }
  return process.env.MERCADOPAGO_ACCESS_TOKEN;
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientIp(request))) {
    return noStoreJson(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
      429,
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return noStoreJson({ error: "Solicitud inválida." }, 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return noStoreJson({ error: "Falta el monto del aporte." }, 400);
  }

  const validation = sanitizeDonationAmount(parsed.data.amount);
  if (!validation.valid) {
    return noStoreJson({ error: validation.error }, 400);
  }
  const amount = validation.amount;

  const accessToken = resolveAccessToken();
  if (!accessToken) {
    return noStoreJson(
      { error: "El sistema de aportes aún no está configurado." },
      503,
    );
  }

  const baseUrl = resolveBaseUrl(request);
  const isHttps = baseUrl.startsWith("https://");

  // Mercado Pago solo acepta auto_return con back_urls públicas (https); en localhost
  // la preferencia falla si se envía, por eso se condiciona.
  const preferenceBody = {
    items: [
      {
        id: `donation-${Date.now()}`,
        title: "Aporte voluntario a IPLibre",
        description: "Aporte voluntario para mantener IPLibre gratuito.",
        quantity: 1,
        currency_id: DONATION_CURRENCY,
        unit_price: amount,
      },
    ],
    back_urls: {
      success: `${baseUrl}/donar/exito`,
      failure: `${baseUrl}/donar?estado=failure`,
      pending: `${baseUrl}/donar?estado=pending`,
    },
    ...(isHttps ? { auto_return: "approved" } : {}),
    external_reference: `donation:${randomUUID()}`,
    statement_descriptor: "IPLIBRE",
  };

  try {
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify(preferenceBody),
      cache: "no-store",
    });

    const mpData = (await mpResponse.json().catch(() => null)) as
      | { init_point?: string; sandbox_init_point?: string; message?: string }
      | null;

    if (!mpResponse.ok || !mpData) {
      console.error("Mercado Pago preference error", mpResponse.status, mpData?.message);
      return noStoreJson({ error: "No pudimos iniciar el pago. Intenta de nuevo." }, 502);
    }

    const mode = String(process.env.MERCADOPAGO_MODE || "").toLowerCase();
    const checkoutUrl =
      mode === "sandbox" && mpData.sandbox_init_point
        ? mpData.sandbox_init_point
        : mpData.init_point;

    if (!checkoutUrl) {
      return noStoreJson({ error: "No pudimos iniciar el pago. Intenta de nuevo." }, 502);
    }

    return noStoreJson({ init_point: checkoutUrl }, 200);
  } catch (error) {
    console.error("Mercado Pago preference request failed", error);
    return noStoreJson({ error: "El servicio de pagos no está disponible." }, 503);
  }
}

// Rango exportado por conveniencia para pruebas/documentación.
export const donationLimits = { min: DONATION_MIN_AMOUNT, max: DONATION_MAX_AMOUNT };
