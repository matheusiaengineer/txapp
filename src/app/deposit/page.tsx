"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Wallet, CheckCircle, Loader2, ArrowLeft,
  Shield, Zap, CreditCard, PiggyBank, TrendingUp,
  Bike, Car, Truck, Star,
} from "lucide-react";

const DEPOSIT_OPTIONS = [
  { label: "Moto", icon: Bike, amount: 15, color: "#60a5fa" },
  { label: "Carro", icon: Car, amount: 25, color: "#3ECB8E" },
  { label: "Frete", icon: Truck, amount: 30, color: "#f59e0b" },
];

const PIX_LABELS = [
  { label: "PIX Copia e Cola", desc: "Transfira automaticamente" },
  { label: "PIX QR Code", desc: "Leia com seu banco" },
  { label: "Cartão de Crédito", desc: "Débito ou crédito" },
];

function DepositForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get("service") || "carro";
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [step, setStep] = useState<"select" | "payment" | "confirm">("select");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ balance: number; qualified: boolean } | null>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    async function checkStatus() {
      const res = await fetch(`/api/freight/qualified?service=${serviceParam}`);
      const data = await res.json();
      setBalance(data.balance || 0);
    }
    checkStatus();
  }, [serviceParam]);

  const serviceInfo = DEPOSIT_OPTIONS.find(o => o.label.toLowerCase() === serviceParam) || DEPOSIT_OPTIONS[1];

  const handleDeposit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/freight/qualified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "anon",
          amount: selectedAmount,
          service_type: serviceParam,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setStep("confirm");
      }
    } catch {
      alert("Erro ao processar depósito");
    }
    setLoading(false);
  }, [selectedAmount, serviceParam]);

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-card-border px-5 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => step === "select" ? router.back() : setStep("select")}>
            <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white transition" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-white text-lg">Depósito</h1>
            <p className="text-xs text-gray-500">Torne-se um cliente qualificado</p>
          </div>
          <Wallet className="w-6 h-6 text-primary" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {step === "confirm" && result ? (
            <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Depósito confirmado!</h2>
                <p className="text-gray-400">R$ {selectedAmount.toFixed(2)} adicionados à sua carteira</p>
              </div>
              <div className="txd-card p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Saldo atual</span>
                  <span className="text-white font-bold text-xl">R$ {result.balance.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    result.qualified ? "bg-primary/10 text-primary" : "bg-yellow-400/10 text-yellow-400"
                  }`}>
                    {result.qualified ? "Cliente qualificado" : "Depósito insuficiente"}
                  </span>
                  {result.qualified && <Star className="w-4 h-4 text-primary" />}
                </div>
              </div>
              <button onClick={() => router.push("/")}
                className="w-full max-w-sm bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all">
                Ir para o início
              </button>
            </motion.div>
          ) : step === "payment" ? (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <h2 className="text-lg font-bold text-white">Confirmar depósito</h2>
              <div className="txd-card p-4 text-center">
                <div className="text-4xl font-bold txd-gradient-text mb-1">R$ {selectedAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Taxa de serviço: R$ 0,00</div>
              </div>

              <div className="space-y-2">
                {PIX_LABELS.map((p, i) => (
                  <div key={i} className="txd-card p-4 flex items-center gap-3 hover:border-primary/30 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-white">{p.label}</div>
                      <div className="text-xs text-gray-500">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="txd-card p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Seu pagamento é 100% seguro</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Saldo liberado na hora</span>
                </div>
              </div>

              <button onClick={handleDeposit} disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</> : `Depositar R$ ${selectedAmount.toFixed(2)}`}
              </button>
            </motion.div>
          ) : (
            <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <div className="txd-card p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${serviceInfo.color}20` }}>
                  <serviceInfo.icon className="w-6 h-6" style={{ color: serviceInfo.color }} />
                </div>
                <div>
                  <div className="font-bold text-white">Serviço: {serviceInfo.label}</div>
                  <div className="text-sm text-gray-400">Depósito mínimo: R$ {serviceInfo.amount},00</div>
                </div>
              </div>

              {balance > 0 && (
                <div className="txd-card p-4 flex items-center justify-between">
                  <span className="text-sm text-gray-400">Seu saldo atual</span>
                  <span className="text-lg font-bold text-primary">R$ {balance.toFixed(2)}</span>
                </div>
              )}

              <h2 className="text-lg font-bold text-white mt-4">Escolha o valor</h2>
              <div className="grid grid-cols-3 gap-3">
                {DEPOSIT_OPTIONS.map(opt => (
                  <button key={opt.label} onClick={() => { setSelectedAmount(opt.amount); setShowCustom(false); }}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      selectedAmount === opt.amount && !showCustom
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(62,203,142,0.1)]"
                        : "border-card-border bg-card-bg hover:border-white/20"
                    }`}>
                    <opt.icon className="w-6 h-6 mx-auto mb-2" style={{ color: opt.color }} />
                    <div className="font-semibold text-sm text-white">{opt.label}</div>
                    <div className="text-primary font-bold mt-1">R$ {opt.amount}</div>
                  </button>
                ))}
              </div>

              <button onClick={() => setShowCustom(!showCustom)}
                className="w-full py-3 rounded-xl border border-dashed border-card-border text-sm text-gray-400 hover:text-white hover:border-primary/50 transition">
                {showCustom ? "Ocultar" : "Outro valor"}
              </button>

              <AnimatePresence>
                {showCustom && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                        placeholder="Digite o valor"
                        className="w-full bg-card-bg border border-card-border rounded-xl py-3.5 pl-12 pr-4 text-white text-lg font-bold outline-none focus:border-primary/50 transition"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="txd-card p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <PiggyBank className="w-4 h-4 text-primary" />
                  <span>Depósito mínimo de R$ 15 (moto), R$ 25 (carro) ou R$ 30 (frete)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Clientes qualificados aparecem primeiro para os motoristas</span>
                </div>
              </div>

              <button onClick={() => setStep("payment")}
                className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                <Wallet className="w-5 h-5" /> Depositar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function DepositPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
      <DepositForm />
    </Suspense>
  );
}
