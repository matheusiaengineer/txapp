"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Wallet, CheckCircle, Loader2, ArrowLeft,
  Shield, Zap, CreditCard, PiggyBank, TrendingUp,
  Bike, Car, Truck, Star, Copy, ExternalLink, Clock,
} from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";

const DEPOSIT_OPTIONS = [
  { label: "Moto", icon: Bike, amount: 15, color: "#60a5fa" },
  { label: "Carro", icon: Car, amount: 25, color: "#3ECB8E" },
  { label: "Frete", icon: Truck, amount: 30, color: "#f59e0b" },
];

const MIN_DEPOSIT = 5;

const CUSTOM_AMOUNTS = [5, 10, 20, 50, 100];

function DepositForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get("service") || "carro";
  const { user } = useUser();
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [step, setStep] = useState<"select" | "payment" | "qr" | "confirm">("select");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ balance: number; qualified: boolean; deposited: number; requiredDeposit: number } | null>(null);
  const [balance, setBalance] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeText, setQrCodeText] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(3600);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    async function checkStatus() {
      const res = await fetch("/api/wallet/balance");
      const data = await res.json();
      setBalance(data.balance || 0);
    }
    checkStatus();
  }, []);

  useEffect(() => {
    if (step !== "qr" || !paymentId) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/deposit/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_intent_id: paymentId, service_type: serviceParam }),
        });
        const data = await res.json();
        if (data.success) {
          clearInterval(pollRef.current);
          setResult(data);
          setStep("confirm");
        }
      } catch {}
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, paymentId, serviceParam]);

  useEffect(() => {
    if (step !== "qr") return;
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const serviceInfo = DEPOSIT_OPTIONS.find(o => o.label.toLowerCase() === serviceParam) || DEPOSIT_OPTIONS[1];

  const handleCreatePix = useCallback(async () => {
    if (!user) { router.push("/login"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/deposit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedAmount,
          service_type: serviceParam,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erro ao gerar PIX"); setLoading(false); return; }
      if (data.qrCodeUrl || data.qrCode) {
        setQrCodeUrl(data.qrCodeUrl);
        setQrCodeText(data.qrCode);
        setPaymentId(data.paymentId);
        setStep("qr");
        setCountdown(3600);
      } else {
        alert("Erro ao gerar PIX. Stripe pode não estar configurado.");
      }
    } catch {
      alert("Erro ao processar pagamento");
    }
    setLoading(false);
  }, [selectedAmount, user, serviceParam, router]);

  const handleMockPay = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/freight/qualified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, amount: selectedAmount, service_type: serviceParam }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setStep("confirm");
      }
    } catch { alert("Erro ao processar depósito"); }
    setLoading(false);
  }, [selectedAmount, user, serviceParam]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

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
                <p className="text-gray-400">R$ {result.deposited.toFixed(2)} adicionados à sua carteira</p>
              </div>
              <div className="glass-panel p-6 w-full max-w-sm">
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
          ) : step === "qr" ? (
            <motion.div key="qr" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center space-y-6 py-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">Pague com PIX</h2>
                <p className="text-sm text-gray-400 mt-1">Escaneie o QR Code com seu banco</p>
              </div>

              <div className="text-3xl font-bold text-primary">R$ {selectedAmount.toFixed(2)}</div>

              {qrCodeUrl ? (
                <div className="glass-panel p-4 rounded-2xl">
                  <img src={qrCodeUrl} alt="QR Code PIX" className="w-64 h-64 mx-auto" />
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              )}

              {qrCodeText && (
                <div className="w-full max-w-sm glass-panel p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Código PIX Copia e Cola</span>
                    <button onClick={() => { navigator.clipboard.writeText(qrCodeText!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="text-primary text-xs flex items-center gap-1 hover:underline">
                      <Copy className="w-3 h-3" /> {copied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 break-all bg-background p-3 rounded-lg select-all">{qrCodeText}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Expira em {formatTime(countdown)}</span>
              </div>

              <button onClick={() => setStep("select")}
                className="w-full max-w-sm bg-card-bg border border-card-border hover:border-primary/30 text-gray-300 font-semibold py-3 rounded-xl transition-all text-sm">
                Alterar valor
              </button>
            </motion.div>
          ) : step === "payment" ? (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <h2 className="text-lg font-bold text-white">Confirmar depósito</h2>
              <div className="glass-panel p-4 text-center">
                <div className="text-4xl font-bold text-primary mb-1">R$ {selectedAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Taxa de serviço: R$ 0,00</div>
              </div>

              <div className="space-y-2">
                <button onClick={handleCreatePix} disabled={loading}
                  className="w-full glass-panel p-4 flex items-center gap-3 hover:border-primary/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm text-white">PIX</div>
                    <div className="text-xs text-gray-500">QR Code ou Copia e Cola</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </button>

                <div className="glass-panel p-4 flex items-center gap-3 opacity-50">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm text-white">Cartão de Crédito</div>
                    <div className="text-xs text-gray-500">Em breve</div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Pagamento processado pelo Stripe</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Saldo liberado automaticamente</span>
                </div>
              </div>

              <button onClick={handleMockPay} disabled={loading}
                className="w-full bg-card-bg border border-card-border hover:border-primary/30 text-gray-400 font-semibold py-3 rounded-xl transition-all text-sm">
                Simular pagamento (dev)
              </button>
            </motion.div>
          ) : (
            <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <div className="glass-panel p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${serviceInfo.color}20` }}>
                  <serviceInfo.icon className="w-6 h-6" style={{ color: serviceInfo.color }} />
                </div>
                <div>
                  <div className="font-bold text-white">Serviço: {serviceInfo.label}</div>
                  <div className="text-sm text-gray-400">Depósito mínimo: R$ {serviceInfo.amount},00</div>
                </div>
              </div>

              {balance > 0 && (
                <div className="glass-panel p-4 flex items-center justify-between">
                  <span className="text-sm text-gray-400">Seu saldo atual</span>
                  <span className="text-lg font-bold text-primary">R$ {balance.toFixed(2)}</span>
                </div>
              )}

              <h2 className="text-lg font-bold text-white mt-4">Escolha o valor</h2>
              <div className="grid grid-cols-3 gap-3">
                {DEPOSIT_OPTIONS.map(opt => (
                  <button key={opt.label} onClick={() => { setSelectedAmount(opt.amount); }}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      selectedAmount === opt.amount
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(62,203,142,0.1)]"
                        : "border-card-border bg-card-bg hover:border-white/20"
                    }`}>
                    <opt.icon className="w-6 h-6 mx-auto mb-2" style={{ color: opt.color }} />
                    <div className="font-semibold text-sm text-white">{opt.label}</div>
                    <div className="text-primary font-bold mt-1">R$ {opt.amount}</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {CUSTOM_AMOUNTS.map(a => (
                  <button key={a} onClick={() => setSelectedAmount(a)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                      selectedAmount === a && !DEPOSIT_OPTIONS.find(o => o.amount === a)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-card-border bg-card-bg text-gray-400 hover:border-white/20"
                    }`}>
                    R$ {a}
                  </button>
                ))}
                <input type="number" min={MIN_DEPOSIT} placeholder="Outro"
                  onChange={e => { const v = parseFloat(e.target.value); if (v >= MIN_DEPOSIT) setSelectedAmount(v); }}
                  className="w-20 px-3 py-2 rounded-xl border border-card-border bg-card-bg text-white text-sm text-center focus:outline-none focus:border-primary/50" />
              </div>

              <div className="glass-panel p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <PiggyBank className="w-4 h-4 text-primary" />
                  <span>Depósito mínimo de R$ {MIN_DEPOSIT}. O valor cai na sua carteira e pode ser usado em qualquer corrida</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Quanto mais saldo, mais opções de motoristas com preços variados</span>
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
