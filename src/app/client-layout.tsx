"use client";

import { useEffect, useState, type ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/provider";
import { registerServiceWorker } from "@/lib/performance/sw-register";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export function ClientLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <I18nProvider>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </I18nProvider>
  );
}
