import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { syntheticFixtures } from "../src/lib/file-analysis/synthetic-fixtures";
import { expectNoOverflow } from "./fixtures";

const payload = {
  name: "factura-confidencial-sintetica.pdf.exe",
  mimeType: "application/octet-stream",
  buffer: Buffer.from(syntheticFixtures.minimalPe),
};

async function analyze(page: import("@playwright/test").Page, file = payload) {
  await page.getByLabel("Seleccionar archivo para analizar").setInputFiles(file);
  await page.getByRole("button", { name: "Analizar archivo" }).click();
  await expect(page.getByTestId("analysis-result")).toBeVisible({ timeout: 20_000 });
}

test.describe("Analizar virus", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("iplibre_privacy_consent", JSON.stringify({ version: 1, categories: { necessary: true, preferences: true, analytics: false, marketing: false }, decidedAt: new Date().toISOString(), expiresAt: "2099-01-01T00:00:00.000Z" })));
  });

  test("selecciona, analiza localmente y explica el resultado", async ({ page }) => {
    await page.goto("/analizar-virus");
    await analyze(page);
    await expect(page.getByText("Ejecutable Windows (PE)").first()).toBeVisible();
    await expect(page.getByText("Nombre con doble extension")).toBeVisible();
    await expect(page.getByText(/SHA-256/).first()).toBeVisible();
    await expect(page.locator("code")).toHaveText(/^[a-f0-9]{64}$/);
  });

  test("no envia nombre, contenido ni hash por la red", async ({ page }) => {
    const requests: { url: string; body: string }[] = [];
    page.on("request", (request) => requests.push({ url: request.url(), body: request.postData() ?? "" }));
    await page.goto("/analizar-virus");
    const marker = "IPLIBRE_PRIVATE_FIXTURE_9f72c4";
    const privateFile = { name: "nombre-privado-9f72c4.txt", mimeType: "text/plain", buffer: Buffer.from(marker) };
    await analyze(page, privateFile);
    const hash = createHash("sha256").update(marker).digest("hex");
    const transcript = requests.map((request) => `${request.url}\n${request.body}`).join("\n");
    expect(transcript).not.toContain(marker);
    expect(transcript).not.toContain(privateFile.name);
    expect(transcript).not.toContain(hash);
    expect(requests.filter((request) => request.body.length > 0)).toHaveLength(0);
  });

  test("permite cancelar sin bloquear la interfaz", async ({ page }) => {
    await page.goto("/analizar-virus");
    await page.getByLabel("Seleccionar archivo para analizar").setInputFiles({ name: "grande-sintetico.bin", mimeType: "application/octet-stream", buffer: Buffer.alloc(32 * 1024 * 1024, 65) });
    await page.getByRole("button", { name: "Analizar archivo" }).click();
    const cancel = page.getByRole("button", { name: "Cancelar" });
    await expect(cancel).toBeVisible();
    await cancel.click();
    await expect(page.getByText("Analisis cancelado", { exact: true })).toBeVisible();
  });

  for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 812 }, { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    test(`sin overflow con resultado a ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/analizar-virus");
      const longName = `${"archivo-muy-largo-".repeat(12)}.pdf.exe`;
      await analyze(page, { ...payload, name: longName });
      await page.locator("details").first().evaluate((element: HTMLDetailsElement) => { element.open = true; });
      const dimensions = await expectNoOverflow(page);
      expect(dimensions.scrollW).toBeLessThanOrEqual(dimensions.innerW + 1);
    });
  }

  for (const scheme of ["light", "dark"] as const) {
    test(`resultado legible en tema ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.addInitScript((theme) => localStorage.setItem("theme", theme), scheme);
      await page.goto("/analizar-virus");
      await analyze(page);
      await expect(page.locator("html")).toHaveClass(new RegExp(scheme));
      await expect(page.getByText("Resultado general")).toBeVisible();
    });
  }
});
