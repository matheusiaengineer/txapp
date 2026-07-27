"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import Link from "next/link";

export default function PassengerWalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <Link href="/dashboard/passenger" className="text-muted text-sm mb-5 inline-block hover:text-foreground transition-colors">← Voltar</Link>
      <h1 className="text-2xl font-bold text-foreground mb-6">Carteira</h1>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center mb-6 shadow-sm">
        <p className="text-sm text-muted">Saldo disponível</p>
        <p className="text-4xl font-bold text-primary mt-1">
          R$ {wallet?.balance?.toFixed(2) || "0,00"}
        </p>
        <button
          onClick={() => document.getElementById("recarga")?.scrollIntoView({ behavior: "smooth" })}
          className="mt-4 bg-primary hover:bg-primary-hover text-white font-bold px-8 py-3 rounded-full transition-all"
        >
          Recarregar
        </button>
      </div>

      <div id="recarga" className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
        <p className="text-sm text-foreground font-medium mb-3">Adicionar crédito via PIX</p>
        <div className="flex gap-2 mb-3">
          {["20", "50", "100", "200"].map((v) => (
            <button key={v} onClick={() => setDepositAmount(v)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                depositAmount === v
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-foreground border border-gray-200 hover:border-primary/40"
              }`}>R$ {v}</button>
          ))}
        </div>
        {error && (
          <p className="text-xs text-error mb-2">{error}</p>
        )}
        <button onClick={handleDeposit} disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50">
          {loading ? "Gerando PIX..." : `Recarregar R$ ${depositAmount} via PIX`}
        </button>
        <p className="text-xs text-muted text-center mt-2">Pagamento instantâneo. O saldo cai na hora.</p>
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Últimas transações</h2>
      {transactions.length === 0 && (
        <p className="text-sm text-muted py-8 text-center">Nenhuma transação ainda</p>
      )}
      {transactions.map((t: any) => (
        <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center mb-2 shadow-sm">
          <div>
            <p className="text-sm text-foreground font-medium">
              {t.type === "deposit" ? "+" : ""}R$ {(t.amount || 0).toFixed(2)}
            </p>
            <p className="text-xs text-muted capitalize">{t.description || t.status}</p>
          </div>
          <span className="text-xs text-muted">{new Date(t.created_at).toLocaleDateString()}</span>
        </div>
      ))}
    </main>
  );
}
