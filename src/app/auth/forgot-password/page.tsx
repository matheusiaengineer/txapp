"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/login`,
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <Link href="/auth/login" className="text-gray-400 text-sm mb-8">← Voltar</Link>
        <h1 className="text-2xl font-bold text-white mb-2">Recuperar senha</h1>
        <p className="text-sm text-gray-400 mb-6">Receba um link para redefinir sua senha.</p>
        {sent ? (
          <div className="txd-card p-6 text-center">
            <p className="text-success font-medium mb-2">Email enviado!</p>
            <p className="text-sm text-gray-400">Verifique sua caixa de entrada.</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" required
              className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white text-base" />
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-black font-bold py-3.5 rounded-full disabled:opacity-50">
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
