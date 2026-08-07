/**
 * Esquemas Zod para validar la entrada de los route handlers.
 * Límites de longitud estrictos y sanitización antes de tocar red externa.
 */
import { z } from "zod";
import { DNS_TYPES } from "@/lib/providers/dns";

export const ipQuerySchema = z.object({
  ip: z.string().trim().min(2).max(45),
});

export const domainQuerySchema = z.object({
  domain: z.string().trim().min(1).max(253),
});

export const dnsQuerySchema = z.object({
  domain: z.string().trim().min(1).max(253),
  type: z.enum(DNS_TYPES),
});

export const propagationQuerySchema = z.object({
  domain: z.string().trim().min(1).max(253),
  type: z.enum(DNS_TYPES).default("A"),
});

export const rdapQuerySchema = z.object({
  query: z.string().trim().min(1).max(253),
});

export const asnQuerySchema = z.object({
  query: z.string().trim().min(1).max(45),
});

export const urlQuerySchema = z.object({
  url: z.string().trim().min(1).max(2048),
});

export const hostQuerySchema = z.object({
  host: z.string().trim().min(1).max(253),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Introduce tu nombre").max(120),
  email: z.string().trim().email("Correo no válido").max(254),
  subject: z.string().trim().min(3, "Asunto demasiado corto").max(160),
  message: z.string().trim().min(10, "El mensaje es demasiado corto").max(4000),
  consent: z.literal(true, { message: "Debes aceptar la política de privacidad" }),
  // Honeypot: debe llegar vacío. Los bots suelen rellenarlo.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;
