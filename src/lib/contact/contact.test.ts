import { describe, expect, it } from "vitest";
import {
  buildContactEmail,
  contactRequestSchema,
  escapeHtml,
  sanitizeContactRequest,
} from "@/lib/contact/contact";

const valid = {
  name: "Ana Pérez",
  email: "ana@example.com",
  subject: "Una consulta",
  message: "Este es un mensaje de prueba suficientemente largo.",
  consent: true as const,
  page: "/contacto",
  website: "",
};

describe("contactRequestSchema", () => {
  it("acepta datos válidos", () => {
    expect(contactRequestSchema.safeParse(valid).success).toBe(true);
  });
  it("exige consentimiento", () => {
    expect(contactRequestSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });
  it("rechaza email inválido", () => {
    expect(contactRequestSchema.safeParse({ ...valid, email: "no-email" }).success).toBe(false);
  });
  it("rechaza mensaje demasiado corto", () => {
    expect(contactRequestSchema.safeParse({ ...valid, message: "corto" }).success).toBe(false);
  });
  it("el honeypot se acepta en el schema (lo filtra el route silenciosamente)", () => {
    expect(contactRequestSchema.safeParse({ ...valid, website: "x" }).success).toBe(true);
  });
});

describe("escapeHtml", () => {
  it("neutraliza etiquetas y comillas", () => {
    expect(escapeHtml(`<b>"'&`)).toBe("&lt;b&gt;&quot;&#039;&amp;");
  });
});

describe("sanitizeContactRequest", () => {
  it("elimina saltos de línea del email (anti CRLF injection)", () => {
    const out = sanitizeContactRequest({
      ...valid,
      email: "ana@example.com\r\nBcc: evil@x.com",
    });
    expect(out.email).not.toMatch(/[\r\n]/);
  });
});

describe("buildContactEmail", () => {
  const data = {
    name: "Ana",
    email: "ana@example.com",
    subject: "Hola",
    message: "Mensaje <script>alert(1)</script>",
    page: "/contacto",
  };
  it("el asunto identifica a IPLibre", () => {
    expect(buildContactEmail(data).subject).toContain("[IPLibre]");
  });
  it("el contenido menciona iplibre.online y no ejecuta HTML del usuario", () => {
    const { html, text } = buildContactEmail(data);
    expect(html).toContain("iplibre.online");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(text).toContain("iplibre.online");
  });
});
