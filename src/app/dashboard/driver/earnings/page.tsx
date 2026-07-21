"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import Link from "next/link";

export default function DriverEarningsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      const { data: t } = await supabase.from("transactions").select("*")
        .eq("motorista_id", data.user.id).eq("status", "pago")
        .order("criada_em", { ascending: false }).limit(20);
      setTransactions(t || []);
      setTotal((t || []).reduce((acc: number, tx: any) => acc + (tx.valor_motorista || 0), 0));
    });
  }, []);

  return (
    <main className="min-h-[100dvh] bg-background p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <Link href="/dashboard/driver" className="text-gray-400 text-sm mb-4 inline-block">← Voltar</Link>
      <h1 className="text-2xl font-bold text-white mb-6">Ganhos</h1>
      <div className="txd-card p-6 text-center mb-6">
        <p className="text-sm text-gray-400">Total recebido</p>
        <p className="text-4xl font-bold text-primary">R$ {total.toFixed(2)}</p>
      </div>
      <h2 className="text-sm font-semibold text-white mb-3">Histórico</h2>
      {transactions.length === 0 && <p className="text-sm text-gray-500">Nenhum ganho ainda</p>}
      {transactions.map((tx: any) => (
        <div key={tx.id} className="txd-card p-3 flex justify-between items-center mb-2">
          <div>
            <p className="text-sm text-white">R$ {tx.valor_motorista?.toFixed(2)}</p>
            <p className="text-xs text-gray-400">{tx.metodo}</p>
          </div>
          <span className="text-xs text-gray-500">{new Date(tx.criada_em).toLocaleDateString()}</span>
        </div>
      ))}
    </main>
  );
}
