"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browser";
import { useI18n } from "@/lib/i18n/provider";

const PROFILES = [
  { id: "passenger", label: "Passageiro", desc: "Solicito corridas e entregas", icon: "👤" },
  { id: "driver", label: "Motorista", desc: "Ofereço corridas e fretes", icon: "🚗" },
  { id: "company", label: "Empresa", desc: "Preciso de frota terceirizada", icon: "🏢" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState<"profile" | "register" | "success">("profile");
  const [profileType, setProfileType] = useState<string>("passenger");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || "Erro ao criar conta");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        email,
        nome,
        tipo: profileType,
        idioma: localStorage.getItem("txd-locale") || "pt-BR",
      },
    ]);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("success");
  }

  if (step === "profile") {
    return (
      <main className="min-h-[100dvh] flex flex-col bg-background px-4"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Bem-vindo ao TXAP</h1>
            <p className="text-sm text-gray-400 mt-1">Selecione seu perfil</p>
          </div>
          <div className="space-y-3">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => { setProfileType(p.id); setStep("register"); }}
                className="w-full txd-card p-4 flex items-center gap-4 text-left hover:border-primary/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-card-bg-2 flex items-center justify-center text-xl shrink-0">{p.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm">{p.label}</div>
                  <div className="text-xs text-gray-400">{p.desc}</div>
                </div>
                <div className="text-gray-500">→</div>
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta? <Link href="/auth/login" className="text-primary font-medium">Entrar</Link>
          </p>
        </div>
      </main>
    );
  }

  if (step === "success") {
    return (
      <main className="min-h-[100dvh] flex flex-col bg-background px-4"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Conta criada!</h1>
          <p className="text-sm text-gray-400 mb-8">Verifique seu email para confirmar o cadastro.</p>
          <button
            onClick={() => router.push(`/dashboard/${profileType}`)}
            className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3.5 rounded-full"
          >
            Ir para o Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] flex flex-col bg-background px-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <button onClick={() => setStep("profile")} className="text-gray-400 text-sm mb-6 flex items-center gap-1">
          ← Voltar
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Criar conta</h1>
          <p className="text-sm text-gray-400 mt-1">{PROFILES.find(p => p.id === profileType)?.label}</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              required
              className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary"
            />
          </div>

          {error && (
            <div className="text-error text-sm bg-error/10 px-4 py-2 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3.5 rounded-full txd-green-glow-sm disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          Ao criar conta, você aceita nossos Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </main>
  );
}
