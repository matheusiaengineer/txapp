"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/browser";

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: "deposit" | "withdrawal" | "payment" | "refund" | "bonus" | "cashback" | "commission" | "transfer";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface WalletState {
  realBalance: number;
  promotionalBalance: number;
  transactions: WalletTransaction[];
  isLoading: boolean;

  initializeWallet: (userId: string) => Promise<void>;
  refreshBalance: (walletId: string) => Promise<void>;
  setBalances: (real: number, promotional: number) => void;
  hasSufficientFunds: (estimatedCost: number) => boolean;
  blockRideIfInsufficient: (estimatedCost: number) => boolean;
  addTransaction: (tx: WalletTransaction) => void;
  setTransactions: (txs: WalletTransaction[]) => void;
  setLoading: (loading: boolean) => void;
  subscribeToTransactions: (walletId: string) => () => void;
  cleanup: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => {
      let realtimeChannel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

      return {
        realBalance: 0,
        promotionalBalance: 0,
        transactions: [],
        isLoading: false,

        initializeWallet: async (userId: string) => {
          set({ isLoading: true });
          try {
            const supabase = createClient();
            const { data: wallet } = await supabase
              .from("wallets")
              .select("id, balance")
              .eq("profile_id", userId)
              .single();

            if (wallet) {
              const totalCentavos = Math.round(parseFloat(wallet.balance) * 100);
              set({
                realBalance: totalCentavos,
                promotionalBalance: 0,
                isLoading: false,
              });
              get().subscribeToTransactions(wallet.id);
            }
          } catch {
            set({ isLoading: false });
          }
        },

        refreshBalance: async (walletId: string) => {
          try {
            const supabase = createClient();
            const { data: wallet } = await supabase
              .from("wallets")
              .select("balance")
              .eq("id", walletId)
              .single();

            if (wallet) {
              const totalCentavos = Math.round(parseFloat(wallet.balance) * 100);
              const current = get();
              set({
                realBalance: totalCentavos - current.promotionalBalance,
              });
            }
          } catch {
            /* silent */
          }
        },

        setBalances: (real, promotional) =>
          set({ realBalance: real, promotionalBalance: promotional }),

        hasSufficientFunds: (estimatedCost) => {
          const { realBalance, promotionalBalance } = get();
          return realBalance + promotionalBalance >= estimatedCost;
        },

        blockRideIfInsufficient: (estimatedCost) => {
          const { realBalance, promotionalBalance } = get();
          return realBalance + promotionalBalance < estimatedCost;
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
      }),
    }
  )
);
