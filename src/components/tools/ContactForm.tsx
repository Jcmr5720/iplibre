"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import { Input, Label, Textarea, Spinner } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type Status = "idle" | "sending" | "sent" | "configuring" | "error";

export function ContactForm() {
  const [status, setStatus] = React.useState<Status>("idle");
  const [message, setMessage] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      subject: String(data.get("subject") || ""),
      message: String(data.get("message") || ""),
      consent: data.get("consent") === "on",
      website: String(data.get("website") || ""), // honeypot
      // Página desde la que se envía (informativa para el correo).
      page: typeof window !== "undefined" ? window.location.pathname : "",
    };

    // Validación básica en cliente (la definitiva está en el servidor).
    const next: Record<string, string> = {};
    if (payload.name.trim().length < 2) next.name = "Introduce tu nombre.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) next.email = "Correo no válido.";
    if (payload.subject.trim().length < 3) next.subject = "Asunto demasiado corto.";
    if (payload.message.trim().length < 10) next.message = "El mensaje es demasiado corto.";
    if (!payload.consent) next.consent = "Debes aceptar la política de privacidad.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    const res = await apiPost<{ delivered: boolean; status: string; message?: string }>(
      "/api/contact",
      payload,
    );
    if (res.ok) {
      if (res.data.status === "sent") {
        setStatus("sent");
        setMessage("Mensaje enviado correctamente. Gracias por contactarnos.");
        form.reset();
      } else {
        setStatus("configuring");
        setMessage(
          res.data.message ||
            "Hemos recibido tu mensaje, pero el canal de correo está en configuración. Vuelve a intentarlo más adelante.",
        );
        form.reset();
      }
    } else {
      setStatus("error");
      setMessage(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {(status === "sent" || status === "configuring") && (
        <Alert tone={status === "sent" ? "success" : "info"} role="status">
          {message}
        </Alert>
      )}
      {status === "error" && (
        <Alert tone="danger" role="alert">
          {message}
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Nombre" error={errors.name}>
          <Input id="name" name="name" autoComplete="name" required aria-invalid={!!errors.name} />
        </Field>
        <Field id="email" label="Correo electrónico" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} />
        </Field>
      </div>

      <Field id="subject" label="Asunto" error={errors.subject}>
        <Input id="subject" name="subject" required aria-invalid={!!errors.subject} />
      </Field>

      <Field id="message" label="Mensaje" error={errors.message}>
        <Textarea id="message" name="message" rows={6} required aria-invalid={!!errors.message} />
      </Field>

      {/* Honeypot antispam: oculto para humanos, atractivo para bots. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">No rellenar</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="consent"
            className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--primary)]"
            aria-invalid={!!errors.consent}
          />
          <span>
            He leído y acepto la{" "}
            <a href="/privacidad" className="text-primary hover:underline">
              política de privacidad
            </a>
            .
          </span>
        </label>
        {errors.consent && <p className="mt-1 text-sm text-danger">{errors.consent}</p>}
      </div>

      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? <Spinner /> : <Send className="h-4 w-4" />}
        Enviar mensaje
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
