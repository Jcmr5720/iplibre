"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/ui/Toast";
import { PrivacyConsentProvider } from "@/components/privacy/PrivacyConsentProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivacyConsentProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </PrivacyConsentProvider>
  );
}
