import {
  PRIVACY_CONSENT_DURATION_DAYS,
  PRIVACY_CONSENT_KEY,
  PRIVACY_CONSENT_VERSION,
  keysForCategory,
  type PrivacyCategory,
} from "@/lib/privacy/storage-registry";

export type ConsentCategories = Record<PrivacyCategory, boolean>;

export type PrivacyConsent = {
  version: number;
  categories: ConsentCategories;
  decidedAt: string;
  expiresAt: string;
};

export const defaultConsentCategories: ConsentCategories = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
};

export function consentExpiry(from = new Date()): string {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + PRIVACY_CONSENT_DURATION_DAYS);
  return expires.toISOString();
}

export function createConsent(categories: Partial<ConsentCategories>): PrivacyConsent {
  const now = new Date();
  return {
    version: PRIVACY_CONSENT_VERSION,
    categories: { ...defaultConsentCategories, ...categories, necessary: true },
    decidedAt: now.toISOString(),
    expiresAt: consentExpiry(now),
  };
}

export function parseConsent(raw: string | null): PrivacyConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PrivacyConsent;
    if (parsed.version !== PRIVACY_CONSENT_VERSION) return null;
    if (!parsed.expiresAt || new Date(parsed.expiresAt).getTime() <= Date.now()) return null;
    if (!parsed.categories?.necessary) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readConsent(): PrivacyConsent | null {
  if (typeof window === "undefined") return null;
  return parseConsent(window.localStorage.getItem(PRIVACY_CONSENT_KEY));
}

export function writeConsent(consent: PrivacyConsent): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRIVACY_CONSENT_KEY, JSON.stringify(consent));
}

export function hasConsent(category: PrivacyCategory): boolean {
  if (category === "necessary") return true;
  return Boolean(readConsent()?.categories[category]);
}

export function cleanupCategory(category: PrivacyCategory): void {
  if (typeof window === "undefined") return;
  for (const key of keysForCategory(category)) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore blocked storage */
    }
  }
}

export function cleanupWithdrawnCategories(
  previous: ConsentCategories | null,
  next: ConsentCategories,
): void {
  for (const category of ["preferences", "analytics", "marketing"] as const) {
    if (previous?.[category] && !next[category]) cleanupCategory(category);
  }
}
