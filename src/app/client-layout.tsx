"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/provider";
import { registerServiceWorker, setupOfflineDetection } from "@/lib/performance/sw-register";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { notificationService } from "@/lib/notification/notification-service";
import { detectDevice, type DeviceInfo } from "@/lib/performance/device-detect";
import { DeviceContext } from "@/lib/performance/device-context";

export function ClientLayout({ children }: { children: ReactNode }) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    registerServiceWorker();
    notificationService.init();
    setDeviceInfo(detectDevice());
  }, []);

  const ctxValue = useMemo(() => deviceInfo, [deviceInfo]);

  return (
    <DeviceContext.Provider value={ctxValue}>
      <I18nProvider>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </I18nProvider>
    </DeviceContext.Provider>
  );
}
