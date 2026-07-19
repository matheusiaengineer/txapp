"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { logger } from "@/lib/utils/logger";

interface ModalStateConfig {
  modalName: string;
  paramKey: string;
}

interface NavigationGuardProps {
  blockBackRoutes?: string[];
  modalStates?: ModalStateConfig[];
  activeModal?: string | null;
  onCloseModal?: () => void;
}

export function NavigationGuard({
  blockBackRoutes = [],
  activeModal = null,
  onCloseModal,
}: NavigationGuardProps) {
  const pathname = usePathname();

  // Android back button — close modals first before navigating (rule 5)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      if (activeModal && onCloseModal) {
        onCloseModal();
        window.history.pushState(null, "", window.location.href);
        return;
      }

      const shouldBlock = blockBackRoutes.some(route => pathname.startsWith(route));
      if (shouldBlock) {
        window.history.pushState(null, "", window.location.href);
        logger.warn("Back navigation blocked on", pathname);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeModal, onCloseModal, blockBackRoutes, pathname]);

  // Clean navigation stack after ride ends (rule 13)
  const replaceRideHistory = useCallback(() => {
    if (pathname.startsWith("/ride") || pathname.startsWith("/payment")) {
      window.history.replaceState(null, "", "/dashboard/passenger/history");
    }
  }, [pathname]);

  useEffect(() => {
    (window as any).__replaceRideHistory = replaceRideHistory;
  }, [replaceRideHistory]);

  return null;
}

export function goBack() {
  if (typeof window !== "undefined") {
    window.history.back();
  }
}

export function setVerificationStep(step: number) {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(step));
    window.history.replaceState(null, "", url.toString());
  }
}

export function getVerificationStep(): number {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get("step") || "1");
  }
  return 1;
}
