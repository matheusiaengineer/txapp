"use client";

import { api } from "@/lib/services/api-service";
import { persistence } from "@/lib/services/persistence";
import { createClient } from "@/lib/supabase/browser";

export interface DepositRequest {
  transactionId: string;
  amount: number;
  expiresAt: string;
  pixCode?: string;
  pixQrCode?: string;
}

export interface DepositState {
  step: "idle" | "generating" | "awaiting_pix" | "confirmed" | "failed" | "expired";
  transactionId: string | null;
  amount: number;
  pixCode: string | null;
  expiresAt: string | null;
  timeRemaining: number; // seconds
}

const DEPOSIT_STATE_KEY = "deposit-flow";

export class DepositService {
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private realtimeChannel: any = null;
  private onStateChange: ((state: DepositState) => void) | null = null;

  constructor() {
    // Restore pending deposit state on init
    const saved = persistence.loadState<DepositState>(DEPOSIT_STATE_KEY, {
      step: "idle", transactionId: null, amount: 0,
      pixCode: null, expiresAt: null, timeRemaining: 0,
    });
    if (saved.step === "awaiting_pix" && saved.expiresAt) {
      this.startTimer(saved.expiresAt);
      this.subscribeToConfirmation(saved.transactionId!);
    }
  }

  /**
   * Request a new deposit: generates transaction ID before showing PIX (Rule 13)
   */
  async requestDeposit(amount: number): Promise<DepositRequest> {
    const state = persistence.loadState<DepositState>(DEPOSIT_STATE_KEY, {
      step: "idle", transactionId: null, amount: 0,
      pixCode: null, expiresAt: null, timeRemaining: 0,
    });

    // Block if there's a pending deposit (Rule 17)
    if (state.step === "awaiting_pix") {
      throw new Error("Você já possui um depósito pendente. Aguarde a confirmação ou cancele o anterior.");
    }

    // Validate minimum (Rule 18)
    if (amount < 10) {
      throw new Error("Valor mínimo de depósito: R$ 10,00");
    }

    persistence.saveState(DEPOSIT_STATE_KEY, {
      ...state, step: "generating", amount: Math.round(amount * 100),
    });

    // Get IP and geo (Rule 19)
    let ip = "";
    let geo: any = null;
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      ip = ipData.ip;
    } catch {}
    try {
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch {}

    // Call backend to create transaction (Rule 13)
    const res = await api.post<DepositRequest>("/deposit/create", {
      amount: Math.round(amount * 100), // in centavos
      ip_address: ip,
      geo_location: geo,
    });

    if (res.status === "error") {
      persistence.saveState(DEPOSIT_STATE_KEY, {
        ...state, step: "failed", transactionId: null,
      });
      throw new Error(res.error_message || "Erro ao criar depósito");
    }

    const deposit = res.data!;
    const expiryDate = deposit.expiresAt;

    // Save state
    persistence.saveState(DEPOSIT_STATE_KEY, {
      step: "awaiting_pix",
      transactionId: deposit.transactionId,
      amount: Math.round(amount * 100),
      pixCode: deposit.pixCode || null,
      expiresAt: expiryDate,
      timeRemaining: this.calculateTimeRemaining(expiryDate),
    });

    this.startTimer(expiryDate);
    this.subscribeToConfirmation(deposit.transactionId);

    return deposit;
  }

  /**
   * Start PIX expiration timer (Rule 14)
   */
  private startTimer(expiresAt: string): void {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const remaining = this.calculateTimeRemaining(expiresAt);

      if (remaining <= 0) {
        this.handleExpiry();
        return;
      }

      const state = persistence.loadState<DepositState>(DEPOSIT_STATE_KEY, {} as any);
      state.timeRemaining = remaining;
      persistence.saveState(DEPOSIT_STATE_KEY, state);
      this.onStateChange?.(state);
    }, 1000);
  }

  private calculateTimeRemaining(expiresAt: string): number {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  }

  /**
   * Handle PIX expiry: invalidates the code (Rule 14)
   */
  private async handleExpiry(): Promise<void> {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;

    const state = persistence.loadState<DepositState>(DEPOSIT_STATE_KEY, {} as any);
    if (state.transactionId) {
      await api.post(`/deposit/cancel`, { transactionId: state.transactionId });
    }

    persistence.saveState(DEPOSIT_STATE_KEY, {
      ...state, step: "expired", timeRemaining: 0,
    });
    this.onStateChange?.({
      step: "expired", transactionId: null, amount: 0,
      pixCode: null, expiresAt: null, timeRemaining: 0,
    });
  }

  /**
   * Subscribe to real-time confirmation (Rules 15, 16)
   */
  private subscribeToConfirmation(transactionId: string): void {
    const supabase = createClient();
    this.realtimeChannel = supabase
      .channel(`deposit-${transactionId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "wallet_transactions",
        filter: `id=eq.${transactionId}`,
      }, (payload: any) => {
        const tx = payload.new as any;
        if (tx.status === "confirmed") {
          this.handleConfirmation();
        }
      })
      .subscribe();
  }

  /**
   * Handle payment confirmation (Rules 15, 16)
   */
  private async handleConfirmation(): Promise<void> {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.realtimeChannel) {
      const supabase = createClient();
      supabase.removeChannel(this.realtimeChannel);
    }

    persistence.saveState(DEPOSIT_STATE_KEY, {
      step: "confirmed", transactionId: null, amount: 0,
      pixCode: null, expiresAt: null, timeRemaining: 0,
    });
    this.onStateChange?.({
      step: "confirmed", transactionId: null, amount: 0,
      pixCode: null, expiresAt: null, timeRemaining: 0,
    });
  }

  /**
   * Cancel pending deposit
   */
  async cancelDeposit(): Promise<void> {
    const state = persistence.loadState<DepositState>(DEPOSIT_STATE_KEY, {} as any);
    if (state.transactionId) {
      await api.post(`/deposit/cancel`, { transactionId: state.transactionId });
    }
    this.cleanup();
    persistence.clearState(DEPOSIT_STATE_KEY);
  }

  /**
   * Subscribe to state changes
   */
  onStateChangeCallback(cb: (state: DepositState) => void): () => void {
    this.onStateChange = cb;
    // Emit current state immediately
    const current = persistence.loadState<DepositState>(DEPOSIT_STATE_KEY, {
      step: "idle", transactionId: null, amount: 0,
      pixCode: null, expiresAt: null, timeRemaining: 0,
    });
    cb(current);

    return () => { this.onStateChange = null; };
  }

  /**
   * Cleanup timers and subscriptions
   */
  cleanup(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.realtimeChannel) {
      const supabase = createClient();
      supabase.removeChannel(this.realtimeChannel);
    }
  }
}

export const depositService = new DepositService();
