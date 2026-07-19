"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SkeletonList } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Plus, CreditCard, Smartphone, Ticket, Gift,
  ArrowUpRight, ArrowDownLeft, Trash2, Star, ChevronRight,
  Coins, Copy, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle,
} from "lucide-react";

interface Transaction {
  id: string;
  type: "payment" | "refund" | "topup" | "bonus";
  description: string;
  date: string;
  amount: string;
  positive: boolean;
}

interface PaymentMethod {
  id: string;
  type: "credit" | "debit" | "pix";
  name: string;
  lastFour?: string;
  isDefault: boolean;
}

const transactions: Transaction[] = [
  { id: "1", type: "payment", description: "TXD Pop • Av. Paulista → Shopping", date: "12 jul, 14:30", amount: "R$ 24,90", positive: false },
  { id: "2", type: "topup", description: "Adição de fundos • PIX", date: "11 jul, 10:00", amount: "R$ 100,00", positive: true },
  { id: "3", type: "payment", description: "TXD Comfort • Casa → Aeroporto", date: "10 jul, 08:15", amount: "R$ 89,50", positive: false },
  { id: "4", type: "bonus", description: "Bônus de indicação", date: "09 jul, 12:00", amount: "R$ 20,00", positive: true },
  { id: "5", type: "refund", description: "Reembolso • Viagem cancelada", date: "08 jul, 20:05", amount: "R$ 18,30", positive: true },
  { id: "6", type: "payment", description: "TXD Pop • Academia → Casa", date: "06 jul, 19:45", amount: "R$ 14,20", positive: false },
];

const paymentMethods: PaymentMethod[] = [
  { id: "1", type: "credit", name: "Visa •••• 4532", lastFour: "4532", isDefault: true },
  { id: "2", type: "pix", name: "PIX • chave@email.com", isDefault: false },
  { id: "3", type: "debit", name: "Mastercard •••• 8910", lastFour: "8910", isDefault: false },
];

function getTransactionIcon(type: string) {
  switch (type) {
    case "payment": return ArrowUpRight;
    case "refund": return ArrowDownLeft;
    case "topup": return Plus;
    case "bonus": return Gift;
    default: return ArrowUpRight;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "payment": return "text-red-400";
    case "refund": return "text-green-400";
    case "topup": return "text-blue-400";
    case "bonus": return "text-yellow-400";
    default: return "text-gray-400";
  }
}

