/**
 * Envío del correo de contacto vía Resend (solo servidor).
 *
 * Réplica adaptada del sistema de PDFLibre: la API Key vive únicamente en
 * variables de entorno, el usuario nunca controla `from`, destinatario ni
 * cabeceras, y su correo se usa como `replyTo` (nunca como `from`) para no
 * romper SPF/DKIM/DMARC. Usa fetch a la API de Resend para no añadir
 * dependencias nuevas (misma estrategia que el resto de IPLibre).
 */
import {
  buildContactEmail,
  DEFAULT_FROM_EMAIL,
  DEFAULT_SUPPORT_EMAIL,
  type ContactEmailData,
} from "@/lib/contact/contact";

export type SendContactEmailResult =
  | { sent: true; id?: string }
  | { sent: false; reason: "missing_config" | "provider_error" };

export async function sendContactEmail(
  data: ContactEmailData,
  idempotencyKey: string,
): Promise<SendContactEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "missing_config" };

  const from = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL || DEFAULT_SUPPORT_EMAIL;
  const { subject, text, html } = buildContactEmail(data);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        // Evita duplicados si el usuario reenvía el mismo mensaje rápidamente.
        "Idempotency-Key": `iplibre-contact-${idempotencyKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: data.email,
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) return { sent: false, reason: "provider_error" };
    const body = (await res.json().catch(() => null)) as { id?: string } | null;
    return { sent: true, id: body?.id };
  } catch {
    return { sent: false, reason: "provider_error" };
  }
}
