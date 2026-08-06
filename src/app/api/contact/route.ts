import { NextRequest } from "next/server";
import { enforceRateLimit, jsonError, jsonOk } from "@/lib/api";
import { contactSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Formulario de contacto. Arquitectura preparada para un proveedor de correo
 * (Resend) vía variables de entorno. Si no hay proveedor configurado, la
 * petición se valida correctamente y se responde con transparencia de que el
 * canal está en configuración (sin bloquear el despliegue ni inventar buzones).
 */
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "contact", 5, 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Cuerpo de la petición no válido.", 400);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return jsonError(first?.message ?? "Revisa los datos del formulario.", 422);
  }

  // Honeypot: si el campo oculto llega con contenido, tratamos como spam
  // pero respondemos 200 para no dar pistas al bot.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return jsonOk({ delivered: false, status: "ok" });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!resendKey || !to) {
    // Degradación honesta.
    return jsonOk({
      delivered: false,
      status: "configuring",
      message:
        "Hemos recibido tu mensaje, pero el canal de correo está en configuración. Vuelve a intentarlo más adelante.",
    });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${resendKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "IPLibre <onboarding@resend.dev>",
        to: [to],
        reply_to: parsed.data.email,
        subject: `[IPLibre] ${parsed.data.subject}`,
        text: `De: ${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}`);
    return jsonOk({ delivered: true, status: "sent" });
  } catch {
    return jsonError(
      "No se pudo enviar el mensaje en este momento. Inténtalo más tarde.",
      502,
    );
  }
}
