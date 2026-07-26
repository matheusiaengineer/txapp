"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/browser"
import { useUser } from "@/lib/hooks/use-user"

interface EmployeeProfile {
  id: string
  company_id: string
  role: string
  department: string | null
  is_active: boolean
}

interface CompanyData {
  id: string
  corporate_name: string
  trade_name: string | null
  cnpj: string
  address: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  status: string
  service_categories: string[]
}

interface Order {
  id: string
  created_at: string
  status: string
  total_amount: number
  delivery_fee: number
  delivery_address: string
  customer_id: string
  notes: string | null
}

type TabId = "overview" | "orders" | "products" | "profile"

export default function EmployeeDashboard() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [stats, setStats] = useState({
    todayOrders: 0,
    monthOrders: 0,
    pendingOrders: 0,
    revenue: 0,
  })

  function tabClass(id: string): string {
    if (activeTab === id) {
      return "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors bg-primary text-black"
    }
    return "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors bg-card-bg-2 text-gray-300 hover:bg-card-bg hover:text-white"
  }

  function statusBadge(status: string): string {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "confirmed": return "bg-blue-500/20 text-blue-400"
      case "preparing": return "bg-purple-500/20 text-purple-400"
      case "in_delivery": return "bg-cyan-500/20 text-cyan-400"
      case "delivered": return "bg-green-500/20 text-green-400"
      case "cancelled": return "bg-red-500/20 text-red-400"
      default: return "bg-gray-500/20 text-gray-400"
    }
  }

  function statusLabel(status: string): string {
    switch (status) {
      case "pending": return "Pendente"
      case "confirmed": return "Confirmado"
      case "preparing": return "Preparando"
      case "in_delivery": return "Saiu para Entrega"
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
        const { data: employeeData, error: empError } = await supabase
          .from("employee_profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (empError || !employeeData || !employeeData.is_active) {
          console.error("Employee profile not found:", empError)
          router.push("/auth/login")
          return
        }

        setEmployee(employeeData)

        const { data: companyData, error: compError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", employeeData.company_id)
          .single()

        if (compError || !companyData) {
          console.error("Company not found:", compError)
          return
        }

        setCompany(companyData)

        const { data: ordersData } = await supabase
          .from("company_orders")
          .select("*")
          .eq("company_id", employeeData.company_id)
          .order("created_at", { ascending: false })
          .limit(20)

        if (ordersData) {
          const now = new Date()
          const today = ordersData.filter(o => new Date(o.created_at).toDateString() === now.toDateString())
          const thisMonth = ordersData.filter(o => {
            const d = new Date(o.created_at)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          })
          const pending = ordersData.filter(o => ["pending", "confirmed", "preparing"].includes(o.status))
          const completed = ordersData.filter(o => ["delivered"].includes(o.status))

          setStats({
            todayOrders: today.length,
            monthOrders: thisMonth.length,
            pendingOrders: pending.length,
            revenue: completed.reduce((acc, o) => acc + (o.total_amount || 0), 0),
          })

          setOrders(ordersData.slice(0, 10))
        }
      } catch (err) {
        console.error("Failed to load employee dashboard:", err)
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
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-card-bg-2 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!employee || !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Perfil de funcionario nao encontrado</p>
          <Link href="/auth/login" className="bg-primary text-black font-bold px-8 py-4 rounded-full">
            Fazer Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Painel do Funcionario</div>
          <div className="font-bold text-lg text-white">{company.trade_name || company.corporate_name}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className={"px-3 py-1 rounded-full text-xs font-medium border " + statusBadge(employee.role || "")}>
            {(employee.role || "operator").charAt(0).toUpperCase() + (employee.role || "operator").slice(1)}
          </span>
          <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white">Sair</Link>
        </div>
      </header>

      <main className="p-4 pb-24">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="txd-card p-4">
            <div className="text-xs text-gray-400">Pedidos Hoje</div>
            <div className="text-2xl font-bold text-primary">{stats.todayOrders}</div>
          </div>
          <div className="txd-card p-4">
            <div className="text-xs text-gray-400">Pedidos Mes</div>
            <div className="text-2xl font-bold text-white">{stats.monthOrders}</div>
          </div>
          <div className="txd-card p-4">
            <div className="text-xs text-gray-400">Pendentes</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.pendingOrders}</div>
          </div>
          <div className="txd-card p-4">
            <div className="text-xs text-gray-400">Receita Mes</div>
            <div className="text-2xl font-bold text-white">R$ {stats.revenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {(["overview", "orders", "products", "profile"] as TabId[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={tabClass(tab)}
            >
              {tab === "overview" ? "Visao Geral" : tab === "orders" ? "Pedidos" : tab === "products" ? "Produtos" : "Perfil"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <>
            <div className="txd-card p-4 mb-6">
              <h3 className="font-semibold text-white mb-3">Empresa</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">Razao Social:</span> <span className="text-white ml-2">{company.corporate_name}</span></div>
                <div><span className="text-gray-400">Nome Fantasia:</span> <span className="text-white ml-2">{company.trade_name || "—"}</span></div>
                <div><span className="text-gray-400">CNPJ:</span> <span className="text-white ml-2">{company.cnpj}</span></div>
                <div><span className="text-gray-400">Status:</span> <span className="text-white ml-2 capitalize">{company.status}</span></div>
                <div><span className="text-gray-400">Telefone:</span> <span className="text-white ml-2">{company.phone || "—"}</span></div>
                <div><span className="text-gray-400">WhatsApp:</span> <span className="text-white ml-2">{company.whatsapp || "—"}</span></div>
                <div><span className="text-gray-400">Email:</span> <span className="text-white ml-2">{company.email || "—"}</span></div>
                <div><span className="text-gray-400">Endereco:</span> <span className="text-white ml-2">{company.address || "—"}</span></div>
                <div className="col-span-2"><span className="text-gray-400">Categorias:</span> <span className="text-white ml-2">{company.service_categories?.join(", ") || "—"}</span></div>
              </div>
            </div>

            <div className="txd-card p-4">
              <h3 className="font-semibold text-white mb-3">Seu Perfil</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">Funcao:</span> <span className="text-white ml-2 capitalize">{employee.role}</span></div>
                <div><span className="text-gray-400">Departamento:</span> <span className="text-white ml-2">{employee.department || "Nao definido"}</span></div>
                <div><span className="text-gray-400">Status:</span> <span className="text-white ml-2">{employee.is_active ? "Ativo" : "Inativo"}</span></div>
              </div>
            </div>
          </>
        )}

        {activeTab === "orders" && (
          <div className="txd-card p-4">
            <h3 className="font-semibold text-white mb-3">Pedidos Recentes</h3>
            {orders.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhum pedido encontrado</p>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-card-bg-2 rounded-xl">
                    <div>
                      <div className="font-medium text-white truncate max-w-[200px]">
                        {order.delivery_address}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={"px-2 py-1 rounded-full text-xs font-medium " + statusBadge(order.status)}>
                        {statusLabel(order.status)}
                      </span>
                      <div className="text-sm font-bold text-primary mt-1">
                        R$ {(order.total_amount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div className="txd-card p-4">
            <h3 className="font-semibold text-white mb-3">Produtos da Empresa</h3>
            <p className="text-gray-400 text-center py-8">Visualize os produtos cadastrados pela empresa.</p>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="txd-card p-4">
            <h3 className="font-semibold text-white mb-3">Meu Perfil</h3>
            <div className="space-y-4 text-sm">
              <div><span className="text-gray-400">Funcao:</span> <span className="text-white ml-2 capitalize">{employee.role}</span></div>
              <div><span className="text-gray-400">Departamento:</span> <span className="text-white ml-2">{employee.department || "Nao definido"}</span></div>
              <div><span className="text-gray-400">Empresa:</span> <span className="text-white ml-2">{company.trade_name || company.corporate_name}</span></div>
              <div><span className="text-gray-400">CNPJ da Empresa:</span> <span className="text-white ml-2">{company.cnpj}</span></div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href="/dashboard/company" className="txd-card p-4 text-center border-emerald-500/20">
            <div className="text-2xl mb-1">🏢</div>
            <div className="font-semibold text-white">Painel da Empresa</div>
            <div className="text-xs text-gray-400 mt-1">Ver dashboard completo</div>
          </Link>
          <Link href="/dashboard/company/register" className="txd-card p-4 text-center border-primary/20">
            <div className="text-2xl mb-1">✏️</div>
            <div className="font-semibold text-white">Editar Empresa</div>
            <div className="text-xs text-gray-400 mt-1">Atualizar cadastro</div>
          </Link>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card-bg border-t border-white/5 px-2 py-2 safe-area-bottom">
        <div className="flex justify-around">
          <button onClick={() => setActiveTab("overview")} className={activeTab === "overview" ? "flex flex-col items-center gap-1 text-sm text-primary" : "flex flex-col items-center gap-1 text-sm text-gray-500"}>
            <span className="text-xl">📊</span>
            <span>Visao</span>
          </button>
          <button onClick={() => setActiveTab("orders")} className={activeTab === "orders" ? "flex flex-col items-center gap-1 text-sm text-primary" : "flex flex-col items-center gap-1 text-sm text-gray-500"}>
            <span className="text-xl">📋</span>
            <span>Pedidos</span>
          </button>
          <button onClick={() => setActiveTab("products")} className={activeTab === "products" ? "flex flex-col items-center gap-1 text-sm text-primary" : "flex flex-col items-center gap-1 text-sm text-gray-500"}>
            <span className="text-xl">📦</span>
            <span>Produtos</span>
          </button>
          <button onClick={() => setActiveTab("profile")} className={activeTab === "profile" ? "flex flex-col items-center gap-1 text-sm text-primary" : "flex flex-col items-center gap-1 text-sm text-gray-500"}>
            <span className="text-xl">👤</span>
            <span>Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  )
}