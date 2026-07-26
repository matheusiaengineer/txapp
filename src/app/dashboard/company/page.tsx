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
  is_featured: boolean
  priority_score: number
  delivery_radius_km: number | null
  min_order_value: number | null
  has_own_delivery: boolean
  needs_delivery_partner: boolean
  service_categories: string[]
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

const TAB_IDS = ["overview", "products", "partners", "subscription"] as const
type TabId = typeof TAB_IDS[number]

export default function CompanyDashboard() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [stats, setStats] = useState<Stats>({
    activeDrivers: 0,
    totalDrivers: 0,
    todayDeliveries: 0,
    monthOrders: 0,
    successRate: 0,
    revenue: 0,
  })
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("overview")

  function tabClass(id: string): string {
    if (activeTab === id) {
      return "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors bg-primary text-black"
    }
    return "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors bg-card-bg-2 text-gray-300 hover:bg-card-bg hover:text-white"
  }

  function statusBadge(status: string): string {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "approved": return "bg-green-500/20 text-green-400 border-green-500/30"
      case "rejected": return "bg-red-500/20 text-red-400 border-red-500/30"
      default: return "bg-gray-500/20 text-gray-400"
    }
  }

  function deliveryBadge(status: string): string {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-400"
      case "confirmed": return "bg-blue-500/20 text-blue-400"
      case "preparing": return "bg-purple-500/20 text-purple-400"
      case "in_delivery": return "bg-cyan-500/20 text-cyan-400"
      case "delivered": return "bg-green-500/20 text-green-400"
      case "cancelled": return "bg-red-500/20 text-red-400"
      default: return "bg-gray-500/20 text-gray-400"
    }
  }

  function deliveryLabel(status: string): string {
    switch (status) {
      case "pending": return "Pendente"
      case "confirmed": return "Confirmado"
      case "preparing": return "Preparando"
      case "in_delivery": return "Em Entrega"
      case "delivered": return "Entregue"
      case "cancelled": return "Cancelado"
      default: return status
    }
  }

  useEffect(() => {
    async function loadData() {
      if (!user) {
        router.push("/auth/login")
        return
      }

      setLoading(true)
      try {
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", user.id)
          .single()

        if (companyError || !companyData) {
          console.error("Company not found:", companyError)
          router.push("/dashboard/company/register")
          return
        }

        setCompany(companyData)

        const { data: drivers } = await supabase
          .from("driver_profiles")
          .select("id, current_live_status")
          .eq("company_id", user.id)
          .limit(100)

        const { data: trips } = await supabase
          .from("trips")
          .select("*")
          .eq("driver_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20)

        if (drivers) {
          const active = drivers.filter(d => d.current_live_status !== "OFFLINE").length
          setStats(prev => ({
            ...prev,
            activeDrivers: active,
            totalDrivers: drivers.length,
          }))
        }

        if (trips) {
          const now = new Date()
          const today = trips.filter(t => new Date(t.created_at).toDateString() === now.toDateString())
          const completed = trips.filter(t => ["COMPLETED", "PAYMENT_CONFIRMED", "FINISHED"].includes(t.status))
          const thisMonth = trips.filter(t => {
            const d = new Date(t.created_at)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          })

          const todayDeliveries = today.filter(t => ["COMPLETED", "PAYMENT_CONFIRMED", "FINISHED"].includes(t.status)).length

          setStats(prev => ({
            ...prev,
            todayDeliveries,
            monthOrders: thisMonth.length,
            successRate: trips.length > 0 ? Math.round((completed.length / trips.length) * 100) : 0,
            revenue: completed.reduce((acc, t) => acc + (t.final_fare || t.estimated_fare || 0), 0),
          }))

          setRecentDeliveries(trips.slice(0, 5))
        }
      } catch (err) {
        console.error("Failed to load company dashboard:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, router])

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-8 bg-card-bg-2 rounded w-3/4" />
          <div className="h-8 bg-card-bg-2 rounded w-1/2" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-card-bg-2 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Link href="/dashboard/company/register" className="bg-primary text-black font-bold px-8 py-4 rounded-full">
          Cadastrar Empresa
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Painel da Empresa</div>
          <div className="font-bold text-lg text-white">{company.trade_name || company.corporate_name}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className={"px-3 py-1 rounded-full text-xs font-medium border " + statusBadge(company.status)}>
            {company.status === "pending" ? "Pendente" : company.status === "approved" ? "Aprovada" : "Rejeitada"}
          </span>
          <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white">Sair</Link>
        </div>
      </header>

      <main className="p-4 pb-24">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="txd-card p-4">
            <div className="text-xs text-gray-400">Motoristas Ativos</div>
            <div className="text-2xl font-bold text-white">{stats.activeDrivers}</div>
          </div>
          <div className="txd-card p-4">
            <div className="text-xs text-gray-400">Total de Motoristas</div>
            <div className="text-2xl font-bold text-white">{stats.totalDrivers}</div>
          </div>
          <div className="txd-card p-4">
            <div className="text-xs text-gray-400">Entregas Hoje</div>
            <div className="text-2xl font-bold text-primary">{stats.todayDeliveries}</div>
          </div>
          <div className="txd-card p-4">
            <div className="text-xs text-gray-400">Entregas Mes</div>
            <div className="text-2xl font-bold text-white">{stats.monthOrders}</div>
          </div>
          <div className="txd-card p-4 col-span-2">
            <div className="text-xs text-gray-400">Taxa de Sucesso</div>
            <div className="text-2xl font-bold text-success">{stats.successRate}%</div>
          </div>
          <div className="txd-card p-4 col-span-2">
            <div className="text-xs text-gray-400">Receita Mes</div>
            <div className="text-2xl font-bold text-white">R$ {stats.revenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {TAB_IDS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as TabId)}
              className={tabClass(tab)}
            >
              {tab === "overview" ? "Visao Geral" : tab === "products" ? "Produtos" : tab === "partners" ? "Parceiros" : "Assinatura"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <>
            <div className="txd-card p-4 mb-6">
              <h3 className="font-semibold text-white mb-3">Informacoes da Empresa</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">Razao Social:</span> <span className="text-white ml-2">{company.corporate_name}</span></div>
                <div><span className="text-gray-400">Nome Fantasia:</span> <span className="text-white ml-2">{company.trade_name || "—"}</span></div>
                <div><span className="text-gray-400">CNPJ:</span> <span className="text-white ml-2">{company.cnpj}</span></div>
                <div><span className="text-gray-400">Responsavel:</span> <span className="text-white ml-2">{company.responsible_name}</span></div>
                <div><span className="text-gray-400">Endereco:</span> <span className="text-white ml-2">{company.address || "—"}</span></div>
                <div><span className="text-gray-400">Raio de Entrega:</span> <span className="text-white ml-2">{company.delivery_radius_km || "—"} km</span></div>
                <div><span className="text-gray-400">Pedido Minimo:</span> <span className="text-white ml-2">R$ {company.min_order_value?.toFixed(2) || "—"}</span></div>
                <div><span className="text-gray-400">Entrega Propria:</span> <span className="text-white ml-2">{company.has_own_delivery ? "Sim" : "Nao"}</span></div>
                <div><span className="text-gray-400">Precisa Parceiro:</span> <span className="text-white ml-2">{company.needs_delivery_partner ? "Sim" : "Nao"}</span></div>
                <div className="col-span-2"><span className="text-gray-400">Categorias:</span> <span className="text-white ml-2">{company.service_categories?.join(", ") || "—"}</span></div>
              </div>
            </div>

            {recentDeliveries.length > 0 && (
              <div className="txd-card p-4">
                <h3 className="font-semibold text-white mb-3">Ultimas Entregas</h3>
                <div className="space-y-3">
                  {recentDeliveries.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-card-bg-2 rounded-xl">
                      <div>
                        <div className="font-medium text-white truncate max-w-[200px]">
                          {d.origin_address} → {d.dest_address}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(d.created_at).toLocaleString("pt-BR")}
                        </div>
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

        {activeTab === "products" && (
          <div className="txd-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Produtos</h3>
              <Link href="/dashboard/company/register" className="bg-primary text-black text-sm font-bold px-4 py-2 rounded-xl">
                Adicionar Produto
              </Link>
            </div>
            <p className="text-gray-400 text-center py-8">Gerencie seus produtos na pagina de cadastro da empresa.</p>
          </div>
        )}

        {activeTab === "partners" && (
          <div className="txd-card p-4">
            <h3 className="font-semibold text-white mb-3">Parceiros de Entrega</h3>
            <p className="text-gray-400 text-center py-8">Lista de motoristas parceiros vinculados a sua empresa.</p>
          </div>
        )}

        {activeTab === "subscription" && (
          <div className="txd-card p-4">
            <h3 className="font-semibold text-white mb-3">Assinatura</h3>
            <p className="text-gray-400 text-center py-8">Gerencie seu plano na pagina de assinatura.</p>
            <Link href="/dashboard/company/subscription" className="block w-full text-center bg-primary text-black font-bold px-4 py-3 rounded-xl mt-4">
              Ver Planos
            </Link>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href="/dashboard/company/register" className="txd-card p-4 text-center border-primary/20">
            <div className="text-2xl mb-1">✏️</div>
            <div className="font-semibold text-white">Editar Empresa</div>
            <div className="text-xs text-gray-400 mt-1">Atualizar dados cadastrais</div>
          </Link>
          <Link href="/dashboard/company/subscription" className="txd-card p-4 text-center border-primary/20">
            <div className="text-2xl mb-1">💎</div>
            <div className="font-semibold text-white">Assinatura</div>
            <div className="text-xs text-gray-400 mt-1">Gerenciar plano</div>
          </Link>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card-bg border-t border-white/5 px-2 py-2 safe-area-bottom">
        <div className="flex justify-around">
          <Link href="/dashboard/company" className={activeTab === "overview" ? "flex flex-col items-center gap-1 text-sm text-primary" : "flex flex-col items-center gap-1 text-sm text-gray-500"}>
            <span className="text-xl">🏢</span>
            <span>Empresa</span>
          </Link>
          <Link href="/dashboard/company" className={activeTab === "products" ? "flex flex-col items-center gap-1 text-sm text-primary" : "flex flex-col items-center gap-1 text-sm text-gray-500"}>
            <span className="text-xl">📦</span>
            <span>Produtos</span>
          </Link>
          <Link href="/dashboard/company/subscription" className={activeTab === "subscription" ? "flex flex-col items-center gap-1 text-sm text-primary" : "flex flex-col items-center gap-1 text-sm text-gray-500"}>
            <span className="text-xl">💎</span>
            <span>Plano</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}