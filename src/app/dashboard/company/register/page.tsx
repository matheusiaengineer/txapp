"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const CATEGORIES = ["Mercado", "Farmácia", "Restaurante", "Gás", "Auto Peças", "Pet Shop", "Bebidas", "Água"]

export default function CompanyRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [existing, setExisting] = useState<any>(null)
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    cnpj: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    whatsapp: "",
    email: "",
    categories: [] as string[],
    delivery_enabled: false,
    delivery_radius_km: 5,
    delivery_fee: 0,
    min_order_value: 0,
    accepts_pix: true,
    accepts_card: true,
    accepts_cash: true,
  })

  useEffect(() => {
    fetch("/api/companies/register").then(r => r.json()).then(data => {
      if (data?.id) {
        setExisting(data)
        setForm(prev => ({
          ...prev,
          name: data.name || data.corporate_name || "",
          slug: data.slug || "",
          description: data.description || "",
          cnpj: data.cnpj || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          categories: data.categories || data.service_categories || [],
          delivery_enabled: data.delivery_enabled ?? data.has_own_delivery ?? false,
          delivery_radius_km: data.delivery_radius_km || data.delivery_zone_radius_km || 5,
          delivery_fee: data.delivery_fee || 0,
          min_order_value: data.min_order_value || 0,
        }))
      }
    }).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    setMessage("")

    const payload = { ...form }

    const res = await fetch("/api/companies/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setMessage("✅ Cadastro salvo com sucesso!")
      setExisting(data)
      setTimeout(() => router.push("/dashboard/company/subscription"), 1500)
    } else {
      setMessage(data.error || "Erro ao salvar")
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 max-w-lg mx-auto text-white">
      <h1 className="text-xl font-bold mb-6">
        {existing ? "✏️ Editar Empresa" : "🏢 Cadastrar Empresa"}
      </h1>

      {message && (
        <div className={`p-3 rounded-xl mb-4 text-sm ${
          message.includes("sucesso") ? "bg-primary/10 text-primary border border-primary/20" : "bg-error/10 text-error border border-error/20"
        }`}>
          {message}
        </div>
      )}

      {/* Progresso */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-2 rounded-full transition-all ${s <= step ? "bg-primary" : "bg-card-bg-2"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Dados Básicos</h2>
          <input className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            placeholder="Nome Fantasia" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            placeholder="Slug (ex: supermercado-silva)" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} />
          <input className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            placeholder="CNPJ" value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})} />
          <textarea className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            placeholder="Descrição do negócio" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <button onClick={() => setStep(2)} className="w-full bg-primary text-black font-bold py-3 rounded-xl">Próximo →</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Endereço e Contato</h2>
          <input className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            placeholder="Endereço completo" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <input className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
              placeholder="Cidade" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
            <input className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
              placeholder="UF" maxLength={2} value={form.state} onChange={e => setForm({...form, state: e.target.value.toUpperCase()})} />
          </div>
          <input className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          <input className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            placeholder="WhatsApp" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} />
          <input className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 bg-card-bg-2 border border-card-border text-white font-bold py-3 rounded-xl">← Voltar</button>
            <button onClick={() => setStep(3)} className="flex-1 bg-primary text-black font-bold py-3 rounded-xl">Próximo →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Categorias e Entrega</h2>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  const cats = form.categories.includes(cat)
                    ? form.categories.filter(c => c !== cat)
                    : [...form.categories, cat]
                  setForm({...form, categories: cats})
                }}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  form.categories.includes(cat) ? "border-primary bg-primary/10 text-primary" : "border-card-border bg-card-bg-2 text-gray-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between py-3 border-b border-card-border">
            <span className="text-sm">Faz entrega?</span>
            <button
              onClick={() => setForm({...form, delivery_enabled: !form.delivery_enabled})}
              className={`w-12 h-6 rounded-full transition-all relative ${form.delivery_enabled ? "bg-primary" : "bg-white/20"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${form.delivery_enabled ? "left-6" : "left-0.5"}`} />
            </button>
          </div>

          {form.delivery_enabled && (
            <>
              <input className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                placeholder="Raio de entrega (km)" type="number" value={form.delivery_radius_km} onChange={e => setForm({...form, delivery_radius_km: Number(e.target.value)})} />
              <input className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                placeholder="Taxa de entrega (R$)" type="number" value={form.delivery_fee} onChange={e => setForm({...form, delivery_fee: Number(e.target.value)})} />
              <input className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                placeholder="Pedido mínimo (R$)" type="number" value={form.min_order_value} onChange={e => setForm({...form, min_order_value: Number(e.target.value)})} />
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button onClick={() => setStep(2)} className="flex-1 bg-card-bg-2 border border-card-border text-white font-bold py-3 rounded-xl">← Voltar</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-primary text-black font-bold py-3 rounded-xl">
              {loading ? "Salvando..." : existing ? "Atualizar" : "✅ Criar Empresa"}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
