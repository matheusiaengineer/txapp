"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, AlertTriangle, Clock, Copy } from "lucide-react";
import { depositService, type DepositState } from "@/lib/services/deposit-service";
import { formatCurrency } from "@/lib/utils/financial";
import { formatTimer } from "@/lib/utils/helpers";

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_AMOUNTS = [10, 20, 50, 100];

export function DepositModal({ open, onClose, onSuccess }: DepositModalProps) {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [depositState, setDepositState] = useState<DepositState>({
    step: "idle", transactionId: null, amount: 0,
    pixCode: null, expiresAt: null, timeRemaining: 0,
  });
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const unsub = depositService.onStateChangeCallback((state) => {
      setDepositState(state);
      if (state.step === "confirmed") {
        setTimeout(() => { onSuccess(); onClose(); }, 1500);
      }
    });
    return () => { unsub(); depositService.cleanup(); };
  }, [open, onSuccess, onClose]);

  const getAmount = () => {
    if (customAmount) return parseFloat(customAmount.replace(",", "."));
    if (selectedPreset) return selectedPreset;
    return 0;
  };

  const handleRequestDeposit = useCallback(async () => {
    const amount = getAmount();
    if (amount < 10) { setError("Valor mínimo: R$ 10,00"); return; }
    setError("");
    try {
      await depositService.requestDeposit(amount);
    } catch (e: any) {
      setError(e.message || "Erro ao criar depósito");
    }
  }, [customAmount, selectedPreset]);

  const handleCancel = useCallback(async () => {
    await depositService.cancelDeposit();
    setDepositState({ step: "idle", transactionId: null, amount: 0, pixCode: null, expiresAt: null, timeRemaining: 0 });
  }, []);

  const handleCopyPix = async () => {
    if (!depositState.pixCode) return;
    try {
      await navigator.clipboard.writeText(depositState.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = depositState.pixCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && depositState.step !== "awaiting_pix") onClose(); }}>
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Adicionar fundos</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* States */}
            {depositState.step === "confirmed" && (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <p className="font-semibold text-primary">Depósito confirmado!</p>
                <p className="text-sm text-gray-400">{formatCurrency(depositState.amount)} adicionados à sua carteira</p>
              </div>
            )}

            {depositState.step === "expired" && (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-red-400/15 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <p className="font-semibold text-red-400">PIX expirado</p>
                <p className="text-sm text-gray-400">O código PIX expirou. Solicite um novo depósito.</p>
                <button onClick={handleCancel}
                  className="bg-primary text-background font-bold px-6 py-2.5 rounded-xl text-sm">
                  Novo depósito
                </button>
              </div>
            )}

            {depositState.step === "awaiting_pix" && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Valor do depósito</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(depositState.amount)}</p>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className={depositState.timeRemaining < 60 ? "text-red-400 font-bold" : "text-yellow-400"}>
                    {formatTimer(depositState.timeRemaining)}
                  </span>
                </div>

                {/* PIX Code */}
                <div className="glass-panel p-4 space-y-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Código PIX Copia e Cola</p>
                  <div className="bg-background border border-card-border rounded-xl p-3 text-xs font-mono text-gray-300 break-all max-h-20 overflow-y-auto">
                    {depositState.pixCode}
                  </div>
                  <button onClick={handleCopyPix}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-background font-semibold py-2.5 rounded-xl text-sm">
                    <Copy className="w-4 h-4" />
                    {copied ? "Copiado!" : "Copiar código PIX"}
                  </button>
                </div>

                <p className="text-xs text-gray-600 text-center">
                  Após o pagamento, o saldo será atualizado automaticamente
                </p>

                <button onClick={handleCancel}
                  className="w-full text-sm text-gray-500 hover:text-white transition-colors">
                  Cancelar depósito
                </button>
              </div>
            )}

            {depositState.step === "idle" && (
              <>
                {/* Preset amounts */}
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((a) => (
                    <button key={a} onClick={() => { setSelectedPreset(a); setCustomAmount(""); }}
                      className={`py-3 rounded-xl text-sm font-semibold transition border ${
                        selectedPreset === a
                          ? "bg-primary text-background border-primary"
                          : "bg-white/5 text-gray-300 border-white/10 hover:border-primary/30"
                      }`}>
                      R$ {a}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Valor personalizado</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value.replace(/[^0-9,]/g, "")); setSelectedPreset(null); }}
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-white text-lg text-center font-semibold outline-none focus:border-primary/50 transition"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 text-center">{error}</p>
                )}

                <button onClick={handleRequestDeposit} disabled={getAmount() < 10}
                  className="w-full bg-primary text-background font-bold py-3.5 rounded-xl text-sm disabled:opacity-50 hover:bg-primary-hover transition">
                  Gerar código PIX
                </button>

                <p className="text-xs text-gray-600 text-center">
                  Depósito mínimo de <strong>R$ 10,00</strong> • Confirmação em até 30 minutos
                </p>
              </>
            )}

            {depositState.step === "generating" && (
              <div className="text-center py-8 space-y-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                <p className="text-gray-400">Gerando código PIX...</p>
              </div>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
