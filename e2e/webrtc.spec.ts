import { test, expect } from "@playwright/test";
import { mockApis } from "./fixtures";

/**
 * WebRTC Leak Test: la prueba corre en el navegador real (chromium). No se
 * marca como fallo que el sandbox no exponga IPv6 o candidatos srflx: se acepta
 * cualquier estado válido y se comprueba que no hay crash.
 */
test.describe("WebRTC Leak Test", () => {
  test("ejecuta la prueba y muestra un estado válido sin romperse", async ({ page }) => {
    await mockApis(page); // /api/ip mockeado (IP del servidor para comparar)
    await page.goto("/webrtc-leak-test");
    await page.getByRole("button", { name: /Iniciar prueba WebRTC/ }).click();

    const validStates =
      /Sin fuga aparente|Posible exposición|WebRTC restringido|No se pudo determinar|WebRTC no disponible/;
    await expect(page.getByText(validStates).first()).toBeVisible({ timeout: 25_000 });

    // La página sigue viva (sin crash) y permite repetir.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /Repetir prueba|Iniciar prueba/ })).toBeVisible();
  });
});
