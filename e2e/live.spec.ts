import { test, expect } from "@playwright/test";

/**
 * Smoke con datos REALES (@live). Consulta servicios externos, por lo que se
 * ejecuta en serie y SOLO bajo demanda: `npx playwright test --project=live`.
 * Queda fuera de CI (grepInvert /@live/ en el proyecto por defecto).
 */
test.describe.configure({ mode: "serial" });

test.describe("Smoke real @live", () => {
  test("estado web: iplibre.online responde @live", async ({ page }) => {
    await page.goto("/estado-web");
    await page.getByRole("textbox").first().fill("iplibre.online");
    await page.getByRole("textbox").first().press("Enter");
    await expect(page.getByText(/Funcionando/).first()).toBeVisible({ timeout: 25_000 });
  });

  test("ssl: iplibre.online muestra días restantes @live", async ({ page }) => {
    await page.goto("/ssl-checker");
    await page.getByRole("textbox").first().fill("iplibre.online");
    await page.getByRole("textbox").first().press("Enter");
    await expect(page.getByText("Días restantes")).toBeVisible({ timeout: 25_000 });
  });

  test("dns: cloudflare.com resuelve registros @live", async ({ page }) => {
    await page.goto("/dns-lookup");
    await page.getByRole("textbox").first().fill("cloudflare.com");
    await page.getByRole("textbox").first().press("Enter");
    await expect(page.getByText(/registros|Resultado|AAAA|A\b/).first()).toBeVisible({
      timeout: 25_000,
    });
  });

  test("redirect: http://github.com sube a HTTPS @live", async ({ page }) => {
    await page.goto("/redirect-checker");
    await page.getByRole("textbox").first().fill("http://github.com");
    await page.getByRole("textbox").first().press("Enter");
    await expect(page.getByText(/Destino final|redirección/).first()).toBeVisible({
      timeout: 25_000,
    });
  });

  test("dnssec: cloudflare.com valida @live", async ({ page }) => {
    await page.goto("/dnssec-checker");
    await page.getByRole("textbox").first().fill("cloudflare.com");
    await page.getByRole("textbox").first().press("Enter");
    await expect(page.getByText(/DNSSEC/).first()).toBeVisible({ timeout: 25_000 });
  });
});
