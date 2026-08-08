/**
 * Lógica de dominio del formulario de contacto de IPLibre.
 *
 * Reutiliza la estructura del sistema de correo de PDFLibre (sanitización,
 * validación estricta y construcción del mensaje en el servidor), adaptada a
 * IPLibre. El envío real vive en `send-contact-email.ts`; aquí solo se validan
 * y se preparan los textos, sin tocar red externa.
 *
 * IDENTIDAD: aunque el remitente técnico use un dominio verificado en Resend
 * (p. ej. @pdflibre.app), todo el contenido deja claro que el mensaje proviene
 * de IPLibre (iplibre.online). PDFLibre solo actúa como infraestructura.
 */
import { z } from "zod";

/** Buzón por defecto si no se define CONTACT_TO_EMAIL (nunca hardcodear datos sensibles en más sitios). */
export const DEFAULT_SUPPORT_EMAIL = "camilomr57@gmail.com";

/** Remitente por defecto: dominio verificado en Resend, con nombre visible IPLibre. */
export const DEFAULT_FROM_EMAIL = "IPLibre Contacto <contacto@pdflibre.app>";

const boundedText = (min: number, max: number, msgMin?: string) =>
  z.string().trim().min(min, msgMin).max(max);

/**
 * Esquema de la petición de contacto. Límites estrictos y honeypot obligatorio
 * vacío. `page` es opcional (ruta desde la que se envió, informativa).
 */
export const contactRequestSchema = z.object({
  name: boundedText(2, 120, "Introduce tu nombre"),
  email: z.string().trim().email("Correo no válido").max(254),
  subject: boundedText(3, 160, "Asunto demasiado corto"),
  message: z.string().trim().min(10, "El mensaje es demasiado corto").max(4000),
  consent: z.literal(true, { message: "Debes aceptar la política de privacidad" }),
  // Ruta de origen (opcional): solo se acepta una ruta relativa corta.
  page: z.string().trim().max(300).optional().or(z.literal("")),
  // Honeypot: debe llegar vacío. Se acepta hasta cierto tamaño para poder
  // detectar el spam en el route (respuesta 200 silenciosa) en vez de un 422
  // que delataría el campo trampa ante el bot.
  website: z.string().max(200).optional(),
});

export type ContactRequest = z.infer<typeof contactRequestSchema>;

/** Datos ya validados y saneados listos para construir el correo. */
export type ContactEmailData = {
  name: string;
  email: string;
  subject: string;
  message: string;
  page?: string;
};

/**
 * Elimina caracteres de control y normaliza saltos de línea. Evita inyección
 * de cabeceras (CRLF) y caracteres invisibles en el correo.
 */
export function sanitizeContactText(value: string): string {
  const withoutControls = Array.from(value.normalize("NFKC"), (character) => {
    const code = character.charCodeAt(0);
    return code <= 8 ||
      code === 11 ||
      code === 12 ||
      (code >= 14 && code <= 31) ||
      code === 127
      ? ""
      : character;
  }).join("");
  return withoutControls.replace(/\r\n?/g, "\n").trim();
}

/** Sanea los campos de texto de la petición. El email nunca lleva saltos de línea. */
export function sanitizeContactRequest(data: ContactRequest): ContactEmailData {
  return {
    name: sanitizeContactText(data.name),
    email: sanitizeContactText(data.email).replace(/[\r\n]/g, ""),
    subject: sanitizeContactText(data.subject),
    message: sanitizeContactText(data.message),
    page: data.page ? sanitizeContactText(data.page).replace(/[\r\n]/g, "") : undefined,
  };
}

/** Escapa HTML para incrustar texto del usuario sin riesgo de inyección. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Construye el correo (asunto, texto plano y HTML) identificando claramente a
 * IPLibre. El remitente técnico puede ser @pdflibre.app, pero el contenido deja
 * claro el origen para que el destinatario no se confunda.
 */
export function buildContactEmail(data: ContactEmailData) {
  const sentAt = new Date().toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
  const { name, email, subject, message, page } = data;

  const emailSubject = `[IPLibre] ${subject} — ${name}`;

  const lines = [
    "Nuevo mensaje desde el formulario de IPLibre (iplibre.online)",
    "-------------------------------------------------------------",
    `Fecha y hora: ${sentAt}`,
    `Nombre: ${name}`,
    `Correo de contacto: ${email}`,
    `Asunto: ${subject}`,
  ];
  if (page) lines.push(`Página de origen: ${page}`);
  lines.push(
    "-------------------------------------------------------------",
    "Mensaje:",
    message,
    "",
    "— Enviado automáticamente desde iplibre.online. Responde a este correo para contestar directamente al remitente.",
  );
  const text = lines.join("\n");

  const html = `
  <div style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:#0e7490;padding:20px 24px">
        <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:.3px">IPLibre</div>
        <div style="font-size:12px;color:#cffafe">Mensaje recibido desde iplibre.online</div>
      </div>
      <div style="padding:24px">
        <p style="margin:0 0 16px;font-size:14px;color:#334155">
          Nuevo mensaje del formulario de contacto de <strong>IPLibre</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tbody>
            ${row("Fecha y hora", escapeHtml(sentAt))}
            ${row("Nombre", escapeHtml(name))}
            ${row("Correo", `<a href="mailto:${escapeHtml(email)}" style="color:#0e7490">${escapeHtml(email)}</a>`)}
            ${row("Asunto", escapeHtml(subject))}
            ${page ? row("Página", escapeHtml(page)) : ""}
          </tbody>
        </table>
        <div style="margin-top:20px">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;margin-bottom:6px">Mensaje</div>
          <div style="white-space:pre-wrap;line-height:1.6;font-size:14px;color:#0f172a;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px">${escapeHtml(message)}</div>
        </div>
      </div>
      <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b">
        Enviado desde <strong>iplibre.online</strong>. Pulsa «Responder» para contestar directamente a ${escapeHtml(email)}.
      </div>
    </div>
  </div>`.trim();

  return { subject: emailSubject, text, html };
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#64748b;width:120px;vertical-align:top">${label}</td>
    <td style="padding:6px 0;color:#0f172a">${value}</td>
  </tr>`;
}
