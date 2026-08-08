import { test, expect } from "@playwright/test";
import { mockApis, mockApiError } from "./fixtures";

/**
 * Donaciones: se prueba el formulario y que se llega al checkout oficial de
 * Mercado Pago, SIN token real (la preferencia se mockea). No se completa
 * ninguna compra ni se expone MERCADOPAGO_ACCESS_TOKEN.
 */
test.describe("Donaciones", () => {
  test("carga con montos sugeridos y monto personalizado", async ({ page }) => {
    await mockApis(page);
    await page.goto("/donar");
    await expect(page.getByText("Montos sugeridos")).toBeVisible();
    await expect(page.locator("#donation-custom-amount")).toBeVisible();
  });

  test("valida el monto mínimo (botón deshabilitado)", async ({ page }) => {
    await mockApis(page);
    await page.goto("/donar");
    const submit = page.getByRole("button", { name: /Continuar al pago/ });
    await page.locator("#donation-custom-amount").fill("1000");
    await expect(submit).toBeDisabled();
    await page.locator("#donation-custom-amount").fill("5000");
    await expect(submit).toBeEnabled();
  });

  test("crea la preferencia y llega al checkout de Mercado Pago", async ({ page }) => {
    await mockApis(page);
    await page.goto("/donar");
    await page.locator("#donation-custom-amount").fill("20000");
    await page.getByRole("button", { name: /Continuar al pago/ }).click();
    // window.location.href = init_point → checkout (interceptado por el mock).
    await page.waitForURL(/mercadopago\.com\.co/, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText("MOCK CHECKOUT");
  });

  test("muestra un error si la API de preferencia falla", async ({ page }) => {
    await mockApiError(page, 503);
    await page.goto("/donar");
    await page.locator("#donation-custom-amount").fill("20000");
    await page.getByRole("button", { name: /Continuar al pago/ }).click();
    await expect(page.locator(".text-danger, [class*='danger']").first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
