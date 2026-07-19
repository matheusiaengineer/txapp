"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import { formatCurrency } from "@/lib/utils/financial";
import { useToast } from "@/components/ui/toast";

interface WithdrawSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBalance: number;
  role: string;
  pixKey?: string;
  savedPixKeys?: string[];
  onSavePixKey?: (key: string) => void;
}

const MIN_WITHDRAWAL: Record<string, number> = {
  passenger: 0,
  motoboy: 5000,
  taxi: 5000,
  freight_driver: 10000,
  company: 0,
};

const DAILY_LIMITS: Record<string, number> = {
  pix: 200000,
  ted: 500000,
};

export function WithdrawSheet({ open, onClose, onSuccess, availableBalance, role, pixKey, savedPixKeys = [], onSavePixKey }: WithdrawSheetProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"pix" | "ted">("pix");
  const [currentPixKey, setCurrentPixKey] = useState(pixKey || "");
  const [pixKeyType, setPixKeyType] = useState<"cpf" | "email" | "phone" | "random">("email");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (open) { setAmount(""); setError(""); setCurrentPixKey(pixKey || ""); }
  }, [open, pixKey]);

  const minAmount = MIN_WITHDRAWAL[role] || 0;
  const dailyLimit = DAILY_LIMITS[method] || 200000;

  const numericAmount = parseFloat(amount.replace(",", ".")) * 100;
  const isValidAmount = !isNaN(numericAmount) && numericAmount >= minAmount && numericAmount <= availableBalance && numericAmount <= dailyLimit;

  const handleWithdraw = useCallback(async () => {
    if (!isValidAmount) return;
    setSaving(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Usuario nao autenticado"); setSaving(false); return; }

      if (onSavePixKey && currentPixKey && !savedPixKeys.includes(currentPixKey)) {
        onSavePixKey(currentPixKey);
      }

      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          method,
          pixKey: currentPixKey,
          pixKeyType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao solicitar saque");
      }

      toast.show("Saque solicitado com sucesso! O valor sera creditado em ate 2 horas.", "success");
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || "Erro ao solicitar saque");
    }
    setSaving(false);
  }, [isValidAmount, numericAmount, method, currentPixKey, pixKeyType, onSavePixKey, savedPixKeys, toast, onSuccess, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl overflow-y-auto" style={{ maxHeight: "85vh", background: "#121212", borderTop: "1px solid rgba(255,255,255,0.06)", animation: "slideUp 0.25s ease-out" }}>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Solicitar Saque</h2>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }} aria-label="Fechar"><span className="w-4 h-4 text-gray-400"><IcnX /></span></button>
          </div>

          <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-xs text-gray-500">Saldo disponivel para saque</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(availableBalance)}</p>
          </div>

          {minAmount > 0 && (
            <div className="flex gap-2 p-3 rounded-xl" style={{ background: "rgba(234,179,8,0.08)" }}>
              <span className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400"><IcnAlert /></span>
              <p className="text-xs text-yellow-400">Valor minimo para saque: {formatCurrency(minAmount)}</p>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Valor do saque</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">R$</span>
              <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9,]/g, ""))} placeholder="0,00" inputMode="decimal" className="w-full text-center text-3xl font-bold py-4 rounded-2xl outline-none transition" style={{ background: "rgba(255,255,255,0.05)", color: "#FFF", border: "1px solid rgba(255,255,255,0.1)" }} aria-label="Valor do saque" />
            </div>
            {!isNaN(numericAmount) && numericAmount > 0 && (
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>{formatCurrency(numericAmount)}</span>
                {numericAmount > availableBalance && <span className="text-red-400">Saldo insuficiente</span>}
                {numericAmount < minAmount && numericAmount > 0 && <span className="text-yellow-400">Minimo: {formatCurrency(minAmount)}</span>}
              </div>
            )}
          </div>

          {role !== "company" && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Metodo de saque</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setMethod("pix")} className="flex-1 py-3 rounded-xl text-sm font-medium transition min-h-[44px]" style={{ background: method === "pix" ? "rgba(62,203,142,0.15)" : "rgba(255,255,255,0.05)", border: method === "pix" ? "1px solid #3ECB8E" : "1px solid rgba(255,255,255,0.06)", color: method === "pix" ? "#3ECB8E" : "#9CA3AF" }}>PIX (ate 2h)</button>
                <button type="button" onClick={() => setMethod("ted")} className="flex-1 py-3 rounded-xl text-sm font-medium transition min-h-[44px]" style={{ background: method === "ted" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)", border: method === "ted" ? "1px solid #6366F1" : "1px solid rgba(255,255,255,0.06)", color: method === "ted" ? "#6366F1" : "#9CA3AF" }}>TED (ate 1 dia)</button>
              </div>
            </div>
          )}

          {method === "pix" && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Chave PIX</label>
              <div className="flex gap-2 mb-2">
                {(["cpf", "email", "phone", "random"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setPixKeyType(t)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition" style={{ background: pixKeyType === t ? "rgba(62,203,142,0.15)" : "rgba(255,255,255,0.05)", color: pixKeyType === t ? "#3ECB8E" : "#9CA3AF" }}>{t === "cpf" ? "CPF" : t === "email" ? "Email" : t === "phone" ? "Telefone" : "Aleatoria"}</button>
                ))}
              </div>
              <input value={currentPixKey} onChange={e => setCurrentPixKey(e.target.value)} placeholder={pixKeyType === "cpf" ? "000.000.000-00" : pixKeyType === "email" ? "email@exemplo.com" : pixKeyType === "phone" ? "(11) 99999-9999" : "Chave aleatoria"} className="w-full border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} aria-label="Chave PIX" />
              {savedPixKeys.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">Chaves salvas:</p>
                  {savedPixKeys.map((key, i) => (
                    <button key={i} type="button" onClick={() => setCurrentPixKey(key)} className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white transition" style={{ background: "rgba(255,255,255,0.03)" }}>{key}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button type="button" onClick={handleWithdraw} disabled={!isValidAmount || saving} className="w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base min-h-[56px]" style={{ background: isValidAmount && !saving ? "#3ECB8E" : "rgba(62,203,142,0.3)", color: "#000", opacity: !isValidAmount ? 0.5 : 1 }} aria-label="Confirmar saque">
            {saving ? <span className="w-5 h-5" style={{ animation: "spin 0.8s linear infinite" }}><IcnLoader /></span> : null}
            {saving ? "Processando..." : isValidAmount ? `Sacar ${formatCurrency(numericAmount)}` : "Valor invalido"}
          </button>

          <p className="text-xs text-gray-600 text-center">Transacoes protegidas por criptografia SSL de 256-bits</p>
        </div>
      </div>
    </div>
  );
}

function IcnX() {
  return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>);
}
function IcnAlert() {
  return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
}
function IcnLoader() {
  return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);
}
