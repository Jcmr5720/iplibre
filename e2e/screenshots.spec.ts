import { test, type Page } from "@playwright/test";
import { mockApis } from "./fixtures";

/**
 * Genera capturas de QA en 375 y 1440, en claro y oscuro, para revisión visual.
 * Se guardan en e2e/__screenshots__/. No hacen aserciones: son artefactos.
 */

const DIR = "e2e/__screenshots__";
const CONSENT_KEY = "iplibre_privacy_consent";

const PAGES: { name: string; route: string; trigger?: (p: Page) => Promise<void> }[] = [
  { name: "home", route: "/" },
  { name: "herramientas", route: "/herramientas" },
  { name: "mi-ip", route: "/mi-ip" },
  { name: "test-velocidad", route: "/test-de-velocidad" },
  { name: "password", route: "/generador-contrasenas" },
  {
    name: "webrtc",
    route: "/webrtc-leak-test",
    trigger: async (p) => {
      await p.getByRole("button", { name: /Iniciar prueba WebRTC/ }).click();
      await p.waitForTimeout(3000);
    },
  },
  { name: "blacklist", route: "/blacklist-checker", trigger: fillFirst("8.8.8.8") },
  {
    name: "email",
    route: "/email-security-checker",
    trigger: async (p) => {
      await p.getByPlaceholder("ejemplo.com").fill("ejemplo.com");
      await p.getByRole("button", { name: "Comprobar" }).click();
      await p.waitForTimeout(500);
    },
  },
  { name: "dnssec", route: "/dnssec-checker", trigger: fillFirst("ejemplo.com") },
  { name: "redirect", route: "/redirect-checker", trigger: fillFirst("http://ejemplo.com") },
  { name: "ssl", route: "/ssl-checker", trigger: fillFirst("ejemplo.com") },
  { name: "donar", route: "/donar" },
];

function fillFirst(value: string) {
  return async (p: Page) => {
    const input = p.getByRole("textbox").first();
    await input.fill(value);
    await input.press("Enter");
    await p.waitForTimeout(500);
  };
}

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate(({ consentKey, theme }) => {
    localStorage.setItem(
      consentKey,
      JSON.stringify({
        version: 1,
        categories: { necessary: true, preferences: true, analytics: false, marketing: false },
        decidedAt: new Date().toISOString(),
        expiresAt: "2099-01-01T00:00:00.000Z",
      }),
    );
    localStorage.setItem("theme", theme);
  }, { consentKey: CONSENT_KEY, theme });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction((expected) => document.documentElement.classList.contains(expected), theme);
}

for (const size of [375, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test.describe(`Capturas ${size} ${theme}`, () => {
      test.use({ viewport: { width: size, height: size === 375 ? 780 : 900 } });

      for (const p of PAGES) {
        test(`${p.name}`, async ({ page }) => {
          await mockApis(page);
          await page.goto(p.route, { waitUntil: "domcontentloaded" });
          await setTheme(page, theme);
          if (p.trigger) await p.trigger(page);
          await page.waitForTimeout(300);
          await page.screenshot({ path: `${DIR}/${p.name}-${size}-${theme}.png`, fullPage: true });
        });
      }

      test("megamenu", async ({ page }) => {
        await mockApis(page);
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await setTheme(page, theme);
        if (size >= 1024) {
          await page.getByRole("button", { name: "Todas las herramientas" }).click();
          await page.waitForTimeout(200);
        } else {
          await page.getByRole("button", { name: "Abrir menú" }).click();
          await page.waitForTimeout(200);
        }
        await page.screenshot({ path: `${DIR}/menu-${size}-${theme}.png`, fullPage: true });
      });
    });
  }
}
