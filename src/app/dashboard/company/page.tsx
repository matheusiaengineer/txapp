"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/browser"
import { useUser } from "@/lib/hooks/use-user"

interface CompanyData {
  id: string
  corporate_name: string
  trade_name: string | null
  cnpj: string
  responsible_name: string
  address: string | null
  status: string
  service_categories: string[]
  delivery_radius_km: number | null
  min_order_value: number | null
  has_own_delivery: boolean
  needs_delivery_partner: boolean
}

interface Stats {
  activeDrivers: number
  totalDrivers: number
  todayDeliveries: number
  monthOrders: number
  successRate: number
  revenue: number
}

interface RecentDelivery {
  id: string
  created_at: string
  status: string
  final_fare: number | null
  estimated_fare: number
  origin_address: string
  dest_address: string
}

interface AvailableDriver {
  id: string
  name: string
  vehicle_type: string
  distance_meters: number
  price_per_km: number
  rating: number
}

const TAB_IDS = ["overview", "drivers", "products", "subscription"] as const
type TabId = typeof TAB_IDS[number]

export default function CompanyDashboard() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [stats, setStats] = useState<Stats>({
    activeDrivers: 0, totalDrivers: 0, todayDeliveries: 0,
    monthOrders: 0, successRate: 0, revenue: 0,
  })
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("overview")

  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([])
  const [driverLoading, setDriverLoading] = useState(false)

  function tabClass(id: string): string {
    if (activeTab === id) {
      return "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors bg-primary text-white"
    }
    return "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors bg-gray-100 text-muted hover:bg-gray-200"
  }

  function statusBadge(status: string): string {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700 border border-yellow-200"
      case "approved": return "bg-green-100 text-green-700 border border-green-200"
      case "rejected": return "bg-red-100 text-red-700 border border-red-200"
      default: return "bg-gray-100 text-muted"
    }
  }

  function deliveryBadge(status: string): string {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      confirmed: "bg-blue-100 text-blue-700",
      preparing: "bg-purple-100 text-purple-700",
      in_delivery: "bg-cyan-100 text-cyan-700",
      delivered: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    }
    return map[status] || "bg-gray-100 text-muted"
  }

  function deliveryLabel(status: string): string {
    const map: Record<string, string> = {
      pending: "Pendente", confirmed: "Confirmado", preparing: "Preparando",
      in_delivery: "Em Entrega", delivered: "Entregue", cancelled: "Cancelado",
    }
    return map[status] || status
  }

  useEffect(() => {
    async function loadData() {
      if (!user) { router.push("/auth/login"); return }
      setLoading(true)
      try {
        const { data: companyData } = await supabase
          .from("companies").select("*").eq("id", user.id).single()
        if (!companyData) { router.push("/dashboard/company/register"); return }
        setCompany(companyData)

        const { data: drivers } = await supabase
          .from("driver_profiles").select("id, current_live_status")
          .eq("company_id", user.id).limit(100)

        const { data: trips } = await supabase
          .from("trips").select("*")
          .eq("company_id", user.id)
          .order("created_at", { ascending: false }).limit(20)

        if (drivers) {
          const active = drivers.filter(d => d.current_live_status !== "OFFLINE").length
          setStats(prev => ({ ...prev, activeDrivers: active, totalDrivers: drivers.length }))
        }
        if (trips) {
          const now = new Date()
          const completed = trips.filter(t => ["COMPLETED", "PAYMENT_CONFIRMED", "FINISHED"].includes(t.status))
          const thisMonth = trips.filter(t => {
            const d = new Date(t.created_at)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          })
          const todayDeliveries = trips.filter(t =>
            new Date(t.created_at).toDateString() === now.toDateString() &&
            ["COMPLETED", "PAYMENT_CONFIRMED", "FINISHED"].includes(t.status)
          ).length
          setStats(prev => ({
            ...prev, todayDeliveries, monthOrders: thisMonth.length,
            successRate: trips.length > 0 ? Math.round((completed.length / trips.length) * 100) : 0,
            revenue: completed.reduce((acc, t) => acc + (t.final_fare || t.estimated_fare || 0), 0),
          }))
          setRecentDeliveries(trips.slice(0, 5))
        }
      } catch (err) {
        console.error("Failed to load company dashboard:", err)
      } finally { setLoading(false) }
    }
    loadData()
  }, [user, router])

  async function loadAvailableDrivers() {
    setDriverLoading(true)
    try {
      const res = await fetch(`/api/drivers/nearby?lat=-23.561&lng=-46.656&vehicleType=moto&radius=10`)
      const data = await res.json()
      setAvailableDrivers(data.drivers || [])
    } catch { setAvailableDrivers([]) }
    setDriverLoading(false)
  }

  useEffect(() => {
    if (activeTab === "drivers") loadAvailableDrivers()
  }, [activeTab])

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <Link href="/dashboard/company/register" className="bg-primary text-white font-bold px-8 py-4 rounded-full hover:bg-primary-hover">
          Cadastrar Empresa
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-foreground">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted">Painel da Empresa</div>
          <div className="font-bold text-lg text-foreground">{company.trade_name || company.corporate_name}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className={"px-3 py-1 rounded-full text-xs font-medium border " + statusBadge(company.status)}>
            {company.status === "pending" ? "Pendente" : company.status === "approved" ? "Aprovada" : "Rejeitada"}
          </span>
          <button onClick={() => supabase.auth.signOut().then(() => router.push("/"))} className="text-sm text-muted hover:text-foreground transition-colors">
            Sair
          </button>
        </div>
      </header>

      <main className="p-4 pb-24">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-muted">Motoristas Ativos</div>
            <div className="text-2xl font-bold text-foreground">{stats.activeDrivers}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-muted">Total Motoristas</div>
            <div className="text-2xl font-bold text-foreground">{stats.totalDrivers}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-muted">Entregas Hoje</div>
            <div className="text-2xl font-bold text-primary">{stats.todayDeliveries}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-muted">Entregas Mês</div>
            <div className="text-2xl font-bold text-foreground">{stats.monthOrders}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm col-span-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-muted">Receita do Mês</div>
                <div className="text-2xl font-bold text-foreground">R$ {stats.revenue.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted">Sucesso</div>
                <div className="text-xl font-bold text-success">{stats.successRate}%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {TAB_IDS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as TabId)} className={tabClass(tab)}>
              {tab === "overview" ? "Visão Geral" : tab === "drivers" ? "🚚 Motoristas" : tab === "products" ? "Produtos" : "Assinatura"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">Informações da Empresa</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted">Razão Social:</span> <span className="text-foreground ml-2">{company.corporate_name}</span></div>
                <div><span className="text-muted">Nome Fantasia:</span> <span className="text-foreground ml-2">{company.trade_name || "—"}</span></div>
                <div><span className="text-muted">CNPJ:</span> <span className="text-foreground ml-2">{company.cnpj}</span></div>
                <div><span className="text-muted">Responsável:</span> <span className="text-foreground ml-2">{company.responsible_name}</span></div>
                <div><span className="text-muted">Raio de Entrega:</span> <span className="text-foreground ml-2">{company.delivery_radius_km || "—"} km</span></div>
                <div><span className="text-muted">Categorias:</span> <span className="text-foreground ml-2">{company.service_categories?.join(", ") || "—"}</span></div>
              </div>
            </div>

            {recentDeliveries.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <h3 className="font-semibold text-foreground mb-3">Últimas Entregas</h3>
                <div className="space-y-3">
                  {recentDeliveries.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-medium text-foreground text-sm truncate max-w-[200px]">
                          {d.origin_address} → {d.dest_address}
                        </div>
                        <div className="text-xs text-muted mt-0.5">{new Date(d.created_at).toLocaleString("pt-BR")}</div>
                      </div>
                      <div className="text-right">
                        <span className={"px-2 py-1 rounded-full text-xs font-medium " + deliveryBadge(d.status)}>
                          {deliveryLabel(d.status)}
                        </span>
                        <div className="text-sm font-bold text-primary mt-1">
                          R$ {(d.final_fare || d.estimated_fare || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "drivers" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-foreground mb-3">Motoristas Disponíveis para Entrega</h3>
            <p className="text-sm text-muted mb-4">Motoboys online próximos à sua região</p>
            {driverLoading ? (
              <div className="text-center py-8 text-muted">Buscando motoristas...</div>
            ) : availableDrivers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted mb-4">Nenhum motoboy disponível no momento</p>
                <button onClick={loadAvailableDrivers}
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-full transition-all">
                  Atualizar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {availableDrivers.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                      🛵
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground text-sm">{d.name}</div>
                      <div className="text-xs text-muted">
                        ⭐ {d.rating} • {Math.round(d.distance_meters / 100) / 10} km
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">R$ {d.price_per_km}/km</div>
                      <button
                        onClick={() => {
                          const addr = prompt("Endereço de entrega:")
                          if (addr && addr.trim()) {
                            fetch("/api/orders", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                companyId: user?.id,
                                items: [{ productId: "00000000-0000-0000-0000-000000000000", name: "Entrega", price: 0, quantity: 1 }],
                                deliveryAddress: addr.trim(),
                                deliveryLat: 0,
                                deliveryLng: 0,
                              }),
                            }).then(r => r.json()).then(data => {
                              if (data.id) alert("Pedido criado! ID: " + data.id.slice(0, 8) + "...")
                              else alert("Erro ao criar pedido")
                            }).catch(() => alert("Erro de conexão"))
                          }
                        }}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Solicitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Produtos</h3>
              <Link href="/dashboard/company/register" className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary-hover">
                Adicionar Produto
              </Link>
            </div>
            <p className="text-muted text-center py-8">Gerencie seus produtos na página de cadastro da empresa.</p>
          </div>
        )}

        {activeTab === "subscription" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-foreground mb-3">Assinatura</h3>
            <p className="text-muted text-center py-8">Gerencie seu plano na página de assinatura.</p>
            <Link href="/dashboard/company/subscription"
              className="block w-full text-center bg-primary text-white font-bold px-4 py-3 rounded-xl hover:bg-primary-hover">
              Ver Planos
            </Link>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href="/dashboard/company/register"
            className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm hover:border-primary/40 transition-all">
            <div className="text-2xl mb-1">✏️</div>
            <div className="font-semibold text-foreground">Editar Empresa</div>
            <div className="text-xs text-muted mt-1">Atualizar dados cadastrais</div>
          </Link>
          <Link href="/dashboard/company/subscription"
            className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm hover:border-primary/40 transition-all">
            <div className="text-2xl mb-1">💎</div>
            <div className="font-semibold text-foreground">Assinatura</div>
            <div className="text-xs text-muted mt-1">Gerenciar plano</div>
          </Link>
        </div>
      </main>
    </div>
  )
}
