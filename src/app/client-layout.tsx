"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Toast } from "@/components/ui/toast";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ErrorBoundary>
        <Toast />
        {children}
      </ErrorBoundary>
    </I18nProvider>
  );
}
