"use client";

import { useEffect } from "react";
import { useUIStore } from "@/lib/store/ui-store";
import { useRideStore } from "@/lib/store/ride-store";
import { setupOfflineDetection } from "@/lib/services/offline-queue";
import { sessionMonitor } from "@/lib/services/session-monitor";

export function useInitializeStores() {
  useEffect(() => {
    const cleanupLocation = useRideStore.getState().startLocationTracking();

    setupOfflineDetection();

    sessionMonitor.start();

    return () => {
      cleanupLocation?.();
      useRideStore.getState().cleanup();
      useUIStore.getState().cleanup();
      sessionMonitor.stop();
    };
  }, []);
}
