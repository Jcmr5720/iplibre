"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrivacyConsent } from "@/components/privacy/PrivacyConsentProvider";

const options = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "system", label: "Sistema", Icon: Monitor },
  { value: "dark", label: "Oscuro", Icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { consent, ready, openPanel } = usePrivacyConsent();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);
  const preferencesAllowed = Boolean(consent?.categories.preferences);

  return (
    <div
      role="radiogroup"
      aria-label="Tema de color"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
    >
      {options.map(({ value, label, Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={preferencesAllowed ? label : `${label} - requiere preferencias`}
            onClick={() => {
              if (!ready || !preferencesAllowed) {
                openPanel();
                return;
              }
              setTheme(value);
            }}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
              active ? "brand-gradient-bg text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
