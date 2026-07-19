"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, Download, FileText, TrendingUp, ArrowDown, ArrowUp } from "lucide-react";

export default function CompanyFinancePage() {
  const [selectedTab, setSelectedTab] = useState<"overview" | "invoices">("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/company/finance").then(r => r.ok ? r.json() : null).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-[100dvh] bg-background text-foreground p-4 sm:p-6 lg:p-8" style={{paddingBottom:"calc(1.5rem + env(safe-area-inset-bottom,0px))"}}>
      <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="glass-panel p-4 animate-pulse"><div className="h-4 bg-white/10 rounded w-3/4 mb-2"/><div className="h-3 bg-white/5 rounded w-1/2"/></div>)}</div>
    </div>
  );

  const totalRevenue = data?.overview?.totalRevenue || 0;
  const totalFees = data?.overview?.platformFees || 0;
  const netRevenue = data?.overview?.netRevenue || 0;
  const transactions = data?.transactions || [];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-gray-400">Faturas, custos e relatórios</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          <div className="glass-panel p-4">
            <p className="text-xs text-gray-500 mb-1">Receita total</p>
            <p className="text-xl font-bold text-primary">R$ {totalRevenue.toFixed(2)}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs text-gray-500 mb-1">Custos (10% comissão)</p>
            <p className="text-xl font-bold text-red-400">R$ {totalFees.toFixed(2)}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs text-gray-500 mb-1">Saldo líquido</p>
            <p className="text-xl font-bold text-primary">R$ {netRevenue.toFixed(2)}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
          {[
            { key: "overview" as const, label: "Visão Geral", icon: TrendingUp },
            { key: "invoices" as const, label: "Transações", icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setSelectedTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium transition-all ${
                  selectedTab === tab.key ? "bg-primary text-background" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </motion.div>

        <>
          {selectedTab === "overview" && (
            <div className="space-y-3">
              <h2 className="font-semibold">Resumo do período</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-panel p-4">
                  <p className="text-xs text-gray-500">Corridas neste mês</p>
                  <p className="text-xl font-bold">{data?.overview?.monthTrips || 0}</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-xs text-gray-500">Receita no mês</p>
                  <p className="text-xl font-bold text-primary">R$ {(data?.overview?.monthRevenue || 0).toFixed(2)}</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-xs text-gray-500">Total de corridas</p>
                  <p className="text-xl font-bold">{data?.overview?.totalTrips || 0}</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-xs text-gray-500">Ticket médio</p>
                  <p className="text-xl font-bold text-primary">R$ {(data?.overview?.totalTrips ? (totalRevenue / data.overview.totalTrips).toFixed(2) : "0,00")}</p>
                </div>
              </div>

              <h2 className="font-semibold mt-4">Últimas transações</h2>
              {transactions.length === 0 && (
                <div className="glass-panel p-8 text-center text-sm text-gray-500">Nenhuma transação encontrada</div>
              )}
              {transactions.map((t: any) => (
                <div key={t.id} className="glass-panel p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.type === 'payment' || t.type === 'deposit' ? 'bg-primary/10' : 'bg-red-500/10'}`}>
                      {t.type === 'payment' || t.type === 'deposit' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-sm">{t.description || t.type}</p>
                      <p className="text-xs text-gray-500">{t.date}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${t.type === 'deposit' || t.type === 'refund' ? 'text-primary' : 'text-red-400'}`}>
                    {t.type === 'deposit' || t.type === 'refund' ? '+' : '-'}R$ {(t.amount || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {selectedTab === "invoices" && (
            <div className="space-y-3">
              <h2 className="font-semibold">Histórico de transações</h2>
              {transactions.length === 0 && (
                <div className="glass-panel p-8 text-center text-sm text-gray-500">Nenhuma transação registrada</div>
              )}
              {transactions.map((tx: any) => (
                <div key={tx.id} className="glass-panel p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{tx.description || tx.type}</p>
                      <p className="text-xs text-gray-500">{tx.date}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      tx.status === "confirmed" ? "bg-primary/15 text-primary" : tx.status === "pending" ? "bg-yellow-400/15 text-yellow-400" : "bg-red-400/15 text-red-400"
                    }`}>{tx.status === "confirmed" ? "Confirmada" : tx.status === "pending" ? "Pendente" : "Falhou"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-primary">R$ {(tx.amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      </div>
    </div>
  );
}
