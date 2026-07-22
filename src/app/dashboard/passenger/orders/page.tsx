"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/browser"

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  in_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-warning",
  confirmed: "text-info",
  preparing: "text-info",
  in_delivery: "text-primary",
  delivered: "text-success",
  cancelled: "text-error",
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return }
      await fetchOrders()
    })
  }, [])

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders")
      const data = await res.json()
      setOrders(data)
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard/passenger/explore" className="text-gray-400 text-sm">
            ← Explorar
          </Link>
          <h1 className="text-lg font-bold text-white">Meus Pedidos</h1>
          <div className="w-12" />
        </div>

        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Carregando...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            <p className="text-4xl mb-4">📦</p>
            <p>Nenhum pedido ainda</p>
            <Link href="/dashboard/passenger/explore"
              className="text-primary font-semibold mt-2 inline-block">
              Explorar empresas
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <div key={order.id} className="txd-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">
                    {order.companies?.trade_name || "Empresa"}
                  </p>
                  <span className={`text-xs font-medium ${STATUS_COLORS[order.status] || "text-gray-400"}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                <div className="text-xs text-gray-400 space-y-1">
                  {(order.items || []).slice(0, 3).map((item: any, i: number) => (
                    <p key={i}>{item.quantity}x {item.name}</p>
                  ))}
                  {(order.items || []).length > 3 && (
                    <p className="text-gray-500">+{order.items.length - 3} itens</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-card-border">
                  <span className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    R$ {order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
