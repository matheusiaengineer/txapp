"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Send, CheckCircle } from "lucide-react";
import Link from "next/link";
import { SkeletonList } from "@/components/ui/skeleton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 relative overflow-hidden" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {pageLoading ? (
        <SkeletonList count={4} />
      ) : (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao login
        </Link>

        <div className="glass-panel p-8">
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Email enviado!</h2>
              <p className="text-gray-400 text-sm mb-6">
                Enviamos um link de redefinição de senha para <strong className="text-white">{email}</strong>
              </p>
              <p className="text-xs text-gray-500">Não recebeu? Verifique sua caixa de spam ou <button onClick={() => setSent(false)} className="bg-white/5 hover:bg-white/10 text-white font-medium py-1.5 px-3 rounded-xl transition-all text-xs">tente novamente</button></p>
            </motion.div>
          ) : (
            <>
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Recuperar senha</h1>
              <p className="text-gray-400 text-sm mb-6">Digite seu email cadastrado e enviaremos um link para redefinir sua senha.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-background border border-card-border rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Enviar link <Send className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
      )}
    </div>
  );
}
