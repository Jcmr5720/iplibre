import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PRIVACY_CONSENT_KEY,
  SPEED_HISTORY_KEY,
  THEME_STORAGE_KEY,
  storageRegistry,
} from "@/lib/privacy/storage-registry";

describe("privacy storage registry", () => {
  it("documents all known browser storage keys", () => {
    const keys = new Set(storageRegistry.flatMap((entry) => entry.keys ?? []));

    expect(keys.has(PRIVACY_CONSENT_KEY)).toBe(true);
    expect(keys.has(THEME_STORAGE_KEY)).toBe(true);
    expect(keys.has(SPEED_HISTORY_KEY)).toBe(true);
  });

  it("keeps optional global scripts out of the root layout", () => {
    const layout = fs.readFileSync(path.join(process.cwd(), "src", "app", "layout.tsx"), "utf8");

    expect(layout).not.toContain("@vercel/analytics");
    expect(layout).not.toContain("@vercel/speed-insights");
    expect(layout).not.toContain("pagead2.googlesyndication.com");
  });

  it("keeps the cookies page generated from the shared registry", () => {
    const cookiesPage = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "cookies", "page.tsx"),
      "utf8",
    );

    expect(cookiesPage).toContain("storageRegistry.map");
    expect(cookiesPage).toContain("PrivacyPreferencesButton");
  });
});
