"use client";

import { api } from "@/lib/services/api-service";

type ErrorType = "401" | "500" | "NETWORK" | "TIMEOUT" | "UPLOAD" | "VALIDATION";

interface ErrorLogEntry {
  error_type: ErrorType;
  error_message: string;
  endpoint?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private retryCounts: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 3;
  private offlineLogs: ErrorLogEntry[] = [];

  /**
   * Log an error to the app_errors table (Rule 181)
   */
  async log(error: ErrorLogEntry): Promise<void> {
    // Don't block on error logging
    try {
      await api.post("/api/logs/error", error);
    } catch {
      // Queue for later if offline
      this.offlineLogs.push(error);
      try {
        localStorage.setItem("txd-offline-errors", JSON.stringify(this.offlineLogs));
      } catch {}
    }

    // Client-side console in dev
    if (process.env.NODE_ENV === "development") {
      console.error("[TXD Error]", error.error_type, error.error_message, error.endpoint);
    }
  }

  /**
   * Flush queued offline logs
   */
  async flushOfflineLogs(): Promise<void> {
    try {
      const raw = localStorage.getItem("txd-offline-errors");
      if (!raw) return;
      const logs: ErrorLogEntry[] = JSON.parse(raw);
      for (const log of logs) {
        try { await api.post("/api/logs/error", log); } catch {}
      }
      localStorage.removeItem("txd-offline-errors");
      this.offlineLogs = [];
    } catch {}
  }

  /**
   * Retry logic with exponential backoff (Rule 182)
   */
  async withRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
    const retryKey = context;
    const attempts = this.retryCounts.get(retryKey) || 0;

    try {
      const result = await fn();
      this.retryCounts.delete(retryKey);
      return result;
    } catch (error: any) {
      const newAttempts = attempts + 1;

      if (newAttempts >= this.MAX_RETRIES) {
        this.retryCounts.delete(retryKey);
        await this.log({
          error_type: "TIMEOUT",
          error_message: `Falha após ${this.MAX_RETRIES} tentativas: ${error.message}`,
          endpoint: context,
        });
        throw error;
      }

      this.retryCounts.set(retryKey, newAttempts);
      const delay = Math.min(1000 * Math.pow(2, attempts), 8000);
      await new Promise(r => setTimeout(r, delay));
      return this.withRetry(fn, context);
    }
  }

  /**
   * Validate device clock against server (Rule 183)
   */
  async validateClock(): Promise<{ valid: boolean; diff: number }> {
    try {
      const start = Date.now();
      const res = await fetch("/api/health", { method: "HEAD", cache: "no-store" });
      const end = Date.now();
      const rtt = end - start;
      const serverDate = new Date(res.headers.get("Date") || "");
      const estimatedServer = serverDate.getTime() + rtt / 2;
      const diff = Math.abs(Date.now() - estimatedServer);

      return {
        valid: diff < 300000, // 5 min tolerance
        diff,
      };
    } catch {
      return { valid: true, diff: 0 };
    }
  }

  /**
   * Version check: force update if API version differs (Rule 188)
   */
  async checkVersion(): Promise<{ current: string; required: string; needsUpdate: boolean }> {
    const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
    try {
      const res = await api.get<{ min_version: string }>("/api/config/version");
      const required = res.data?.min_version || APP_VERSION;

      const needsUpdate = this.compareVersions(APP_VERSION, required) < 0;

      if (needsUpdate) {
        localStorage.setItem("txd-needs-update", "true");
      }

      return { current: APP_VERSION, required, needsUpdate };
    } catch {
      return { current: APP_VERSION, required: APP_VERSION, needsUpdate: false };
    }
  }

  private compareVersions(a: string, b: string): number {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] || 0;
      const nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  /**
   * Alert if WebSocket connection drops (Rule 185)
   */
  monitorWebSocket(channelName: string, onStatusChange: (connected: boolean) => void): void {
    const supabase = require("@/lib/supabase/browser").createClient();
    const channel = supabase.channel(channelName);

    channel.on("system", { event: "." }, (msg: any) => {
      // Heartbeat check
    });

    channel.subscribe((status: string) => {
      onStatusChange(status === "SUBSCRIBED");
      if (status !== "SUBSCRIBED") {
        this.log({
          error_type: "NETWORK",
          error_message: `WebSocket desconectado: ${status}`,
          endpoint: channelName,
        });
      }
    });
  }

  /**
   * Validate file size before upload (Rule 186)
   */
  validateFileSize(file: File, maxMB: number = 10): { valid: boolean; error?: string } {
    const maxBytes = maxMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return { valid: false, error: `Arquivo muito grande. Máximo: ${maxMB}MB` };
    }
    return { valid: true };
  }

  /**
   * Clear cache on logout (Rule 187)
   */
  clearOnLogout(): void {
    this.retryCounts.clear();
    this.offlineLogs = [];
    localStorage.removeItem("txd-offline-errors");
    localStorage.removeItem("txd-needs-update");
    localStorage.removeItem("txd-state-history-stack");
    // Clear all txd-state-* keys
    const keys = Object.keys(localStorage).filter(k => k.startsWith("txd-state-"));
    keys.forEach(k => localStorage.removeItem(k));
  }
}

export const errorLogger = new ErrorLogger();
