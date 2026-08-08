import { test, expect } from "@playwright/test";
import { tools } from "../src/lib/config";

/**
 * Navegación: header de escritorio, mega-menú "Todas las herramientas" con
 * buscador, menú "Más", y drawer móvil. No depende de red.
 */

test.describe("Header de escritorio", () => {
  test("muestra enlaces primarios, Donar y abre el mega-menú", async ({ page }) => {
    await page.goto("/");
    const primary = page.getByRole("navigation", { name: "Principal" });
    await expect(primary.getByRole("link", { name: "Mi IP", exact: true })).toBeVisible();
    await expect(primary.getByRole("link", { name: "Test de velocidad", exact: true })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Donar a IPLibre" })).toBeVisible();

    await page.getByRole("button", { name: "Todas las herramientas" }).click();
    const mega = page.locator("#menu-todas");
    await expect(mega).toBeVisible();
    await expect(mega.getByPlaceholder("Buscar una herramienta…")).toBeVisible();
    // Todas las herramientas internas del catálogo (fuente: config.ts).
    await expect(mega.locator('a[href^="/"]')).toHaveCount(tools.length);
  });

  test("el mega-menú se cierra con Escape y con clic fuera", async ({ page }) => {
    await page.goto("/");
    const open = () => page.getByRole("button", { name: "Todas las herramientas" }).click();
    await open();
    await expect(page.locator("#menu-todas")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#menu-todas")).toBeHidden();

    await open();
    await expect(page.locator("#menu-todas")).toBeVisible();
    // Clic fuera del panel: cerca del pie del viewport, por debajo del panel.
    await page.mouse.click(720, 880);
    await expect(page.locator("#menu-todas")).toBeHidden();
  });

  test("el menú 'Más' enlaza recursos, IPLibre y PDFLibre externo", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Más:/ }).click();
    const menu = page.locator("#menu-mas");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "¿Qué es DNS?" })).toBeVisible();
    const pdf = menu.getByRole("link", { name: /PDFLibre/ });
    await expect(pdf).toHaveAttribute("href", "https://pdflibre.app");
    await expect(pdf).toHaveAttribute("target", "_blank");
    await expect(pdf).toHaveAttribute("rel", /noopener/);
  });
});

test.describe("Buscador del mega-menú", () => {
  const cases: [string, string[], string[]][] = [
    ["dns", ["/dns-lookup", "/propagacion-dns", "/reverse-dns", "/dnssec-checker"], ["/mi-ip"]],
    ["ssl", ["/ssl-checker"], ["/dns-lookup"]],
    ["vpn", ["/webrtc-leak-test"], ["/ssl-checker"]],
    ["contraseña", ["/generador-contrasenas"], ["/whois"]],
    ["correo", ["/email-security-checker"], ["/mi-ip"]],
    ["redirección", ["/redirect-checker"], ["/mi-ip"]],
  ];

  for (const [query, present, absent] of cases) {
    test(`«${query}» devuelve resultados correctos`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Todas las herramientas" }).click();
      const mega = page.locator("#menu-todas");
      await mega.getByPlaceholder("Buscar una herramienta…").fill(query);
      for (const href of present) {
        await expect(mega.locator(`a[href="${href}"]`)).toBeVisible();
      }
      for (const href of absent) {
        await expect(mega.locator(`a[href="${href}"]`)).toHaveCount(0);
      }
    });
  }
});

test.describe("Drawer móvil", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("abre, muestra secciones, navega y cierra restaurando el scroll", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const drawer = page.locator("#mobile-drawer");
    await expect(drawer).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await expect(drawer.getByText("Otras aplicaciones")).toBeVisible();

    // Acordeón: "Seguridad y utilidades" expande y muestra el generador.
    await drawer.getByRole("button", { name: "Seguridad y utilidades" }).click();
    await expect(drawer.getByRole("link", { name: "Generador de contraseñas" })).toBeVisible();

    await drawer.getByRole("link", { name: "Generador de contraseñas" }).click();
    await expect(page).toHaveURL(/\/generador-contrasenas/);
    await expect(page.locator("#mobile-drawer")).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("cierra con Escape y con la X", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.locator("#mobile-drawer")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-drawer")).toBeHidden();

    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.locator("#mobile-drawer")).toBeVisible();
    await page.getByRole("button", { name: "Cerrar menú" }).click();
    await expect(page.locator("#mobile-drawer")).toBeHidden();
  });

  test("el drawer cubre toda la altura y se monta en un portal a <body>", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const drawer = page.locator("#mobile-drawer");
    await expect(drawer).toBeVisible();
    const box = await drawer.boundingBox();
    expect(box!.height).toBeGreaterThan(500);
    expect(box!.y).toBeLessThanOrEqual(1);
    expect(await page.locator("header #mobile-drawer").count()).toBe(0);
  });

  test("permite llegar a Donar y a PDFLibre desde el drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const drawer = page.locator("#mobile-drawer");
    await expect(drawer.getByRole("link", { name: /PDFLibre/ })).toHaveAttribute(
      "href",
      "https://pdflibre.app",
    );
    await expect(drawer.getByRole("link", { name: /Donar/ }).first()).toBeVisible();
  });
});

test.describe("Cambio de orientación", () => {
  test("de portrait a landscape el drawer sigue funcionando", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.locator("#mobile-drawer")).toBeVisible();
    // Rota a landscape.
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator("#mobile-drawer")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });
});
