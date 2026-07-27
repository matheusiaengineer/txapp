"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { I18nProvider } from "@/lib/i18n/provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Toast } from "@/components/ui/toast";

function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js", { updateViaCache: "none" }).catch(() => {});
    }
  }, []);
  return null;
}

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ErrorBoundary>
        <ServiceWorkerRegistration />
        <Toast />
        {children}
      </ErrorBoundary>
    </I18nProvider>
  );
}
