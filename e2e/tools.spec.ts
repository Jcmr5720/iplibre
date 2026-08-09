import { test, expect, type Page } from "@playwright/test";
import { mockApis, mockApiError, expectNoOverflow } from "./fixtures";

/**
 * Pruebas funcionales por herramienta con /api mockeado (deterministas).
 * Verifican: render del resultado, ausencia de overflow CON datos (320 y 1440)
 * y, en una muestra, el modo oscuro.
 */

interface ToolCase {
  route: string;
  value: string;
  expect: RegExp;
  custom?: (page: Page) => Promise<void>;
}

const TOOLS: ToolCase[] = [
  { route: "/geolocalizar-ip", value: "8.8.8.8", expect: /Estados Unidos|Cloudflare|Resultado/ },
  { route: "/whois", value: "ejemplo.com", expect: /Dominio|ejemplo\.com/ },
  { route: "/dns-lookup", value: "ejemplo.com", expect: /AAAA|TXT|registros/ },
  { route: "/propagacion-dns", value: "ejemplo.com", expect: /Cloudflare|Quad9|coincid|consistent/i },
  { route: "/asn-lookup", value: "AS15169", expect: /GOOGLE|Google|AS15169/ },
  { route: "/reverse-dns", value: "8.8.8.8", expect: /dns\.google|hostname|PTR/i },
  { route: "/dnssec-checker", value: "ejemplo.com", expect: /DNSSEC activo|DNSKEY|DS presente/ },
  { route: "/blacklist-checker", value: "8.8.8.8", expect: /Sin coincidencias|listas consultadas/ },
  { route: "/estado-web", value: "ejemplo.com", expect: /Funcionando/ },
  { route: "/ssl-checker", value: "ejemplo.com", expect: /Días restantes|Seguro/ },
  { route: "/headers-seguridad", value: "ejemplo.com", expect: /Puntuación|Buena/ },
  { route: "/redirect-checker", value: "http://ejemplo.com", expect: /redirección|Destino final|301/ },
  {
    route: "/email-security-checker",
    value: "ejemplo.com",
    expect: /Seguridad de correo|SPF|DMARC/,
    custom: async (page) => {
      await page.getByPlaceholder("ejemplo.com").fill("ejemplo.com");
      await page.getByRole("button", { name: "Comprobar" }).click();
    },
  },
];

async function allowPreferences(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem(
      "iplibre_privacy_consent",
      JSON.stringify({
        version: 1,
        categories: { necessary: true, preferences: true, analytics: false, marketing: false },
        decidedAt: new Date().toISOString(),
        expiresAt: "2099-01-01T00:00:00.000Z",
      }),
    );
  });
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function trigger(page: Page, tc: ToolCase) {
  if (tc.custom) {
    await tc.custom(page);
    return;
  }
  const input = page.getByRole("textbox").first();
  await input.fill(tc.value);
  await input.press("Enter");
}

for (const tc of TOOLS) {
  test.describe(`Herramienta ${tc.route}`, () => {
    test.beforeEach(async ({ page }) => {
      await mockApis(page);
    });

    test("renderiza el resultado y no hay overflow (1440 y 320) con datos", async ({ page }) => {
      await page.goto(tc.route);
      await trigger(page, tc);
      await expect(page.getByText(tc.expect).first()).toBeVisible({ timeout: 15_000 });

      // Overflow con datos a 1440 (viewport por defecto).
      let m = await expectNoOverflow(page);
      expect(m.scrollW, `overflow @${m.innerW}px en ${tc.route}`).toBeLessThanOrEqual(m.innerW);

      // Y a 320px (expande detalles técnicos para forzar el contenido largo).
      await page.setViewportSize({ width: 320, height: 640 });
      await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
      m = await expectNoOverflow(page);
      expect(m.scrollW, `overflow @${m.innerW}px en ${tc.route}`).toBeLessThanOrEqual(m.innerW);
    });
  });
}

test.describe("Estado de error", () => {
  test("una API caída muestra un aviso, no un 500 crudo", async ({ page }) => {
    await mockApiError(page, 502);
    await page.goto("/dns-lookup");
    const input = page.getByRole("textbox").first();
    await input.fill("ejemplo.com");
    await input.press("Enter");
    // Se excluye el route-announcer vacío de Next (también role=alert).
    await expect(page.getByRole("alert").filter({ hasText: /\S/ }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

});

test.describe("Modo oscuro con resultados", () => {
  for (const route of ["/ssl-checker", "/dnssec-checker", "/blacklist-checker"]) {
    test(`${route} legible en oscuro`, async ({ page }) => {
      await mockApis(page);
      await page.goto(route);
      await allowPreferences(page);
      await page.getByRole("radio", { name: "Oscuro" }).click();
      await expect(page.locator("html")).toHaveClass(/dark/);
      const input = page.getByRole("textbox").first();
      await input.fill(route.includes("blacklist") ? "8.8.8.8" : "ejemplo.com");
      await input.press("Enter");
      // Fondo oscuro real (no un fondo claro sin adaptar).
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const rgb = bg.match(/\d+/g)!.map(Number);
      expect(rgb[0] + rgb[1] + rgb[2]).toBeLessThan(180); // suma baja = oscuro
    });
  }
});
