"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import Link from "next/link";
import { ArrowLeft, Plus, Wallet, Zap, Clock } from "lucide-react";

export default function PassengerWalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      const { data: w } = await supabase.from("wallets").select("*").eq("profile_id", data.user.id).single();
      setWallet(w);
      const { data: t } = await supabase.from("wallet_transactions").select("*")
        .eq("profile_id", data.user.id).order("created_at", { ascending: false }).limit(10);
      setTransactions(t || []);
    });
  }, []);

  async function handleDeposit() {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const res = await fetch("/api/payments/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
          riderId: user.id,
          driverId: user.id,
          tripId: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (data.qrCodeUrl) {
        window.location.href = `/payment/pix?trip=${data.paymentIntentId}`;
      } else {
        setError("Erro ao gerar PIX. Tente novamente.");
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-[100dvh] bg-[#f8f9fa] px-4 pb-6"
      style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top, 0px))" }}>
      <Link href="/dashboard/passenger" className="inline-flex items-center gap-1.5 text-muted text-sm mb-5 hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      {/* Saldo */}
      <div className="bg-gradient-to-br from-primary to-emerald-500 rounded-3xl p-6 mb-4 shadow-lg shadow-primary/25">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-black/60" />
          <p className="text-sm text-black/70 font-medium">Saldo disponível</p>
        </div>
        <p className="text-4xl font-bold text-black mt-1">
          R$ {wallet?.balance?.toFixed(2) || "0,00"}
        </p>
        <button
          onClick={() => setShowDeposit(!showDeposit)}
          className="mt-4 bg-black/20 backdrop-blur-sm hover:bg-black/30 text-black font-bold px-6 py-3 rounded-full transition-all inline-flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Adicionar saldo
        </button>
      </div>

      {/* Adicionar saldo */}
      {showDeposit && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Adicionar crédito via PIX</p>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {["20", "50", "100", "200"].map((v) => (
              <button key={v} onClick={() => setDepositAmount(v)}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                  depositAmount === v
                    ? "bg-primary text-black shadow-md shadow-primary/20"
                    : "bg-gray-100 text-foreground border border-gray-200 hover:border-primary/40"
                }`}>R$ {v}</button>
            ))}
          </div>
          <button onClick={handleDeposit} disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:from-emerald-500 hover:to-primary text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] shadow-md">
            {loading ? "Gerando PIX..." : `Recarregar R$ ${depositAmount}`}
          </button>
          {error && (
            <p className="text-xs text-error text-center mt-3">{error}</p>
          )}
          <p className="text-xs text-muted text-center mt-3 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> Pagamento instantâneo. O saldo cai na hora.
          </p>
        </div>
      )}

      {/* Últimas transações */}
      <div className="flex items-center justify-between mb-3 mt-6">
        <h2 className="text-sm font-bold text-foreground">Últimas movimentações</h2>
        {transactions.length > 0 && (
          <span className="text-[10px] text-muted bg-gray-200 px-2 py-0.5 rounded-full">{transactions.length}</span>
        )}
      </div>
      {transactions.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-muted">Nenhuma movimentação ainda</p>
          <p className="text-xs text-gray-400 mt-1">Adicione saldo para começar</p>
        </div>
      )}
      {transactions.map((t: any) => (
        <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-3.5 flex justify-between items-center mb-2 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
              t.type === "deposit" ? "bg-green-100" : "bg-gray-100"
            }`}>
              {t.type === "deposit" ? "💰" : "💳"}
            </div>
            <div>
              <p className="text-sm text-foreground font-medium">
                {t.type === "deposit" ? "Depósito" : t.type === "ride_earning" ? "Corrida" : t.type}
              </p>
              <p className="text-[10px] text-muted">{new Date(t.created_at).toLocaleString("pt-BR")}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold ${t.type === "deposit" ? "text-success" : "text-foreground"}`}>
              {t.type === "deposit" ? "+" : ""}R$ {(t.amount || 0).toFixed(2)}
            </p>
            <p className="text-[10px] text-muted capitalize">{t.status === "confirmed" ? "Confirmado" : t.status}</p>
          </div>
        </div>
      ))}
    </main>
  );
}
