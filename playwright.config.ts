import { defineConfig, devices } from "@playwright/test";

const PORT = 3401;
const baseURL = `http://localhost:${PORT}`;

/**
 * Suite E2E. El proyecto por defecto ("chromium") es DETERMINISTA: los tests
 * mockean /api/** (ver e2e/fixtures.ts) y no dependen de red externa, por lo que
 * es apto para CI. Los tests marcados @live consultan servicios reales y quedan
 * excluidos por defecto (grepInvert); se ejecutan con `--grep @live` fuera de CI.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      grepInvert: /@live/,
    },
    {
      // Solo se ejecuta explícitamente con: npx playwright test --grep @live
      name: "live",
      use: { ...devices["Desktop Chrome"] },
      grep: /@live/,
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
