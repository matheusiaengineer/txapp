"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import Link from "next/link";

export default function DriverWalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      const { data: w } = await supabase.from("wallet").select("*").eq("user_id", data.user.id).single();
      setWallet(w);
      const { data: t } = await supabase.from("transactions").select("*")
        .eq("motorista_id", data.user.id).order("criada_em", { ascending: false }).limit(10);
      setTransactions(t || []);
    });
  }, []);

  return (
    <main className="min-h-[100dvh] bg-background p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <Link href="/dashboard/driver" className="text-gray-400 text-sm mb-4 inline-block">← Voltar</Link>
      <h1 className="text-2xl font-bold text-white mb-6">Carteira</h1>
      <div className="txd-card p-6 text-center mb-6">
        <p className="text-sm text-gray-400">Saldo disponível</p>
        <p className="text-4xl font-bold text-primary">R$ {wallet?.saldo?.toFixed(2) || "0,00"}</p>
      </div>
      <h2 className="text-sm font-semibold text-white mb-3">Transações</h2>
      {transactions.length === 0 && <p className="text-sm text-gray-500">Nenhuma transação</p>}
      {transactions.map((t: any) => (
        <div key={t.id} className="txd-card p-3 flex justify-between items-center mb-2">
          <div>
            <p className="text-sm text-white">R$ {t.valor_motorista?.toFixed(2)}</p>
            <p className="text-xs text-gray-400">{t.status}</p>
          </div>
          <span className="text-xs text-gray-500">{new Date(t.criada_em).toLocaleDateString()}</span>
        </div>
      ))}
    </main>
  );
}
