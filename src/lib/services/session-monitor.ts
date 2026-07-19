"use client";

import { logger } from "@/lib/utils/logger";

const CHECK_INTERVAL = 60000;
const MINIMIZED_CHECK_DELAY = 500;

export class SessionMonitor {
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private isVisible: boolean = true;
  private lastActiveCheck: number = Date.now();

  start() {
    if (typeof window === "undefined") return;

    this.checkTimer = setInterval(() => this.checkSession(), CHECK_INTERVAL);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.isVisible = true;
        const elapsed = Date.now() - this.lastActiveCheck;
        if (elapsed > CHECK_INTERVAL * 2) {
          setTimeout(() => this.checkSession(), MINIMIZED_CHECK_DELAY);
        }
      } else {
        this.isVisible = false;
        this.lastActiveCheck = Date.now();
      }
    });

    logger.info("SessionMonitor started");
  }

  private async checkSession() {
    try {
      const res = await fetch("/api/auth/session", { method: "HEAD" });
      if (res.status === 401) {
        logger.warn("Session expired — forcing logout");
        const { useUserStore } = await import("@/lib/store/user-store");
        useUserStore.getState().logout();
        window.location.href = "/auth/login?expired=1";
      }
    } catch {
      // Network error, ignore
    }
  }

  stop() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }
}

export const sessionMonitor = new SessionMonitor();
