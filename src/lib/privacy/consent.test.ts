import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  cleanupWithdrawnCategories,
  createConsent,
  defaultConsentCategories,
  hasConsent,
  parseConsent,
  readConsent,
  writeConsent,
} from "@/lib/privacy/consent";
import {
  PRIVACY_CONSENT_KEY,
  PRIVACY_CONSENT_VERSION,
  SPEED_HISTORY_KEY,
  THEME_STORAGE_KEY,
  storageRegistry,
} from "@/lib/privacy/storage-registry";

describe("privacy consent", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("rejects missing, expired and old-version consent payloads", () => {
    expect(parseConsent(null)).toBeNull();
    expect(
      parseConsent(
        JSON.stringify({
          version: PRIVACY_CONSENT_VERSION - 1,
          categories: { ...defaultConsentCategories },
          expiresAt: "2099-01-01T00:00:00.000Z",
        }),
      ),
    ).toBeNull();
    expect(
      parseConsent(
        JSON.stringify({
          version: PRIVACY_CONSENT_VERSION,
          categories: { ...defaultConsentCategories },
          expiresAt: "2000-01-01T00:00:00.000Z",
        }),
      ),
    ).toBeNull();
  });

  it("stores the current version and keeps necessary consent enabled", () => {
    const consent = createConsent({ necessary: false, analytics: true });
    writeConsent(consent);

    expect(readConsent()?.version).toBe(PRIVACY_CONSENT_VERSION);
    expect(readConsent()?.categories.necessary).toBe(true);
    expect(hasConsent("analytics")).toBe(true);
    expect(hasConsent("marketing")).toBe(false);
  });

  it("removes known preference keys when preferences are withdrawn", () => {
    localStorage.setItem(PRIVACY_CONSENT_KEY, "keep");
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    localStorage.setItem(SPEED_HISTORY_KEY, "[]");

    cleanupWithdrawnCategories(
      { necessary: true, preferences: true, analytics: false, marketing: false },
      { necessary: true, preferences: false, analytics: false, marketing: false },
    );

    expect(localStorage.getItem(PRIVACY_CONSENT_KEY)).toBe("keep");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(SPEED_HISTORY_KEY)).toBeNull();
  });

  it("does not mark optional technologies as allowed before consent", () => {
    const optionalBeforeConsent = storageRegistry.filter(
      (entry) => entry.category !== "necessary" && entry.beforeConsent,
    );
    expect(optionalBeforeConsent).toEqual([]);
  });
});
