import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { sendContactEmail } from "@/lib/contact/send-contact-email";

vi.mock("@/lib/contact/send-contact-email", () => ({
  sendContactEmail: vi.fn(),
}));

function request(body: Record<string, unknown>, ip = "203.0.113.10") {
  return new NextRequest("https://iplibre.online/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

function validBody() {
  return {
    name: "Maria",
    email: "maria@example.com",
    subject: "Un problema",
    message: "El botón no responde correctamente.",
    consent: true,
    page: "/contacto",
    website: "",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(sendContactEmail).mockResolvedValue({ sent: true, id: "email-1" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/contact", () => {
  it("envía el correo con datos válidos y usa el email como replyTo", async () => {
    const res = await POST(request(validBody(), "203.0.113.1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.status).toBe("sent");
    expect(sendContactEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: "maria@example.com" }),
      expect.any(String),
    );
  });

  it("rechaza datos inválidos sin enviar correo", async () => {
    const res = await POST(
      request({ ...validBody(), email: "no-email" }, "203.0.113.2"),
    );
    expect(res.status).toBe(422);
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it("rechaza el honeypot sin enviar correo (200 silencioso)", async () => {
    const res = await POST(
      request({ ...validBody(), website: "https://spam.example" }, "203.0.113.3"),
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.delivered).toBe(false);
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it("degrada de forma honesta si falta configuración", async () => {
    vi.mocked(sendContactEmail).mockResolvedValue({
      sent: false,
      reason: "missing_config",
    });
    const res = await POST(request(validBody(), "203.0.113.4"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.status).toBe("configuring");
  });

  it("devuelve 502 si el proveedor falla", async () => {
    vi.mocked(sendContactEmail).mockResolvedValue({
      sent: false,
      reason: "provider_error",
    });
    const res = await POST(request(validBody(), "203.0.113.5"));
    const data = await res.json();
    expect(res.status).toBe(502);
    expect(data.error).toContain("No pudimos enviar");
  });

  it("aplica rate limit tras varios envíos seguidos", async () => {
    const ip = "203.0.113.99";
    let last = 200;
    for (let i = 0; i < 8; i++) {
      const res = await POST(request(validBody(), ip));
      last = res.status;
    }
    expect(last).toBe(429);
  });
});
