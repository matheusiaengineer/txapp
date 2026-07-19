"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/browser";
import { centavosToReais, formatCurrency } from "@/lib/utils/financial";

export type UserRole = "passenger" | "motoboy" | "taxi" | "freight_driver" | "company" | "admin";

export type WalletTxType =
  | "deposit" | "withdrawal" | "ride_payment" | "ride_earning"
  | "freight_payment" | "freight_earning" | "refund" | "platform_fee"
  | "bonus" | "cashback" | "commission" | "transfer" | "escrow_block"
  | "escrow_release" | "withdrawal_pending" | "withdrawal_failed"
  | "withdrawal_confirmed" | "monthly_fee" | "advancement" | "fine"
  | "tip" | "boleto" | "credit_usage" | "invoice_payment";

export type WalletTxStatus =
  | "pending" | "confirmed" | "failed" | "reversed"
  | "blocked" | "released" | "disputed";

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTxType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  status: WalletTxStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface WalletState {
  realBalance: number;
  promotionalBalance: number;
  blockedBalance: number;
  escrowBalance: number;
  transactions: WalletTransaction[];
  isLoading: boolean;
  walletId: string | null;
  userId: string | null;
  userRole: UserRole | null;

  initializeWallet: (userId: string) => Promise<void>;
  refreshBalance: (walletId: string) => Promise<void>;
  setBalances: (real: number, promotional: number, blocked: number, escrow: number) => void;
  hasSufficientFunds: (estimatedCost: number) => boolean;
  addTransaction: (tx: WalletTransaction) => void;
  setTransactions: (txs: WalletTransaction[]) => void;
  setLoading: (loading: boolean) => void;
  subscribeToTransactions: (walletId: string) => () => void;
  cleanup: () => void;
  setRole: (role: UserRole) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => {
      let realtimeChannel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

      return {
        realBalance: 0,
        promotionalBalance: 0,
        blockedBalance: 0,
        escrowBalance: 0,
        transactions: [],
        isLoading: false,
        walletId: null,
        userId: null,
        userRole: null,

        setRole: (role) => set({ userRole: role }),

        initializeWallet: async (userId: string) => {
          set({ isLoading: true, userId });
          try {
            const supabase = createClient();
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", userId)
              .single();

            const role = (profile?.role || "passenger") as UserRole;
            set({ userRole: role });

            const { data: wallet } = await supabase
              .from("wallets")
              .select("id")
              .eq("profile_id", userId)
              .single();

            if (wallet) {
              set({ walletId: wallet.id });

              const { data: balanceData } = await supabase
                .rpc("get_calculated_balance", { p_profile_id: userId })
                .single() as { data: { available: string; blocked: string; escrow: string } | null };

              if (balanceData) {
                const totalCentavos = Math.round(parseFloat(balanceData.available || "0") * 100);
                const blockedCentavos = Math.round(parseFloat(balanceData.blocked || "0") * 100);
                const escrowCentavos = Math.round(parseFloat(balanceData.escrow || "0") * 100);
                set({
                  realBalance: totalCentavos,
                  promotionalBalance: 0,
                  blockedBalance: blockedCentavos,
                  escrowBalance: escrowCentavos,
                  isLoading: false,
                });
              } else {
                set({ isLoading: false });
              }

              get().subscribeToTransactions(wallet.id);

              const { data: txs } = await supabase
                .from("wallet_transactions")
                .select("*")
                .eq("wallet_id", wallet.id)
                .order("created_at", { ascending: false })
                .limit(20);

              if (txs) {
                const mapped: WalletTransaction[] = txs.map((tx: any) => ({
                  id: tx.id,
                  walletId: tx.wallet_id,
                  type: tx.type,
                  amount: Math.round(parseFloat(tx.amount) * 100),
                  balanceBefore: Math.round(parseFloat(tx.balance_before) * 100),
                  balanceAfter: Math.round(parseFloat(tx.balance_after) * 100),
                  description: tx.description,
                  referenceType: tx.reference_type,
                  referenceId: tx.reference_id,
                  status: tx.status || "confirmed",
                  metadata: tx.metadata || null,
                  createdAt: tx.created_at,
                }));
                set({ transactions: mapped });
              }
            } else {
              set({ isLoading: false });
            }
          } catch {
            set({ isLoading: false });
          }
        },

        refreshBalance: async (walletId: string) => {
          try {
            const supabase = createClient();
            const { data } = await supabase
              .from("wallet_balance_snapshot")
              .select("available, blocked, escrow")
              .eq("wallet_id", walletId)
              .single();

            if (data) {
              set({
                realBalance: Math.round(parseFloat(data.available || "0") * 100),
                blockedBalance: Math.round(parseFloat(data.blocked || "0") * 100),
                escrowBalance: Math.round(parseFloat(data.escrow || "0") * 100),
              });
            }
          } catch { /* */ }
        },

        setBalances: (real, promotional, blocked, escrow) =>
          set({ realBalance: real, promotionalBalance: promotional, blockedBalance: blocked, escrowBalance: escrow }),

        hasSufficientFunds: (estimatedCost) => {
          const { realBalance, promotionalBalance, blockedBalance } = get();
          const available = realBalance + promotionalBalance - blockedBalance;
          return available >= estimatedCost;
        },

        addTransaction: (tx) =>
          set((state) => ({
            transactions: [tx, ...state.transactions].slice(0, 100),
          })),

        setTransactions: (txs) => set({ transactions: txs }),

        setLoading: (loading) => set({ isLoading: loading }),

        subscribeToTransactions: (walletId: string) => {
          const supabase = createClient();
          if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
          }
          const channel = supabase
            .channel(`wallet-tx-${walletId}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "wallet_transactions",
                filter: `wallet_id=eq.${walletId}`,
              },
              (payload) => {
                const tx = payload.new as any;
                const transaction: WalletTransaction = {
                  id: tx.id,
                  walletId: tx.wallet_id,
                  type: tx.type,
                  amount: Math.round(parseFloat(tx.amount) * 100),
                  balanceBefore: Math.round(parseFloat(tx.balance_before) * 100),
                  balanceAfter: Math.round(parseFloat(tx.balance_after) * 100),
                  description: tx.description,
                  referenceType: tx.reference_type,
                  referenceId: tx.reference_id,
                  status: tx.status || "confirmed",
                  metadata: tx.metadata || null,
                  createdAt: tx.created_at,
                };

                const store = get();
                const totalAfter = transaction.balanceAfter;
                const promoUsed = Math.min(store.promotionalBalance, totalAfter);
                set({
                  realBalance: totalAfter - promoUsed,
                  promotionalBalance: promoUsed,
                  transactions: [transaction, ...store.transactions].slice(0, 100),
                });
              }
            )
            .subscribe();

          realtimeChannel = channel;

          return () => {
            if (realtimeChannel) {
              supabase.removeChannel(realtimeChannel);
              realtimeChannel = null;
            }
          };
        },

        cleanup: () => {
          if (realtimeChannel) {
            const supabase = createClient();
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
          }
        },
      };
    },
    {
      name: "txd-wallet",
      partialize: (state) => ({
        realBalance: state.realBalance,
        promotionalBalance: state.promotionalBalance,
        blockedBalance: state.blockedBalance,
        escrowBalance: state.escrowBalance,
        userRole: state.userRole,
      }),
    }
  )
);
