"use client";

import { useEffect, useState, type ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/provider";
import { registerServiceWorker } from "@/lib/performance/sw-register";
import { ErrorBoundary } from "@/components/ui/error-boundary";

function GlobalErrorNotification() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      console.error("[Global Error]", event.error || event.message);
      setError(event.message || "Erro desconhecido");
    };
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error("[Unhandled Rejection]", event.reason);
      setError(String(event.reason || "Promise rejection"));
    };
    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", rejectionHandler);
    return () => {
      window.removeEventListener("error", handler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
  }, []);

  if (!error) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] bg-red-500/90 text-white text-xs p-3 text-center">
      ⚠ Erro: {error.slice(0, 120)}
      <button onClick={() => window.location.reload()} className="ml-2 underline font-bold">Recarregar</button>
    </div>
  );
}

export function ClientLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <I18nProvider>
      <ErrorBoundary>
        <GlobalErrorNotification />
        {children}
      </ErrorBoundary>
    </I18nProvider>
  );
}
