import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { enforceRateLimit, jsonError, jsonOk } from "@/lib/api";
import {
  contactRequestSchema,
  sanitizeContactRequest,
} from "@/lib/contact/contact";
import { sendContactEmail } from "@/lib/contact/send-contact-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Formulario de contacto de IPLibre. Envío exclusivamente en servidor vía
 * Resend (ver `send-contact-email`). La API Key nunca sale del servidor; el
 * usuario no controla `from`, destinatario ni cabeceras. Su correo se usa como
 * `replyTo`. Si el proveedor no está configurado, degrada de forma honesta.
 */
export async function POST(req: NextRequest) {
  // Rate limit: máximo 5 envíos por minuto por IP.
  const limited = enforceRateLimit(req, "contact", 5, 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Cuerpo de la petición no válido.", 400);
  }

  const parsed = contactRequestSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return jsonError(first?.message ?? "Revisa los datos del formulario.", 422);
  }

  // Honeypot: si el campo oculto llega con contenido, tratamos como spam
  // pero respondemos 200 para no dar pistas al bot (y no enviamos correo).
  if (parsed.data.website && parsed.data.website.length > 0) {
    return jsonOk({ delivered: false, status: "ok" });
  }

  const data = sanitizeContactRequest(parsed.data);

  // Clave de idempotencia derivada del contenido: dos envíos idénticos
  // seguidos no generan correos duplicados (Resend deduplica por esta clave).
  const idempotencyKey = createHash("sha256")
    .update(`${data.email}|${data.subject}|${data.message}`)
    .digest("hex")
    .slice(0, 32);

  const result = await sendContactEmail(data, idempotencyKey);

  if (result.sent) {
    return jsonOk({ delivered: true, status: "sent" });
  }

  if (result.reason === "missing_config") {
    // Degradación honesta: el mensaje se valida pero el canal no está listo.
    return jsonOk({
      delivered: false,
      status: "configuring",
      message:
        "Hemos recibido tu mensaje, pero el canal de correo está en configuración. Vuelve a intentarlo más adelante.",
    });
  }

  // provider_error: fallo temporal del proveedor. El usuario puede reintentar.
  return jsonError(
    "No pudimos enviar tu mensaje. Inténtalo nuevamente.",
    502,
  );
}
