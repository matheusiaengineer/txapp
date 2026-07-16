"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Download, FileText, CreditCard, TrendingUp, Calendar, ArrowDown, ArrowUp, CheckCircle, AlertCircle } from "lucide-react";

const MOCK_INVOICES = [
  { id: "INV-001", period: "Junho/2026", amount: 1247.50, status: "paid", dueDate: "10/07/2026", nf: "NF-2026-001" },
  { id: "INV-002", period: "Julho/2026", amount: 1893.20, status: "pending", dueDate: "10/08/2026", nf: "" },
  { id: "INV-003", period: "Maio/2026", amount: 987.30, status: "paid", dueDate: "10/06/2026", nf: "NF-2026-0003" },
];

const MOCK_TRANSACTIONS = [
  { id: 1, desc: "Comissão TXDAPP - Período", amount: -189.32, date: "15/07", type: "fee" },
  { id: 2, desc: "Repasse entregas (12 corridas)", amount: 1893.20, date: "15/07", type: "revenue" },
  { id: 3, desc: "Plano Business - Julho", amount: -199.00, date: "10/07", type: "plan" },
  { id: 4, desc: "Repasse entregas (8 corridas)", amount: 1247.50, date: "15/06", type: "revenue" },
  { id: 5, desc: "Plano Free - Maio", amount: 0, date: "10/05", type: "plan" },
];

export default function CompanyFinancePage() {
  const [selectedTab, setSelectedTab] = useState<"overview" | "invoices" | "costs">("overview");

  const totalRevenue = MOCK_TRANSACTIONS.filter(t => t.type === "revenue").reduce((a, b) => a + b.amount, 0);
  const totalFees = MOCK_TRANSACTIONS.filter(t => t.type === "fee" || t.type === "plan").reduce((a, b) => a + Math.abs(b.amount), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-gray-400">Faturas, custos e relatórios</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          <div className="glass-panel p-4">
            <p className="text-[10px] text-gray-500 mb-1">Receita total</p>
            <p className="text-xl font-bold text-primary">R$ {totalRevenue.toFixed(2)}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-[10px] text-gray-500 mb-1">Custos</p>
            <p className="text-xl font-bold text-red-400">R$ {totalFees.toFixed(2)}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-[10px] text-gray-500 mb-1">Saldo</p>
            <p className="text-xl font-bold text-primary">R$ {(totalRevenue - totalFees).toFixed(2)}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
          {[
            { key: "overview" as const, label: "Visão Geral", icon: TrendingUp },
            { key: "invoices" as const, label: "Faturas", icon: FileText },
            { key: "costs" as const, label: "Centro de Custos", icon: Wallet },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setSelectedTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium transition-all ${
                  selectedTab === tab.key ? "bg-primary text-background" : "bg-card-bg text-gray-400 hover:text-white"
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </motion.div>

        {selectedTab === "overview" && (
          <div className="space-y-3">
            <h2 className="font-semibold">Últimas transações</h2>
            {MOCK_TRANSACTIONS.map(t => (
              <div key={t.id} className="glass-panel p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    t.amount > 0 ? "bg-primary/10" : "bg-red-500/10"
                  }`}>
                    {t.amount > 0 ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-sm">{t.desc}</p>
                    <p className="text-[10px] text-gray-500">{t.date}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${t.amount > 0 ? "text-primary" : "text-red-400"}`}>
                  {t.amount > 0 ? "+" : ""}R$ {t.amount.toFixed(2)}
                </span>
              </div>
            ))}
            <button className="w-full py-3 bg-card-bg border border-card-border rounded-xl text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-all">
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
          </div>
        )}

        {selectedTab === "invoices" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Faturas</h2>
              <button className="text-xs text-primary flex items-center gap-1"><Download className="w-3 h-3" /> Exportar tudo</button>
            </div>
            {MOCK_INVOICES.map(inv => (
              <div key={inv.id} className="glass-panel p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{inv.period}</p>
                    <p className="text-xs text-gray-500">{inv.id}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    inv.status === "paid" ? "bg-primary/15 text-primary" : "bg-yellow-400/15 text-yellow-400"
                  }`}>{inv.status === "paid" ? "Paga" : "Pendente"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-primary">R$ {inv.amount.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Vencimento: {inv.dueDate}</span>
                    {inv.nf && <button className="text-xs text-primary flex items-center gap-1"><FileText className="w-3 h-3" /> NF</button>}
                    {!inv.nf && <button className="text-xs text-gray-400 hover:text-primary"><CreditCard className="w-3 h-3" /> Pagar</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === "costs" && (
          <div className="glass-panel p-5 space-y-4">
            <h2 className="font-semibold">Centro de Custos</h2>
            <div className="space-y-3">
              {[
                { dept: "Entregas", cost: 1247.50, percent: 65 },
                { dept: "Administrativo", cost: 199.00, percent: 10 },
                { dept: "Marketing", cost: 480.00, percent: 25 },
              ].map(d => (
                <div key={d.dept}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{d.dept}</span>
                    <span className="text-primary font-semibold">R$ {d.cost.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${d.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-2 bg-card-bg border border-card-border rounded-xl text-xs text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-all">
              <Download className="w-3 h-3" /> Exportar relatório PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
