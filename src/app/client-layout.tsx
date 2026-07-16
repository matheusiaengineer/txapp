"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/provider";
import { SplashScreen } from "@/lib/components/3d/splash-screen";
import { registerServiceWorker } from "@/lib/performance/sw-register";
import { InstallPrompt } from "@/components/ui/install-prompt";

export function ClientLayout({ children }: { children: ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const onSplashFinish = useCallback(() => setSplashDone(true), []);

  return (
    <I18nProvider>
      {!splashDone && <SplashScreen onFinish={onSplashFinish} />}
      {splashDone && children}
      <InstallPrompt />
    </I18nProvider>
  );
}
