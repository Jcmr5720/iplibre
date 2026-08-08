import { test, expect } from "@playwright/test";
import { mockApis, expectNoOverflow, VIEWPORTS, ALL_ROUTES } from "./fixtures";

/**
 * Matriz de overflow: TODAS las rutas en los 10 viewports. Con /api mockeado,
 * las herramientas que auto-consultan (Mi IP, IPv6) muestran datos; las de
 * formulario se validan en vacío aquí (el overflow CON datos cargados se cubre
 * en tools.spec.ts a 320 y 1440).
 */
for (const vp of VIEWPORTS) {
  test.describe(`Overflow @${vp.label}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("ninguna ruta principal desborda horizontalmente", async ({ page }) => {
      await mockApis(page);
      for (const route of ALL_ROUTES) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        // Deja asentar el layout tras el render de datos mockeados (evita medir
        // durante la transición skeleton→resultado).
        await page.waitForTimeout(600);
        const m = await expectNoOverflow(page);
        expect(m.scrollW, `${route} @${vp.label} (scrollW ${m.scrollW} > innerW ${m.innerW})`).toBeLessThanOrEqual(
          m.innerW + 1,
        );
      }
    });
  });
}
