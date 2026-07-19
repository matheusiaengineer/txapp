"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Plus, CreditCard, Smartphone, Ticket, Gift,
  ArrowUpRight, ArrowDownLeft, Trash2, Star, ChevronRight,
  Coins, Copy, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle,
} from "lucide-react";
import { useWalletStore } from "@/lib/store/wallet-store";
import { formatCurrency, centavosToReais } from "@/lib/utils/financial";
import { DepositModal } from "@/components/wallet/deposit-modal";
import { createClient } from "@/lib/supabase/browser";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getTransactionIcon(type: string) {
  switch (type) {
    case "payment": return ArrowUpRight;
    case "refund": return ArrowDownLeft;
    case "deposit": return Plus;
    case "bonus": return Gift;
    default: return ArrowUpRight;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "payment": return "text-red-400";
    case "refund": return "text-green-400";
    case "deposit": return "text-blue-400";
    case "bonus": return "text-yellow-400";
    default: return "text-gray-400";
  }
}

function getTypeBg(type: string) {
  switch (type) {
    case "payment": return "bg-red-400/15";
    case "refund": return "bg-green-400/15";
    case "deposit": return "bg-blue-400/15";
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
  const [showDeposit, setShowDeposit] = useState(false);
  const [realTransactions, setRealTransactions] = useState<any[]>([]);
  const [pixKey, setPixKey] = useState("");

  const { realBalance, promotionalBalance, initializeWallet } = useWalletStore();
  const balance = realBalance + promotionalBalance;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      await initializeWallet(user.id);
      try {
        const [txRes, profileRes] = await Promise.all([
          fetch("/api/wallet/transactions?limit=50"),
          supabase.from("profiles").select("email, phone").eq("id", user.id).single(),
        ]);
        if (txRes.ok) {
          const txData = await txRes.json();
          setRealTransactions(txData.transactions || []);
        }
        if (profileRes.data) {
          setPixKey(profileRes.data.email || profileRes.data.phone || "chave@txd.app");
        }
      } catch {} finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading) return <div className="min-h-[100dvh] bg-background text-foreground p-4 sm:p-6 lg:p-8" style={{paddingBottom:"calc(1.5rem + env(safe-area-inset-bottom,0px))"}}><div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="glass-panel p-4 animate-pulse"><div className="h-4 bg-white/10 rounded w-3/4 mb-2"/><div className="h-3 bg-white/5 rounded w-1/2"/></div>)}</div></div>;

  const handleCopyPix = () => {
    navigator.clipboard?.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.toUpperCase() }),
      });
      if (res.ok) {
        setCouponActive(true);
      } else {
        const err = await res.json();
        setCouponError(err.error || "Cupom inválido");
        setCouponActive(false);
      }
    } catch {
      setCouponError("Erro ao validar cupom");
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Carteira</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie seus pagamentos</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {promotionalBalance > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
                <p className="text-sm text-yellow-400/90">Você tem <strong>{formatCurrency(promotionalBalance)}</strong> em bônus disponíveis</p>
              </motion.div>
            )}

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
                  {privacyMode ? "R$ *****" : formatCurrency(balance)}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span>{privacyMode ? "*****" : formatCurrency(realBalance)} Disponível</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                  <span className="text-yellow-400">{privacyMode ? "*****" : formatCurrency(promotionalBalance)} Bônus</span>
                </div>
                <div className="flex gap-3">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowDeposit(true)}
                    className="flex items-center gap-2 bg-primary text-background font-semibold px-5 py-2.5 rounded-full text-sm">
                    <Plus className="w-4 h-4" /> Adicionar fundos
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Transações recentes</h2>
              </div>
              <div className="space-y-2">
                {realTransactions.length === 0 && (
                  <div className="glass-panel p-8 text-center">
                    <Coins className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Nenhuma transação ainda</p>
                  </div>
                )}
                {realTransactions.map((tx: any) => {
                  const Icon = getTransactionIcon(tx.type);
                  const isPositive = tx.type === "deposit" || tx.type === "refund" || tx.type === "bonus";
                  return (
                    <motion.div key={tx.id} whileHover={{ scale: 1.01, x: 2 }}
                      className="glass-panel p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${getTypeBg(tx.type)} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${getTypeColor(tx.type)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                        <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                      </div>
                      <span className={`text-sm font-semibold shrink-0 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                        {isPositive ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Formas de pagamento</h2>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddCard(!showAddCard)}
                  className="text-xs text-primary flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar
                </motion.button>
              </div>
              <div className="space-y-2">
                {[
                  { id: "pix", type: "pix", name: `PIX • ${pixKey?.split("@")[0] || "chave"}`, isDefault: true },
                ].map((pm) => (
                  <motion.div key={pm.id} whileHover={{ scale: 1.01 }}
                    className={`glass-panel p-4 flex items-center gap-3 ${pm.isDefault ? "border-primary/30" : ""}`}>
                    <button onClick={() => setFavoriteCard(pm.id)} className="shrink-0">
                      <Star className={`w-4 h-4 ${favoriteCard === pm.id ? "text-yellow-400 fill-yellow-400" : "text-gray-600 hover:text-gray-400"} transition-colors`} />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-green-400/15 flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{pm.name}</p>
                      <p className="text-xs text-gray-500">{favoriteCard === pm.id ? "Padrão" : "Chave PIX"}</p>
                    </div>
                    {deleteConfirm === pm.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDeleteConfirm(null)} className="text-[10px] text-gray-400 hover:text-white px-2 py-1">Cancelar</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-[10px] text-red-400 font-bold px-2 py-1">Confirmar</button>
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

            <AnimatePresence>
              {showAddCard && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="glass-panel p-5 space-y-4">
                    <h3 className="font-semibold text-sm">Adicionar cartão</h3>
                    <input type="text" placeholder="Número do cartão"
                      className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Validade (MM/AA)"
                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors" />
                      <input type="text" placeholder="CVV"
                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors" />
                    </div>
                    <input type="text" placeholder="Nome no cartão"
                      className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors" />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full bg-primary text-background font-semibold py-3 rounded-xl text-sm">Salvar cartão</motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-panel p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" /> Cupom de desconto
              </h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Insira o código" value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
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
              {couponError && <div className="mt-2 text-xs text-red-400">{couponError}</div>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-panel p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Copy className="w-4 h-4 text-primary" /> Sua chave PIX
              </h3>
              <div className="bg-background border border-card-border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer" onClick={handleCopyPix}>
                <span className="text-sm font-mono">{pixKey}</span>
                <motion.span key={copied ? "copied" : "copy"} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  className={`text-xs ${copied ? "text-primary font-bold" : "text-gray-400"}`}>
                  {copied ? "Copiado! ✓" : "Copiar"}
                </motion.span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <DepositModal open={showDeposit} onClose={() => setShowDeposit(false)}
        onSuccess={() => { const sb = createClient(); sb.auth.getUser().then(({data: {user: walletUser}}) => { if (walletUser) useWalletStore.getState().initializeWallet(walletUser.id); }); }} />
    </div>
  );
}
