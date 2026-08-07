import { test, expect } from "@playwright/test";

test.describe("Navegación e inicio", () => {
  test("la portada carga y muestra el eslogan", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Descubre tu IP y mide la velocidad",
    );
    await expect(page.getByRole("link", { name: "Iniciar test de velocidad" })).toBeVisible();
  });

  test("el mega-menú de escritorio abre y lleva a todas las herramientas", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Herramientas" }).click();
    const mega = page.locator("#mega-menu");
    await expect(mega).toBeVisible();
    await mega.getByRole("link", { name: "Todas las herramientas" }).click();
    await expect(page).toHaveURL(/\/herramientas/);
    await expect(page.getByRole("heading", { name: "Todas las herramientas" })).toBeVisible();
  });

  test("el mega-menú se cierra con Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Herramientas" }).click();
    await expect(page.locator("#mega-menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mega-menu")).toBeHidden();
  });

  test("el mega-menú enlaza a PDFLibre (otra aplicación)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Herramientas" }).click();
    const link = page.locator("#mega-menu").getByRole("link", { name: /PDFLibre/ });
    await expect(link).toHaveAttribute("href", "https://pdflibre.app");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  });
});

test.describe("Navegación móvil (drawer)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("abre el drawer, muestra secciones y cierra con Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const drawer = page.locator("#mobile-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Otras aplicaciones")).toBeVisible();
    await expect(drawer.getByRole("link", { name: /PDFLibre/ })).toHaveAttribute(
      "href",
      "https://pdflibre.app",
    );
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });

  test("navega a una herramienta desde el drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.locator("#mobile-drawer").getByRole("link", { name: "Test de velocidad" }).click();
    await expect(page).toHaveURL(/\/test-de-velocidad/);
  });
});

test.describe("Regresión del drawer móvil (bug de contexto de apilamiento)", () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test("el drawer cubre toda la altura del viewport, no queda recortado tras el header", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const drawer = page.locator("#mobile-drawer");
    await expect(drawer).toBeVisible();
    const box = await drawer.boundingBox();
    expect(box).not.toBeNull();
    // Antes del fix quedaba confinado a ~64px (altura del header).
    expect(box!.height).toBeGreaterThan(500);
    expect(box!.y).toBeLessThanOrEqual(1);
  });

  test("se renderiza en un portal a <body>, fuera del header", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.locator("#mobile-drawer")).toBeVisible();
    const insideHeader = await page.locator("header #mobile-drawer").count();
    expect(insideHeader).toBe(0);
    const onBody = await page.evaluate(() => {
      const dialog = document.getElementById("mobile-drawer")?.closest('[role="dialog"]');
      return dialog?.parentElement === document.body;
    });
    expect(onBody).toBe(true);
  });

  test("cerrar el drawer restaura el scroll del body", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.locator("#mobile-drawer")).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await page.getByRole("button", { name: "Cerrar menú" }).click();
    await expect(page.locator("#mobile-drawer")).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("navegar desde el drawer lo cierra y restaura el scroll", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.locator("#mobile-drawer").getByRole("link", { name: "Mi IP", exact: true }).click();
    await expect(page).toHaveURL(/\/mi-ip/);
    await expect(page.locator("#mobile-drawer")).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  for (const path of ["/", "/mi-ip", "/whois", "/dns-lookup", "/asn-lookup"]) {
    test(`sin scroll horizontal en ${path} a 320px`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow).toBe(false);
    });
  }
});

test.describe("Nuevas páginas SEO", () => {
  for (const [path, heading] of [
    ["/cual-es-mi-ip", "¿Cuál es mi IP?"],
    ["/medir-velocidad-internet", "Medir la velocidad de tu Internet"],
    ["/test-de-velocidad-wifi", "Test de velocidad Wi-Fi"],
    ["/comprobar-dns", "Comprobar DNS de un dominio"],
    ["/que-es-mi-ip", "¿Qué es mi IP?"],
    ["/que-es-dns", "¿Qué es DNS?"],
    ["/que-es-el-ping", "¿Qué es el ping?"],
    ["/que-es-el-jitter", "¿Qué es el jitter?"],
    ["/ipv4-vs-ipv6", "IPv4 vs IPv6"],
  ] as const) {
    test(`${path} carga con su H1 único`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    });
  }

  test("las variantes duplicadas redirigen a su página canónica", async ({ page }) => {
    await page.goto("/mi-ip-publica");
    await expect(page).toHaveURL(/\/cual-es-mi-ip/);
    await page.goto("/test-de-internet");
    await expect(page).toHaveURL(/\/medir-velocidad-internet/);
  });
});

test.describe("SEO / verificaciones", () => {
  test("el HTML incluye las metas de AdSense y Search Console", async ({ page }) => {
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

  test("ads.txt responde 200 con el publisher correcto", async ({ page }) => {
    const res = await page.goto("/ads.txt");
    expect(res?.status()).toBe(200);
    expect(await page.locator("body").innerText()).toContain("pub-1569989907195059");
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
