"use client";

import { create } from "zustand";

export type ConnectionQuality = "unknown" | "excellent" | "good" | "fair" | "poor";

export interface UIState {
  isSidebarOpen: boolean;
  activeModal: string | null;
  isOnline: boolean;
  isRideModalOpen: boolean;
  isLocationModalOpen: boolean;
  connectionQuality: ConnectionQuality;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  setOnline: (online: boolean) => void;
  setRideModalOpen: (open: boolean) => void;
  setLocationModalOpen: (open: boolean) => void;
  setConnectionQuality: (quality: ConnectionQuality) => void;
  cleanup: () => void;
}

function getConnectionQuality(): ConnectionQuality {
  if (typeof navigator === "undefined" || !("connection" in navigator)) return "unknown";
  const conn = (navigator as any).connection as {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  if (!conn) return "unknown";

  if (conn.effectiveType === "4g" && (conn.downlink ?? 0) >= 10) return "excellent";
  if (conn.effectiveType === "4g") return "good";
  if (conn.effectiveType === "3g") return "fair";
  if (conn.effectiveType === "2g" || conn.effectiveType === "slow-2g") return "poor";
  return "unknown";
}

export const useUIStore = create<UIState>()((set, get) => {
  let unsubscribeOnline: (() => void) | null = null;
  let unsubscribeConnection: (() => void) | null = null;

  if (typeof window !== "undefined") {
    const handleOnline = () => set({ isOnline: true });
    const handleOffline = () => set({ isOnline: false });

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    unsubscribeOnline = () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };

    const conn = (navigator as any).connection;
    if (conn) {
      const handleChange = () => {
        set({ connectionQuality: getConnectionQuality() });
      };
      conn.addEventListener("change", handleChange);
      unsubscribeConnection = () => {
        conn.removeEventListener("change", handleChange);
      };
    }

    set({ isOnline: navigator.onLine, connectionQuality: getConnectionQuality() });
  }

  return {
    isSidebarOpen: false,
    activeModal: null,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isRideModalOpen: false,
    isLocationModalOpen: false,
    connectionQuality: "unknown",

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

    setSidebarOpen: (open) => set({ isSidebarOpen: open }),

    setActiveModal: (modal) => set({ activeModal: modal }),

    setOnline: (online) => set({ isOnline: online }),

    setRideModalOpen: (open) => set({ isRideModalOpen: open }),

    setLocationModalOpen: (open) => set({ isLocationModalOpen: open }),

    setConnectionQuality: (quality) => set({ connectionQuality: quality }),

    cleanup: () => {
      if (unsubscribeOnline) unsubscribeOnline();
      if (unsubscribeConnection) unsubscribeConnection();
    },
  };
});
