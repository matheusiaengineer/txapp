"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/provider";
import { registerServiceWorker, setupOfflineDetection } from "@/lib/performance/sw-register";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { notificationService } from "@/lib/notification/notification-service";
import { detectDevice, type DeviceInfo } from "@/lib/performance/device-detect";
import { DeviceContext } from "@/lib/performance/device-context";
import { useInitializeStores } from "@/lib/store/initialize-stores";
import { OnlineBanner } from "@/components/ui/online-banner";
import { errorLogger } from "@/lib/services/error-logger";

export function ClientLayout({ children }: { children: ReactNode }) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useInitializeStores();

  useEffect(() => {
    registerServiceWorker();
    notificationService.init();
    setDeviceInfo(detectDevice());

    // Flush any queued offline error logs
    errorLogger.flushOfflineLogs();

    // Validate clock on startup (Rule 183)
    errorLogger.validateClock().then(({ valid, diff }) => {
      if (!valid) {
        console.warn(`Clock skew detected: ${diff}ms. Token validation may fail.`);
      }
    });

    // Check version (Rule 188)
    errorLogger.checkVersion().then(({ needsUpdate }) => {
      if (needsUpdate) {
        // Show update banner
        const banner = document.createElement("div");
        banner.className = "fixed bottom-0 left-0 right-0 z-[9999] bg-yellow-500 text-black text-xs font-semibold text-center py-2";
        banner.textContent = "Nova versão disponível. Atualize o app.";
        document.body.appendChild(banner);
      }
    });
  }, []);

  const ctxValue = useMemo(() => deviceInfo, [deviceInfo]);

  return (
    <DeviceContext.Provider value={ctxValue}>
      <I18nProvider>
        <ErrorBoundary>
          <OnlineBanner />
          {children}
        </ErrorBoundary>
      </I18nProvider>
    </DeviceContext.Provider>
  );
}
