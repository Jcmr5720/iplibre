import { describe, it, expect } from "vitest";
import { traceRedirects } from "@/lib/providers/redirect";

/**
 * Estas comprobaciones no tocan la red: los literales IP privados/reservados se
 * rechazan en assertPublicHost antes de cualquier fetch, y los esquemas no
 * permitidos se rechazan en la normalización de URL.
 */
describe("traceRedirects · protección SSRF", () => {
  it("bloquea loopback (127.0.0.1)", async () => {
    const r = await traceRedirects("http://127.0.0.1/");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe("ssrf");
  });

  it("bloquea redes privadas (10.0.0.1)", async () => {
    const r = await traceRedirects("http://10.0.0.1/");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe("ssrf");
  });

  it("bloquea el endpoint de metadatos link-local (169.254.169.254)", async () => {
    const r = await traceRedirects("http://169.254.169.254/latest/meta-data/");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe("ssrf");
  });

  it("bloquea IPv6 loopback [::1]", async () => {
    const r = await traceRedirects("http://[::1]/");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe("ssrf");
  });

  it("rechaza esquemas no permitidos (file:)", async () => {
    const r = await traceRedirects("file:///etc/passwd");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe("input");
  });

  it("rechaza gopher:", async () => {
    const r = await traceRedirects("gopher://127.0.0.1:70/");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe("input");
  });
});
