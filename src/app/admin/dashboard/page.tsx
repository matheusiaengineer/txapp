"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/browser"

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tab, setTab] = useState("stats")
  const [loading, setLoading] = useState(true)

  const [influencers, setInfluencers] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [config, setConfig] = useState<any>({})

  const [banModal, setBanModal] = useState<any>(null)
  const [influencerModal, setInfluencerModal] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return }
      setUser(data.user)

      const { data: profile } = await supabase.from("profiles").select("role, email").eq("id", data.user.id).single()
      if (!profile || profile.role !== "admin") {
        router.push("/dashboard/passenger")
        return
      }
      setIsAdmin(true)
      loadData()
    })
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [statsRes, usersRes, infRes, configRes] = await Promise.all([
        fetch("/api/admin/stats").catch(() => ({ json: () => ({}) })),
        fetch("/api/admin/users").catch(() => ({ json: () => ({}) })),
        fetch("/api/admin/influencers").then(r => r.json()).catch(() => []),
        fetch("/api/admin/config").then(r => r.json()).catch(() => ({})),
      ])
      setStats(await statsRes.json())
      setInfluencers(Array.isArray(infRes) ? infRes : [])
      setConfig(configRes)

      const u = await usersRes.json()
      setUsers(Array.isArray(u) ? u : [])
    } catch {}
    setLoading(false)
  }

  async function handleBan() {
    if (!banModal) return
    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(banModal),
      })
      if (res.ok) {
        setBanModal(null)
        loadData()
      }
    } catch {}
  }

  async function handleUnban(userId: string) {
    await fetch(`/api/admin/ban?userId=${userId}`, { method: "DELETE" })
    loadData()
  }

  async function saveInfluencer() {
    if (!influencerModal) return
    const method = influencerModal.id ? "PUT" : "POST"
    const res = await fetch("/api/admin/influencers", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(influencerModal),
    })
    if (res.ok) {
      setInfluencerModal(null)
      loadData()
    }
  }

  async function deleteInfluencer(id: string) {
    await fetch(`/api/admin/influencers?id=${id}`, { method: "DELETE" })
    loadData()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (!isAdmin) return null

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg">TXAP Admin</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <button onClick={() => router.push("/")} className="text-xs text-primary underline">Sair</button>
        </div>
      </header>

      <div className="flex gap-2 px-4 py-3 border-b border-border overflow-x-auto">
        {[
          { id: "stats", label: "Dashboard" },
          { id: "influencers", label: "Influenciadores" },
          { id: "users", label: "Usuarios" },
          { id: "config", label: "Configuracoes" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              tab === t.id ? "bg-primary text-white" : "bg-card border border-border"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-5xl mx-auto">
        {tab === "stats" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Receita Hoje", value: "R$ 0" },
              { label: "Corridas", value: "0" },
              { label: "Motoristas Online", value: "0" },
              { label: "Empresas Ativas", value: "0" },
              { label: "Novos Usuarios", value: "0" },
              { label: "Alertas", value: "0", alert: true },
            ].map(s => (
              <div key={s.label} className={`bg-card border rounded-xl p-4 ${s.alert ? "border-red-500" : "border-border"}`}>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.alert ? "text-red-500" : ""}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "influencers" && (
          <div className="space-y-4">
            <button
              onClick={() => setInfluencerModal({ instagram_handle: "", display_name: "", is_active: true, is_founder: false, display_order: 0 })}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              + Adicionar Influenciador
            </button>

            {influencers.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum influenciador cadastrado</p>
            )}

            {influencers.map(inf => (
              <div key={inf.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                  {inf.avatar_url ? <img src={inf.avatar_url} className="w-10 h-10 rounded-full object-cover" /> : "⭐"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{inf.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{inf.instagram_handle}</p>
                </div>
                <button onClick={() => setInfluencerModal(inf)} className="text-xs text-primary underline">Editar</button>
                <button onClick={() => deleteInfluencer(inf.id)} className="text-xs text-red-500 underline">Remover</button>
              </div>
            ))}

            {influencerModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4">
                  <h3 className="font-semibold">{influencerModal.id ? "Editar" : "Novo"} Influenciador</h3>
                  <input
                    placeholder="Instagram (sem @)"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={influencerModal.instagram_handle}
                    onChange={e => setInfluencerModal((prev: any) => ({ ...prev, instagram_handle: e.target.value }))}
                  />
                  <input
                    placeholder="Nome de exibicao"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={influencerModal.display_name}
                    onChange={e => setInfluencerModal((prev: any) => ({ ...prev, display_name: e.target.value }))}
                  />
                  <input
                    placeholder="URL do avatar"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={influencerModal.avatar_url || ""}
                    onChange={e => setInfluencerModal((prev: any) => ({ ...prev, avatar_url: e.target.value }))}
                  />
                  <input
                    placeholder="Ordem de exibicao"
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={influencerModal.display_order}
                    onChange={e => setInfluencerModal((prev: any) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={influencerModal.is_founder} onChange={e => setInfluencerModal((prev: any) => ({ ...prev, is_founder: e.target.checked }))} />
                    Fundador
                  </label>
                  <div className="flex gap-2">
                    <button onClick={saveInfluencer} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium">Salvar</button>
                    <button onClick={() => setInfluencerModal(null)} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm">Cancelar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {["Todos", "Passageiros", "Motoristas", "Empresas", "Banidos"].map(f => (
                <button key={f} className="px-3 py-1.5 rounded-full text-xs border border-border bg-card whitespace-nowrap">{f}</button>
              ))}
            </div>

            {users.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum usuario encontrado</p>
            )}

            {users.map((u: any) => (
              <div key={u.id} className={`bg-card border rounded-xl p-4 ${u.is_banned ? "border-red-500/50 bg-red-500/5" : "border-border"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{u.full_name || u.email}</p>
                    <p className="text-xs text-muted-foreground">{u.email} {u.phone ? `| ${u.phone}` : ""}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{u.account_type || u.role}</span>
                      {u.is_banned && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Banido</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {u.is_banned ? (
                      <button onClick={() => handleUnban(u.id)} className="text-xs text-green-600 underline">Desbanir</button>
                    ) : (
                      <button onClick={() => setBanModal({ userId: u.id, reason: "", banDevice: false })} className="text-xs text-red-500 underline">Banir</button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {banModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4">
                  <h3 className="font-semibold text-red-600">Banir Usuario</h3>
                  <p className="text-xs text-muted-foreground">ID: {banModal.userId}</p>
                  <textarea
                    placeholder="Motivo do banimento..."
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
                    value={banModal.reason}
                    onChange={e => setBanModal((prev: any) => ({ ...prev, reason: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={banModal.banDevice} onChange={e => setBanModal((prev: any) => ({ ...prev, banDevice: e.target.checked }))} />
                    Banir dispositivo tambem
                  </label>
                  <div className="flex gap-2">
                    <button onClick={handleBan} disabled={!banModal.reason} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">Banir Permanentemente</button>
                    <button onClick={() => setBanModal(null)} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm">Cancelar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "config" && (
          <div className="space-y-4">
            {[
              { key: "platform_commission", label: "Comissao da Plataforma", value: config.platform_commission || "10%", editable: false },
              { key: "min_price_per_km_moto", label: "Preco Minimo/km (Moto)", value: config.min_price_per_km_moto || "R$ 1,00", editable: true },
              { key: "min_price_per_km_carro", label: "Preco Minimo/km (Carro)", value: config.min_price_per_km_carro || "R$ 1,50", editable: true },
              { key: "genesis_guarantee_amount", label: "Garantia Genesis (R$)", value: config.genesis_guarantee_amount || "500", editable: true },
              { key: "social_fee_percent", label: "Fundo Social (%)", value: config.social_fee_percent || "1%", editable: true },
            ].map(c => (
              <div key={c.key} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.value}</p>
                </div>
                {!c.editable && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">So Matheus16k</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
