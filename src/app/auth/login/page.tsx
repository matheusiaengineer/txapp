"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browser";
import { useI18n } from "@/lib/i18n/provider";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState("pt-BR");

  useEffect(() => {
    const loc = localStorage.getItem("txd-locale") || "pt-BR";
    setLocale(loc);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      setError("Erro ao carregar usuário");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("tipo")
      .eq("id", user.user.id)
      .single();

    const role = profile?.tipo || "passenger";
    router.push(`/dashboard/${role}`);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  return (
    <main className="min-h-[100dvh] flex flex-col bg-background px-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Entrar no TXAP</h1>
          <p className="text-sm text-gray-400 mt-1">{t("auth.login.subtitle")}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && (
            <div className="text-error text-sm bg-error/10 px-4 py-2 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3.5 rounded-full txd-green-glow-sm disabled:opacity-50 transition-all"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-card-border" />
          <span className="text-xs text-gray-500">ou</span>
          <div className="flex-1 h-px bg-card-border" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-white/10 hover:bg-white/5 text-white font-medium py-3.5 rounded-full flex items-center justify-center gap-3 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar com Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Não tem conta?{" "}
          <Link href="/auth/register" className="text-primary font-medium">Criar conta</Link>
        </p>
      </div>
    </main>
  );
}
