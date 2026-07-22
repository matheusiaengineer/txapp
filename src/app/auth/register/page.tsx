"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/browser"

const ACCOUNT_TYPES = [
  { id: "passenger", label: "Passageiro", desc: "Solicito corridas e entregas", icon: "🧑‍💼", gradient: "from-primary/20 to-primary/5" },
  { id: "driver_moto", label: "Motoboy", desc: "Entrego de moto", icon: "🛵", gradient: "from-amber-500/20 to-amber-500/5" },
  { id: "driver_car", label: "Motorista", desc: "Transporto de carro", icon: "🚕", gradient: "from-blue-500/20 to-blue-500/5" },
  { id: "business", label: "Empresa", desc: "Quero vender no TXAP", icon: "🏢", gradient: "from-purple-500/20 to-purple-500/5" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    phone: "",
    cpf: "",
    name: "",
    email: "",
    password: "",
    accountType: "passenger",
  })

  const [availability, setAvailability] = useState<{ phoneAvailable?: boolean; cpfAvailable?: boolean }>({})

  async function checkAvailability(field: "phone" | "cpf", value: string) {
    if (!value || value.length < 3) return
    try {
      const params = new URLSearchParams({ [field]: value.replace(/\D/g, "") })
      const res = await fetch(`/api/auth/check-availability?${params}`)
      const data = await res.json()
      setAvailability(prev => ({ ...prev, [`${field}Available`]: data[`${field}Available`] }))
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cpf: form.cpf.replace(/\D/g, ""),
          accountType: form.accountType,
          deviceFingerprint: navigator.userAgent + screen.width + screen.height,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erro ao criar conta")
        setLoading(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (signInError) {
        setError("Conta criada! Faça login para continuar.")
        setLoading(false)
        return
      }

      router.push("/home")
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] flex flex-col bg-background">
      <div className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[#00a884] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
            <span className="text-black font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Criar Conta</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 ? "Escolha seu perfil" : "Preencha seus dados"}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-error text-sm bg-error/10 border border-error/20 px-4 py-3 rounded-2xl mb-4">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-3">
            {ACCOUNT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => { setForm(f => ({ ...f, accountType: type.id })); setStep(2) }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left group ${
                  form.accountType === type.id
                    ? "border-primary bg-primary/10"
                    : "border-card-border bg-card-bg hover:border-primary/40 hover:bg-card-bg-2"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <span className="text-xl">{type.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-white">{type.label}</p>
                  <p className="text-sm text-gray-400">{type.desc}</p>
                </div>
                <svg className="w-5 h-5 ml-auto text-gray-600 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-card-bg-2 border border-card-border rounded-2xl p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${ACCOUNT_TYPES.find(t => t.id === form.accountType)?.gradient} flex items-center justify-center`}>
                <span className="text-lg">{ACCOUNT_TYPES.find(t => t.id === form.accountType)?.icon}</span>
              </div>
              <span className="text-sm font-medium text-white flex-1">
                {ACCOUNT_TYPES.find(t => t.id === form.accountType)?.label}
              </span>
              <button type="button" onClick={() => setStep(1)} className="text-xs text-primary font-medium hover:underline">
                Alterar
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-400 font-medium">Celular</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                <input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  onBlur={e => checkAvailability("phone", e.target.value)}
                />
              </div>
              {form.phone && availability.phoneAvailable === false && (
                <p className="flex items-center gap-1 text-xs text-error mt-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg> Celular já cadastrado</p>
              )}
              {form.phone && availability.phoneAvailable === true && (
                <p className="flex items-center gap-1 text-xs text-success mt-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Celular disponível</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-400 font-medium">CPF</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  value={form.cpf}
                  onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
                  onBlur={e => checkAvailability("cpf", e.target.value)}
                />
              </div>
              {form.cpf && availability.cpfAvailable === false && (
                <p className="flex items-center gap-1 text-xs text-error mt-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg> CPF já cadastrado</p>
              )}
              {form.cpf && availability.cpfAvailable === true && (
                <p className="flex items-center gap-1 text-xs text-success mt-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> CPF disponível</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-400 font-medium">Nome Completo</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <input
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-400 font-medium">Email</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-400 font-medium">Senha</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Criando conta...
                </span>
              ) : "Criar Conta"}
            </button>

            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Ao criar conta, você aceita nossos <span className="text-gray-400">Termos de Uso</span> e <span className="text-gray-400">Política de Privacidade</span>.
              CPF e celular não podem ser alterados após o cadastro.
            </p>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-8">
          Já tem conta?{" "}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
