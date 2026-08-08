import { test, expect, type Locator } from "@playwright/test";

/**
 * Generador de contraseñas: E2E completo. Es 100% cliente; estas pruebas
 * también verifican que NO hace peticiones de red y que la contraseña no se
 * escribe en localStorage ni en la consola.
 */

const codeOf = (page: import("@playwright/test").Page): Locator =>
  page.locator('[aria-live="polite"] code').first();

/** Fija de forma fiable el valor de un input range controlado por React. */
async function setLength(page: import("@playwright/test").Page, len: number) {
  await page.locator("#pw-length").evaluate((el, v) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, String(v));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, len);
}

test.describe("Generador de contraseñas", () => {
  test("genera una contraseña al cargar", async ({ page }) => {
    await page.goto("/generador-contrasenas");
    const code = codeOf(page);
    await expect(code).not.toHaveText("—");
    const value = await code.innerText();
    expect(value.length).toBeGreaterThanOrEqual(8);
  });

  test("respeta la longitud exacta seleccionada", async ({ page }) => {
    await page.goto("/generador-contrasenas");
    const code = codeOf(page);
    for (const len of [8, 24, 64, 128]) {
      await setLength(page, len);
      await page.getByRole("button", { name: /Generar/ }).click();
      await expect.poll(async () => (await code.innerText()).length).toBe(len);
    }
  });

  test("aplica las categorías de caracteres", async ({ page }) => {
    await page.goto("/generador-contrasenas");
    for (const label of ["Mayúsculas", "Minúsculas", "Símbolos"]) {
      await page.getByRole("checkbox", { name: label }).uncheck();
    }
    await setLength(page, 40);
    await page.getByRole("button", { name: /Generar/ }).click();
    await expect.poll(async () => (await codeOf(page).innerText()).length).toBe(40);
    expect(await codeOf(page).innerText()).toMatch(/^[0-9]+$/);
  });

  test("excluye caracteres ambiguos cuando se marca", async ({ page }) => {
    await page.goto("/generador-contrasenas");
    await page.getByRole("checkbox", { name: /Excluir caracteres ambiguos/ }).check();
    await setLength(page, 128);
    const code = codeOf(page);
    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: /Generar/ }).click();
      await expect.poll(async () => (await code.innerText()).length).toBe(128);
      expect(await code.innerText()).not.toMatch(/[0OoIl1|`'"{}[\]()/\\]/);
    }
  });

  test("muestra error y no genera si no hay categorías", async ({ page }) => {
    await page.goto("/generador-contrasenas");
    for (const label of ["Mayúsculas", "Minúsculas", "Números", "Símbolos"]) {
      await page.getByRole("checkbox", { name: label }).uncheck();
    }
    await expect(page.getByText(/al menos un tipo de carácter/)).toBeVisible();
    // El botón queda deshabilitado (no puede generar sin categorías).
    await expect(page.getByRole("button", { name: /Generar/ })).toBeDisabled();
  });

  test("mostrar/ocultar enmascara la contraseña", async ({ page }) => {
    await page.goto("/generador-contrasenas");
    const code = codeOf(page);
    await expect(code).not.toHaveText("—");
    await page.getByRole("button", { name: "Ocultar contraseña" }).click();
    await expect(code).toHaveText(/^•+$/);
    await page.getByRole("button", { name: "Mostrar contraseña" }).click();
    await expect(code).not.toHaveText(/^•+$/);
  });

  test("copiar muestra confirmación (toast)", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/generador-contrasenas");
    await page.getByRole("button", { name: "Copiar contraseña" }).click();
    await expect(page.getByText(/copiada al portapapeles/)).toBeVisible();
  });

  test("puede generar varias contraseñas", async ({ page }) => {
    await page.goto("/generador-contrasenas");
    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: /Generar/ }).click();
    await expect(page.getByText(/5 contraseñas generadas/)).toBeVisible();
  });

  test("NUNCA hace peticiones a /api al generar", async ({ page }) => {
    const apiHits: string[] = [];
    await page.route("**/*", (route) => {
      if (route.request().url().includes("/api/")) apiHits.push(route.request().url());
      route.continue();
    });
    await page.goto("/generador-contrasenas");
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Generar/ }).click();
    expect(apiHits).toHaveLength(0);
  });

  test("no escribe la contraseña en localStorage ni en la consola", async ({ page }) => {
    const logs: string[] = [];
    page.on("console", (m) => logs.push(m.text()));
    await page.goto("/generador-contrasenas");
    await page.getByRole("button", { name: /Generar/ }).click();
    const code = codeOf(page);
    await expect(code).not.toHaveText("—");
    const value = await code.innerText();

    const inStorage = await page.evaluate((pw) => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if ((localStorage.getItem(k) ?? "").includes(pw)) return true;
      }
      return false;
    }, value);
    expect(inStorage).toBe(false);
    expect(logs.some((l) => l.includes(value))).toBe(false);
  });
});