function getTypeBg(type: string) {
  switch (type) {
    case "payment": return "bg-red-400/15";
    case "refund": return "bg-green-400/15";
    case "topup": return "bg-blue-400/15";
    case "bonus": return "bg-yellow-400/15";
    default: return "bg-white/5";
  }
}

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponActive, setCouponActive] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [favoriteCard, setFavoriteCard] = useState("1");

  useEffect(() => { setTimeout(() => setLoading(false), 800); }, []);
  if (loading) return <div className="min-h-[100dvh] bg-background text-foreground p-4 sm:p-6 lg:p-8" style={{paddingBottom:"calc(1.5rem + env(safe-area-inset-bottom,0px))"}}><SkeletonList count={5} /></div>;

  const handleCopyPix = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setTimeout(() => {
      if (couponCode.toUpperCase() === "TXDNEW") {
        setCouponActive(true);
        setCouponError("");
      } else {
        setCouponError("Cupom inválido");
        setCouponActive(false);
      }
      setCouponLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold">Carteira</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie seus pagamentos</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Expiring bonus alert (#44) */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
              <p className="text-sm text-yellow-400/90">Você tem <strong>R$ 10,00</strong> em bônus expirando em <strong>2 dias</strong></p>
            </motion.div>

            {/* Balance Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="w-5 h-5 text-primary" />
                  <span className="text-sm text-gray-400">Saldo TXD Wallet</span>
                  <button onClick={() => setPrivacyMode(!privacyMode)} className="ml-auto text-gray-500 hover:text-white transition">
                    {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-4xl sm:text-5xl font-bold mb-1">
                  {privacyMode ? "R$ *****" : "R$ 47,30"}
                </p>
                {/* Split balance (#42) */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span>{privacyMode ? "*****" : "R$ 37,30"} Disponível</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                  <span className="text-yellow-400">{privacyMode ? "*****" : "R$ 10,00"} Bônus</span>
                </div>
                <div className="flex gap-3">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 bg-primary text-background font-semibold px-5 py-2.5 rounded-full text-sm">
                    <Plus className="w-4 h-4" /> Adicionar fundos
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 glass-panel text-sm font-medium px-5 py-2.5 rounded-full">
                    <ArrowDownLeft className="w-4 h-4" /> Transferir
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Transações recentes</h2>
                {/* Period filter tabs */}
                <div className="flex gap-1 bg-background rounded-xl p-1">
                  {["7d", "30d", "3m"].map((p) => (
                    <button key={p} className="text-[11px] px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
                      {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "3 meses"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const Icon = getTransactionIcon(tx.type);
                  return (
                    <motion.div key={tx.id} whileHover={{ scale: 1.01, x: 2 }}
                      className="glass-panel p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${getTypeBg(tx.type)} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${getTypeColor(tx.type)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <p className="text-xs text-gray-500">{tx.date}</p>
                      </div>
                      <span className={`text-sm font-semibold shrink-0 ${tx.positive ? "text-green-400" : "text-red-400"}`}>
                        {tx.positive ? "+" : "-"}{tx.amount}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              {/* Load more */}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full mt-3 glass-panel text-center py-3 rounded-xl text-sm text-gray-400 hover:text-white transition">
                Carregar mais transações
              </motion.button>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Formas de pagamento</h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddCard(!showAddCard)}
                  className="text-xs text-primary flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </motion.button>
              </div>
              <div className="space-y-2">
                {paymentMethods.map((pm) => (
                  <motion.div key={pm.id} whileHover={{ scale: 1.01 }}
                    className={`glass-panel p-4 flex items-center gap-3 ${pm.isDefault ? "border-primary/30" : ""}`}>
                    <button onClick={() => setFavoriteCard(pm.id)} className="shrink-0">
                      <Star className={`w-4 h-4 ${favoriteCard === pm.id ? "text-yellow-400 fill-yellow-400" : "text-gray-600 hover:text-gray-400"} transition-colors`} />
                    </button>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pm.type === "pix" ? "bg-green-400/15" : "bg-blue-400/15"}`}>
                      {pm.type === "pix" ? <Smartphone className="w-5 h-5 text-green-400" /> : <CreditCard className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{pm.name}</p>
                      <p className="text-xs text-gray-500">
                        {favoriteCard === pm.id ? "Padrão" : pm.type === "pix" ? "Chave PIX" : "Crédito"}
                      </p>
                    </div>
                    {deleteConfirm === pm.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDeleteConfirm(null)} className="text-[10px] text-gray-400 hover:text-white px-2 py-1">Cancelar</button>
                        <button onClick={() => { setDeleteConfirm(null); }} className="text-[10px] text-red-400 font-bold px-2 py-1">Confirmar</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(pm.id)} className="shrink-0">
                        <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400 transition-colors" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Add Card Form */}
            <AnimatePresence>
              {showAddCard && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-panel p-5 space-y-4">
                    <h3 className="font-semibold text-sm">Adicionar cartão</h3>
                    <input
                      type="text"
                      placeholder="Número do cartão"
                      className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Validade (MM/AA)"
                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Nome no cartão"
                      className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-primary text-background font-semibold py-3 rounded-xl text-sm"
                    >
                      Salvar cartão
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Coupon */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-panel p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" /> Cupom de desconto
              </h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Insira o código" value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())} /* #41 auto-uppercase */
                  className="flex-1 bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 uppercase outline-none focus:border-primary/50 transition-colors" />
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleApplyCoupon} disabled={couponLoading}
                  className="bg-primary text-background text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-1">
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Aplicar
                </motion.button>
              </div>
              {couponActive && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-primary bg-primary/10 rounded-lg px-3 py-1.5">
                  <CheckCircle className="w-3 h-3" /> Cupom ativo — 10% OFF na próxima corrida
                </div>
              )}
              {couponError && (
                <div className="mt-2 text-xs text-red-400">{couponError}</div>
              )}
            </motion.div>

            {/* PIX */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-panel p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Copy className="w-4 h-4 text-primary" /> Sua chave PIX
              </h3>
              <div className="bg-background border border-card-border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer"
                onClick={handleCopyPix}>
                <span className="text-sm font-mono">ana.oliveira@email.com</span>
                <motion.span key={copied ? "copied" : "copy"} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  className={`text-xs ${copied ? "text-primary font-bold" : "text-gray-400"}`}>
                  {copied ? "Copiado! ✓" : "Copiar"}
                </motion.span>
              </div>
            </motion.div>

            {/* Loyalty Points */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/15 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Pontos TXD</h3>
                  <p className="text-xs text-gray-500">Programa de fidelidade</p>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-yellow-400">1.280</p>
                <span className="text-xs text-gray-500">= R$ 12,80 em créditos</span>
              </div>
              <div className="mt-3 bg-background border border-card-border rounded-full h-2 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "42%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-yellow-400 h-full rounded-full" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Faltam 1.720 pts para o próximo nível</p>
              {/* Conditional redeem (#45) */}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="w-full mt-3 bg-yellow-400/15 text-yellow-400 font-semibold py-2.5 rounded-xl text-sm border border-yellow-400/20 hover:bg-yellow-400/25 transition">
                Converter em Reais
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
