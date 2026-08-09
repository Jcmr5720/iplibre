"use client";

import { Settings } from "lucide-react";
import { usePrivacyConsent } from "@/components/privacy/PrivacyConsentProvider";

export function PrivacyPreferencesButton() {
  const { openPanel } = usePrivacyConsent();

  return (
    <button
      type="button"
      onClick={openPanel}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <Settings className="h-3.5 w-3.5" aria-hidden />
      Preferencias de privacidad
    </button>
  );
}
