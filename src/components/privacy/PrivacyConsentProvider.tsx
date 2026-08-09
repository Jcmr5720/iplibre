"use client";

import * as React from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Settings, X } from "lucide-react";
import {
  cleanupWithdrawnCategories,
  createConsent,
  readConsent,
  writeConsent,
  type ConsentCategories,
  type PrivacyConsent,
} from "@/lib/privacy/consent";
import {
  privacyCategories,
  type PrivacyCategory,
} from "@/lib/privacy/storage-registry";
import { verification } from "@/lib/config";
import { Button } from "@/components/ui/Button";

type PrivacyContextValue = {
  consent: PrivacyConsent | null;
  ready: boolean;
  openPanel: () => void;
  saveCategories: (categories: ConsentCategories) => void;
};

const PrivacyContext = React.createContext<PrivacyContextValue | null>(null);

export function usePrivacyConsent() {
  const ctx = React.useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacyConsent must be used within PrivacyConsentProvider");
  return ctx;
}

function optionalDefaults(): ConsentCategories {
  return {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  };
}

export function PrivacyConsentProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [consent, setConsent] = React.useState<PrivacyConsent | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);

  React.useEffect(() => {
    queueMicrotask(() => {
      setConsent(readConsent());
      setReady(true);
    });
  }, []);

  const saveCategories = React.useCallback(
    (categories: ConsentCategories) => {
      const previous = consent?.categories ?? null;
      const next = createConsent({ ...categories, necessary: true });
      cleanupWithdrawnCategories(previous, next.categories);
      writeConsent(next);
      setConsent(next);
      setPanelOpen(false);
      window.dispatchEvent(new CustomEvent("iplibre:privacy-consent-updated", { detail: next }));
    },
    [consent],
  );

  const value = React.useMemo<PrivacyContextValue>(
    () => ({
      consent,
      ready,
      openPanel: () => setPanelOpen(true),
      saveCategories,
    }),
    [consent, ready, saveCategories],
  );

  const showBanner = ready && !consent && !panelOpen;
  const analyticsAllowed = Boolean(consent?.categories.analytics);
  const marketingAllowed = Boolean(consent?.categories.marketing);

  React.useEffect(() => {
    if (!ready || analyticsAllowed) return;
    document
      .querySelectorAll('script[src*="/_vercel/insights"], script[src*="/_vercel/speed-insights"]')
      .forEach((script) => script.remove());
  }, [analyticsAllowed, ready]);

  React.useEffect(() => {
    if (!ready || marketingAllowed) return;
    removeGoogleAdScripts();
  }, [marketingAllowed, ready]);

  return (
    <PrivacyContext.Provider value={value}>
      {children}
      {analyticsAllowed && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
      {marketingAllowed && (
        <AdSenseScript client={verification.adsenseClient} />
      )}
      {showBanner && <PrivacyBanner onConfigure={() => setPanelOpen(true)} onSave={saveCategories} />}
      {panelOpen && (
        <PrivacyPanel
          initial={consent?.categories ?? optionalDefaults()}
          onClose={() => setPanelOpen(false)}
          onSave={saveCategories}
        />
      )}
    </PrivacyContext.Provider>
  );
}

function AdSenseScript({ client }: { client: string }) {
  React.useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>("#adsbygoogle-init");
    const script = existing ?? document.createElement("script");
    script.id = "adsbygoogle-init";
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    script.crossOrigin = "anonymous";
    if (!existing) document.head.appendChild(script);

    return () => {
      removeGoogleAdScripts();
      const win = window as typeof window & { adsbygoogle?: unknown };
      delete win.adsbygoogle;
    };
  }, [client]);

  return null;
}

function removeGoogleAdScripts() {
  document
    .querySelectorAll(
      [
        'script[src*="pagead2.googlesyndication.com"]',
        'script[src*="googlesyndication.com"]',
        'script[src*="googleadservices.com"]',
        'script[src*="googletagservices.com"]',
      ].join(", "),
    )
    .forEach((script) => script.remove());
}

function PrivacyBanner({
  onConfigure,
  onSave,
}: {
  onConfigure: () => void;
  onSave: (categories: ConsentCategories) => void;
}) {
  return (
    <section
      aria-label="Aviso de privacidad y cookies"
      className="fixed inset-x-0 bottom-0 z-[180] border-t border-border bg-background/95 px-4 py-4 shadow-2xl backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-sm font-semibold text-foreground">Privacidad y cookies</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            IPLibre usa almacenamiento necesario para recordar tu decisión. Las preferencias,
            analítica y publicidad solo se activan si das consentimiento.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 md:min-w-[31rem]">
          <Button variant="outline" onClick={() => onSave(optionalDefaults())}>
            Rechazar opcionales
          </Button>
          <Button variant="outline" onClick={onConfigure}>
            <Settings className="h-4 w-4" /> Configurar
          </Button>
          <Button
            onClick={() =>
              onSave({ necessary: true, preferences: true, analytics: true, marketing: true })
            }
          >
            Aceptar
          </Button>
        </div>
      </div>
    </section>
  );
}

function PrivacyPanel({
  initial,
  onClose,
  onSave,
}: {
  initial: ConsentCategories;
  onClose: () => void;
  onSave: (categories: ConsentCategories) => void;
}) {
  const [categories, setCategories] = React.useState<ConsentCategories>({
    ...optionalDefaults(),
    ...initial,
    necessary: true,
  });
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setCategory = (category: PrivacyCategory, checked: boolean) => {
    if (category === "necessary") return;
    setCategories((current) => ({ ...current, [category]: checked, necessary: true }));
  };

  return (
    <div className="fixed inset-0 z-[190]" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        className="absolute inset-x-3 bottom-3 mx-auto max-h-[calc(100dvh-1.5rem)] max-w-2xl overflow-y-auto rounded-lg border border-border bg-background p-5 shadow-2xl sm:inset-x-6 sm:bottom-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="privacy-title" className="text-lg font-semibold">
              Preferencias de privacidad
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cambia tu decisión en cualquier momento. Las categorías opcionales no están premarcadas.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cerrar preferencias de privacidad"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {(Object.keys(privacyCategories) as PrivacyCategory[]).map((category) => {
            const meta = privacyCategories[category];
            const checked = categories[category];
            return (
              <label
                key={category}
                className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4"
              >
                <span>
                  <span className="block text-sm font-semibold text-foreground">{meta.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{meta.description}</span>
                  {meta.required && (
                    <span className="mt-2 inline-block text-xs font-medium text-primary">
                      Siempre activas
                    </span>
                  )}
                </span>
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-primary"
                  checked={checked}
                  disabled={meta.required}
                  onChange={(event) => setCategory(category, event.target.checked)}
                />
              </label>
            );
          })}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <Button variant="outline" onClick={() => onSave(optionalDefaults())}>
            Rechazar opcionales
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(categories)}>Guardar preferencias</Button>
        </div>
      </div>
    </div>
  );
}
