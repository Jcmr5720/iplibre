import { test, expect } from "@playwright/test";

/**
 * SEO / verificaciones: no romper AdSense, Search Console, ads.txt, canonical,
 * ni la página 404.
 */
test.describe("SEO y verificaciones", () => {
  test("metas de AdSense y Search Console presentes", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute(
      "content",
      "ca-pub-1569989907195059",
    );
    await expect(page.locator('meta[name="google-site-verification"]')).toHaveAttribute(
      "content",
      "6oiOkE6VjEMaCmA9xY_axcB5dWIl35YioO7gomecuqI",
    );
  });

  test("ads.txt responde con el publisher correcto", async ({ page }) => {
    const res = await page.goto("/ads.txt");
    expect(res?.status()).toBe(200);
    expect(await page.locator("body").innerText()).toContain("pub-1569989907195059");
  });

  test("las herramientas nuevas tienen canonical propio", async ({ page }) => {
    for (const [route, canonical] of [
      ["/generador-contrasenas", "/generador-contrasenas"],
      ["/webrtc-leak-test", "/webrtc-leak-test"],
      ["/dnssec-checker", "/dnssec-checker"],
      ["/analizar-virus", "/analizar-virus"],
    ] as const) {
      await page.goto(route);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${canonical}$`),
      );
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    }
  });

  test("rutas inexistentes devuelven 404", async ({ page }) => {
    const res = await page.goto("/ruta-que-no-existe-xyz");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Página no encontrada")).toBeVisible();
  });
});
