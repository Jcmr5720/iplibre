import { test, expect } from "@playwright/test";

test.describe("Navegación e inicio", () => {
  test("la portada carga y muestra el eslogan", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Descubre tu IP y mide la velocidad",
    );
    await expect(page.getByRole("link", { name: "Iniciar test de velocidad" })).toBeVisible();
  });

  test("navega desde la portada a las herramientas", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Herramientas", exact: true }).first().click();
    await expect(page).toHaveURL(/\/herramientas/);
    await expect(page.getByRole("heading", { name: "Todas las herramientas" })).toBeVisible();
  });
});

test.describe("Herramienta: Geolocalizar IP", () => {
  test("consulta una IP y muestra resultados reales", async ({ page }) => {
    await page.goto("/geolocalizar-ip");
    await expect(page.getByRole("heading", { name: "Geolocalizar una IP" })).toBeVisible();
    await page.getByRole("button", { name: "8.8.8.8" }).click();
    await expect(page.getByText("Resultado para")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Google", { exact: false }).first()).toBeVisible();
  });

  test("muestra error de validación con IP inválida", async ({ page }) => {
    await page.goto("/geolocalizar-ip");
    await page.getByPlaceholder("8.8.8.8", { exact: false }).fill("999.999.999.999");
    await page.getByRole("button", { name: "Geolocalizar" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Herramienta: DNS Lookup", () => {
  test("resuelve registros A de un dominio", async ({ page }) => {
    await page.goto("/dns-lookup");
    await page.getByPlaceholder("ejemplo.com").fill("cloudflare.com");
    await page.getByRole("button", { name: "Consultar" }).click();
    await expect(page.getByText(/Resultado para|Todos los registros/)).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("Modo oscuro", () => {
  test("alterna a tema oscuro", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "Oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("Errores", () => {
  test("muestra la página 404 en rutas inexistentes", async ({ page }) => {
    const res = await page.goto("/ruta-que-no-existe");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Página no encontrada")).toBeVisible();
  });
});

test.describe("Accesibilidad básica", () => {
  test("existe enlace de salto al contenido y un h1 único", async ({ page }) => {
    await page.goto("/mi-ip");
    await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeAttached();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });
});
