import { test, expect } from "@playwright/test";

const consentKey = "iplibre_privacy_consent";
const speedHistoryKey = "iplibre:speed-history:v1";

async function clearSite(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

async function storageSnapshot(page: import("@playwright/test").Page) {
  return page.evaluate(async () => ({
    cookies: document.cookie,
    localStorageKeys: Object.keys(localStorage).sort(),
    sessionStorageKeys: Object.keys(sessionStorage).sort(),
    indexedDb: "databases" in indexedDB ? await indexedDB.databases().then((dbs) => dbs.map((db) => db.name).sort()) : [],
    caches: "caches" in window ? await caches.keys() : [],
    adsenseScript: Boolean(document.querySelector('script[src*="pagead2.googlesyndication.com"]')),
    vercelScript: Boolean(
      [...document.scripts].some((script) => script.src.includes("_vercel") || script.src.includes("vercel")),
    ),
  }));
}

test.describe("Privacidad y cookies", () => {
  test("no carga scripts opcionales ni almacenamiento opcional antes de decidir", async ({ page }) => {
    await clearSite(page);
    await expect(page.getByRole("heading", { name: "Privacidad y cookies" })).toBeVisible();

    const snapshot = await storageSnapshot(page);
    expect(snapshot.cookies).toBe("");
    expect(snapshot.localStorageKeys).toEqual([]);
    expect(snapshot.sessionStorageKeys).toEqual([]);
    expect(snapshot.indexedDb).toEqual([]);
    expect(snapshot.caches).toEqual([]);
    expect(snapshot.adsenseScript).toBe(false);
  });

  test("rechazar opcionales guarda solo consentimiento necesario", async ({ page }) => {
    await clearSite(page);
    await page.getByRole("button", { name: "Rechazar opcionales" }).click();

    const consent = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), consentKey);
    expect(consent.categories).toMatchObject({
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
    expect(await storageSnapshot(page)).toMatchObject({
      localStorageKeys: [consentKey],
      adsenseScript: false,
    });
  });

  test("permite configurar, persistir y retirar categorias", async ({ page }) => {
    await clearSite(page);
    await page.getByRole("button", { name: "Configurar" }).click();
    await page.getByRole("checkbox", { name: /^Preferencias/ }).check();
    await page.getByRole("checkbox", { name: /^Anal/ }).check();
    await page.getByRole("button", { name: "Guardar preferencias" }).click();

    await page.getByRole("radio", { name: "Oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.evaluate((key) => localStorage.setItem(key, "[]"), speedHistoryKey);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Privacidad y cookies" })).toHaveCount(0);
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.getByRole("button", { name: "Preferencias de privacidad" }).click();
    await page.getByRole("checkbox", { name: /^Preferencias/ }).uncheck();
    await page.getByRole("checkbox", { name: /^Anal/ }).uncheck();
    await page.getByRole("button", { name: "Guardar preferencias" }).click();

    const keys = await page.evaluate(() => Object.keys(localStorage).sort());
    expect(keys).toEqual([consentKey]);
    expect((await storageSnapshot(page)).adsenseScript).toBe(false);
  });

  test("solo carga AdSense tras aceptar marketing", async ({ page }) => {
    await clearSite(page);
    expect((await storageSnapshot(page)).adsenseScript).toBe(false);

    await page.getByRole("button", { name: "Aceptar" }).click();
    await expect(page.locator('script[src*="pagead2.googlesyndication.com"]')).toHaveCount(1);
  });

  test("el panel es usable en movil sin ocultar controles", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await clearSite(page);
    await page.getByRole("button", { name: "Configurar" }).click();
    await expect(page.getByRole("dialog", { name: "Preferencias de privacidad" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar preferencias" })).toBeVisible();
  });
});
