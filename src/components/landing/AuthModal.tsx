"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getDashboardRoute, type Role } from "@/lib/auth/auth-service";
import { createClient } from "@/lib/supabase/browser";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "./auth-context";
import { Button } from "@/components/ui/button";

export function AuthModal() {
  const router = useRouter();
  const { open, mode: ctxMode, profile: ctxProfile, redirectAfterAuth, closeAuth, openAuth } = useAuth();

  const [mode, setMode] = useState<"login" | "register">(ctxMode);
  const [authProfile, setAuthProfile] = useState(ctxProfile);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  if (!open) return null;

  const handleSubmit = async () => {
    if (mode === "login") {
      setLoading(true);
      const res = await signIn(email, password);
      if (res.error) { setLoading(false); showToast(res.error); return; }
      if (res.session) {
        const supabase = createClient();
        await supabase.auth.setSession(res.session);
      }
      setLoading(false);
      closeAuth();
      router.push(redirectAfterAuth || getDashboardRoute((res.role as Role) || "passenger"));
    } else {
      closeAuth();
      router.push(`/auth/register?type=${authProfile}${redirectAfterAuth ? `&redirectTo=${encodeURIComponent(redirectAfterAuth)}` : ""}`);
    }
  };

  const profileOptions = [
    { id: "passenger", label: "Passageiro", icon: "car" as const },
    { id: "driver", label: "Motorista", icon: "bike" as const },
    { id: "company", label: "Empresa", icon: "building-2" as const },
  ];

  return (
    <>
      {toast && (
        <div className="fixed top-24 right-6 z-[100] bg-[#11151c] rounded-2xl px-6 py-4 shadow-2xl border border-primary/30" style={{ backdropFilter: "blur(32px)" }}>
          <div className="flex items-center gap-3"><Icon name="check-circle" className="text-primary" /><span className="text-white font-medium">{toast}</span></div>
        </div>
      )}
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70" onClick={closeAuth}>
        <div
          className="w-full max-w-md bg-[#11151c] rounded-3xl p-4 md:p-8 relative max-h-[90vh] overflow-y-auto border border-white/10"
          onClick={e => e.stopPropagation()}
          style={{ backdropFilter: "blur(32px)" }}
        >
          <button onClick={closeAuth} className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition">
            <Icon name="x" size={16} />
          </button>
          <div className="text-center mb-5">
            <span className="txd-gradient-text font-bold text-lg">TXDAPP</span>
            <p className="text-gray-400 text-xs md:text-sm mt-1">{mode === "login" ? "Entre na sua conta" : "Crie sua conta grátis"}</p>
          </div>
          <div className="flex bg-black/40 rounded-xl p-1 mb-5">
            <button onClick={() => setMode("login")} className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${mode === "login" ? "bg-primary text-black" : "text-gray-400"}`}>Entrar</button>
            <button onClick={() => setMode("register")} className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${mode === "register" ? "bg-primary text-black" : "text-gray-400"}`}>Criar conta</button>
          </div>
          {mode === "register" && (
            <div className="grid grid-cols-3 gap-2 mb-5">
              {profileOptions.map(p => (
                <button key={p.id} onClick={() => setAuthProfile(p.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 md:p-4 rounded-xl border transition ${authProfile === p.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                  <Icon name={p.icon} className={`${authProfile === p.id ? "text-primary" : "text-gray-400"}`} size={20} />
                  <span className={`text-[10px] md:text-xs font-medium ${authProfile === p.id ? "text-primary" : "text-gray-400"}`}>{p.label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {mode === "register" && (
              <input type="text" placeholder="Seu nome completo"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 md:py-4 px-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition" />
            )}
            <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 md:py-4 px-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition" />
            {mode === "register" && (
              <input type="tel" placeholder="(33) 99999-9999"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 md:py-4 px-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition" />
            )}
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 md:py-4 px-4 pr-10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition" />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-gray-500 hover:text-gray-300">
                {showPassword ? <Icon name="eye-off" size={16} /> : <Icon name="eye" size={16} />}
              </button>
            </div>
            {mode === "login" && <button className="text-sm text-primary hover:underline">Esqueci minha senha</button>}
          </div>
          <Button onClick={handleSubmit} className="w-full mt-5 shadow-lg shadow-primary/20 txd-green-glow-sm">
            {loading ? <span className="flex items-center gap-2"><Icon name="loader-2" className="animate-spin" size={16} />Entrando...</span> : mode === "login" ? "Entrar" : "Criar conta gratuita"}
          </Button>
          {authProfile === "driver" && mode === "register" && (
            <p className="text-xs text-gray-500 text-center mt-4">Após o cadastro, envie CNH, documento do veículo e selfie para aprovação.</p>
          )}
          <p className="text-xs text-gray-600 text-center mt-4">Ao continuar, você aceita nossos Termos de Uso e Política de Privacidade.</p>
        </div>
      </div>
    </>
  );
}
