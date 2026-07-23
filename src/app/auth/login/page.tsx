"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/browser"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      console.error("[Login] signInWithPassword error:", authError.message)
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: user, error: getUserError } = await supabase.auth.getUser()
    if (getUserError) {
      console.error("[Login] getUser error:", getUserError.message)
      setError("Erro de sessão: " + getUserError.message)
      setLoading(false)
      return
    }
    if (!user.user) {
      console.error("[Login] getUser returned null user")
      setError("Erro ao carregar usuário")
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.user.id)
      .single()

    if (profileError) {
      console.warn("[Login] profile query error:", profileError.message)
    }

    const role = profile?.role || "passenger"
    console.log("[Login] success, role:", role)
    router.push(`/dashboard/${role}`)
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] flex flex-col bg-background">
      <div className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[#00a884] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
            <span className="text-black font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Entrar no TXAP</h1>
          <p className="text-sm text-gray-500 mt-1">Bem-vindo de volta!</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-gray-400 font-medium">Email</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-gray-400 font-medium">Senha</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-error text-sm bg-error/10 border border-error/20 px-4 py-3 rounded-2xl">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Entrando...
              </span>
            ) : "Entrar"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-card-border to-transparent" />
          <span className="text-xs text-gray-600 font-medium">ou</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-card-border to-transparent" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-card-border hover:bg-card-bg-2 text-white font-medium py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar com Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-8">
          Não tem conta?{" "}
          <Link href="/auth/register" className="text-primary font-semibold hover:underline">
            Criar conta
          </Link>
        </p>

        {/* Depoimentos */}
        <div className="mt-10 space-y-3">
          <p className="text-center text-xs text-gray-600 font-medium uppercase tracking-wider">O que dizem</p>
          <div className="txd-card p-4">
            <p className="text-xs text-gray-300 leading-relaxed">&ldquo;Uso todo dia para ir ao trabalho. Rápido e os motoristas são muito profissionais.&rdquo;</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">👍</span>
              <span className="text-xs text-gray-500">Carlos, passageiro</span>
            </div>
          </div>
          <div className="txd-card p-4">
            <p className="text-xs text-gray-300 leading-relaxed">&ldquo;Comecei a motorista e já estou faturando bem. A plataforma é justa com os preços.&rdquo;</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">🚀</span>
              <span className="text-xs text-gray-500">Ana, motorista</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
