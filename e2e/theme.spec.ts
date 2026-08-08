import { test, expect } from "@playwright/test";

/**
 * Tema: el modo oscuro se conserva al recargar y al navegar (next-themes en
 * localStorage), y el modo claro se restaura correctamente.
 */
test.describe("Tema claro / oscuro", () => {
  test("el modo oscuro persiste al recargar y navegar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "Oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.goto("/ssl-checker");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("vuelve a claro sin romper el layout", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "Oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("radio", { name: "Claro" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const rgb = bg.match(/\d+/g)!.map(Number);
    expect(rgb[0] + rgb[1] + rgb[2]).toBeGreaterThan(400); // fondo claro
  });
});
