"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/browser"

const ACCOUNT_TYPES = [
  { id: "passenger", label: "Passageiro", desc: "Solicito corridas e entregas", icon: "🧑‍💼" },
  { id: "driver_moto", label: "Motoboy", desc: "Entrego de moto", icon: "🛵" },
  { id: "driver_car", label: "Motorista", desc: "Transporto de carro", icon: "🚕" },
  { id: "business", label: "Empresa", desc: "Quero vender no TXAP", icon: "🏢" },
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

      router.push("/home")
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] flex flex-col bg-background px-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Criar Conta TXAP</h1>
          <p className="text-sm text-gray-400 mt-1">
            {step === 1 ? "Escolha seu perfil" : "Preencha seus dados"}
          </p>
        </div>

        {error && (
          <div className="text-error text-sm bg-error/10 border border-error/20 px-4 py-2 rounded-lg mb-4">{error}</div>
        )}

        {step === 1 ? (
          <div className="space-y-3">
            {ACCOUNT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => { setForm(f => ({ ...f, accountType: type.id })); setStep(2) }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  form.accountType === type.id
                    ? "border-primary bg-primary/10"
                    : "border-card-border bg-card-bg hover:border-primary/50"
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <div>
                  <p className="font-semibold text-white">{type.label}</p>
                  <p className="text-sm text-gray-400">{type.desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-card-bg-2 border border-card-border rounded-2xl p-3 flex items-center gap-3">
              <span className="text-xl">{ACCOUNT_TYPES.find(t => t.id === form.accountType)?.icon}</span>
              <span className="text-sm font-medium text-white">
                {ACCOUNT_TYPES.find(t => t.id === form.accountType)?.label}
              </span>
              <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs text-primary underline">
                Alterar
              </button>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-1 block">Celular</label>
              <input
                type="tel"
                required
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary transition-colors"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                onBlur={e => checkAvailability("phone", e.target.value)}
              />
              {form.phone && availability.phoneAvailable === false && (
                <p className="text-xs text-error mt-1">Celular já cadastrado</p>
              )}
              {form.phone && availability.phoneAvailable === true && (
                <p className="text-xs text-success mt-1">Celular disponível</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-1 block">CPF</label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary transition-colors"
                value={form.cpf}
                onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
                onBlur={e => checkAvailability("cpf", e.target.value)}
              />
              {form.cpf && availability.cpfAvailable === false && (
                <p className="text-xs text-error mt-1">CPF já cadastrado</p>
              )}
              {form.cpf && availability.cpfAvailable === true && (
                <p className="text-xs text-success mt-1">CPF disponível</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-1 block">Nome Completo</label>
              <input
                type="text"
                required
                placeholder="Seu nome completo"
                className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary transition-colors"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-1 block">Email</label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary transition-colors"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-1 block">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white placeholder-gray-500 text-base focus:outline-none focus:border-primary transition-colors"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3.5 rounded-full txd-green-glow-sm disabled:opacity-50 transition-all"
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Ao criar conta, você aceita nossos Termos de Uso e Política de Privacidade.
              CPF e celular não podem ser alterados após o cadastro.
            </p>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{" "}
          <Link href="/auth/login" className="text-primary font-medium">Entrar</Link>
        </p>
      </div>
    </main>
  )
}
