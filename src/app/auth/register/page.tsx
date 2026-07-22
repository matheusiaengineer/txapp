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

      router.push(`/auth/verify?email=${encodeURIComponent(form.email)}&type=${form.accountType}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Criar Conta TXAP</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 1 ? "Escolha seu perfil" : "Preencha seus dados"}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-3">
            {ACCOUNT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => { setForm(f => ({ ...f, accountType: type.id })); setStep(2) }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  form.accountType === type.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <div>
                  <p className="font-semibold">{type.label}</p>
                  <p className="text-sm text-muted-foreground">{type.desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">{ACCOUNT_TYPES.find(t => t.id === form.accountType)?.icon}</span>
              <span className="text-sm font-medium">{ACCOUNT_TYPES.find(t => t.id === form.accountType)?.label}</span>
              <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs text-primary underline">
                Alterar
              </button>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Celular</label>
              <input
                type="tel"
                required
                placeholder="(11) 99999-9999"
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                onBlur={e => checkAvailability("phone", e.target.value)}
              />
              {form.phone && availability.phoneAvailable === false && (
                <p className="text-xs text-red-500 mt-1">Celular ja cadastrado</p>
              )}
              {form.phone && availability.phoneAvailable === true && (
                <p className="text-xs text-green-500 mt-1">Celular disponivel</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">CPF</label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                value={form.cpf}
                onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
                onBlur={e => checkAvailability("cpf", e.target.value)}
              />
              {form.cpf && availability.cpfAvailable === false && (
                <p className="text-xs text-red-500 mt-1">CPF ja cadastrado</p>
              )}
              {form.cpf && availability.cpfAvailable === true && (
                <p className="text-xs text-green-500 mt-1">CPF disponivel</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Nome Completo</label>
              <input
                type="text"
                required
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <input
                type="email"
                required
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Ao criar conta, voce aceita nossos Termos de Uso e Politica de Privacidade.
              CPF e celular nao podem ser alterados apos o cadastro.
            </p>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Ja tem conta?{" "}
          <Link href="/auth/login" className="text-primary font-medium underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
