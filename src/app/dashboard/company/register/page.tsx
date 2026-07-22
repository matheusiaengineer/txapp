"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CompanyRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [existing, setExisting] = useState<any>(null)

  const [form, setForm] = useState({
    corporateName: "",
    tradeName: "",
    cnpj: "",
    responsibleName: "",
    phone: "",
    whatsapp: "",
    address: "",
    lat: "",
    lng: "",
    serviceCategories: "",
    hasOwnDelivery: true,
    needsDeliveryPartner: false,
    deliveryZoneRadiusKm: 5,
  })

  useEffect(() => {
    fetch("/api/companies/register").then(r => r.json()).then(data => {
      if (data?.id) {
        setExisting(data)
        setForm({
          corporateName: data.corporate_name || "",
          tradeName: data.trade_name || "",
          cnpj: data.cnpj || "",
          responsibleName: data.responsible_name || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          address: data.address || "",
          lat: String(data.lat || ""),
          lng: String(data.lng || ""),
          serviceCategories: (data.service_categories || []).join(", "),
          hasOwnDelivery: data.has_own_delivery ?? true,
          needsDeliveryPartner: data.needs_delivery_partner ?? false,
          deliveryZoneRadiusKm: data.delivery_zone_radius_km || 5,
        })
      }
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const payload = {
      ...form,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      serviceCategories: form.serviceCategories.split(",").map(s => s.trim()).filter(Boolean),
    }

    const res = await fetch("/api/companies/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setMessage("Cadastro salvo com sucesso!")
      setExisting(data)
    } else {
      setMessage(data.error || "Erro ao salvar")
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {existing ? "Editar Empresa" : "Cadastrar Empresa"}
      </h1>

      {message && (
        <div className={`p-3 rounded mb-4 text-sm ${message.includes("sucesso") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message}
        </div>
      )}

      {existing && (
        <div className="bg-blue-50 p-3 rounded mb-4 text-sm text-blue-800">
          Empresa já cadastrada. Atualize os dados abaixo.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Razão Social *</label>
            <input
              type="text"
              required
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.corporateName}
              onChange={e => setForm(f => ({ ...f, corporateName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nome Fantasia</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.tradeName}
              onChange={e => setForm(f => ({ ...f, tradeName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CNPJ *</label>
            <input
              type="text"
              required
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.cnpj}
              onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Responsável</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.responsibleName}
              onChange={e => setForm(f => ({ ...f, responsibleName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.whatsapp}
              onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Endereço</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.lat}
              onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.lng}
              onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Categorias de Serviço (separadas por vírgula)</label>
          <input
            type="text"
            placeholder="ex: Restaurante, Mercado, Farmácia"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.serviceCategories}
            onChange={e => setForm(f => ({ ...f, serviceCategories: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Raio de entrega (km)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.deliveryZoneRadiusKm}
              onChange={e => setForm(f => ({ ...f, deliveryZoneRadiusKm: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <div className="space-y-3 border rounded p-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasOwnDelivery}
              onChange={e => setForm(f => ({ ...f, hasOwnDelivery: e.target.checked, needsDeliveryPartner: e.target.checked ? false : f.needsDeliveryPartner }))}
              className="w-4 h-4"
            />
            <span className="text-sm">Tenho entregador próprio</span>
          </label>

          {!form.hasOwnDelivery && (
            <label className="flex items-center gap-2 cursor-pointer ml-6">
              <input
                type="checkbox"
                checked={form.needsDeliveryPartner}
                onChange={e => setForm(f => ({ ...f, needsDeliveryPartner: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Quero usar motoboys TXAP para entrega</span>
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded font-semibold disabled:opacity-50"
        >
          {loading ? "Salvando..." : existing ? "Atualizar Cadastro" : "Cadastrar Empresa"}
        </button>
      </form>
    </main>
  )
}
