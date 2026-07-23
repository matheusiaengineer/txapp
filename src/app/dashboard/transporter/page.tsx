"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/browser"
import { useTransporterData } from "@/lib/hooks/use-transporter-data"

export default function TransporterDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [accountType, setAccountType] = useState<string>("")
  const {
    activeFreights,
    todayDeliveries,
    earningsToday,
    earningsWeek,
    recentTrips,
    averageRating,
    loading,
  } = useTransporterData(user?.id)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/auth/login")
        return
      }
      setUser(data.user)
    })
  }, [router])

  useEffect(() => {
    if (!user?.id) return
    supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setAccountType(data.account_type || "")
    })
  }, [user?.id])

  if (!user || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh] bg-background text-white px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">Transportador</h1>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="txd-card p-4 rounded-2xl border border-card-border bg-card-bg">
            <p className="text-xs text-gray-400">Fretes ativos</p>
            <p className="text-2xl font-bold text-primary">{activeFreights}</p>
          </div>
          <div className="txd-card p-4 rounded-2xl border border-card-border bg-card-bg">
            <p className="text-xs text-gray-400">Entregas hoje</p>
            <p className="text-2xl font-bold text-primary">{todayDeliveries}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="txd-card p-4 rounded-2xl border border-card-border bg-card-bg">
            <p className="text-xs text-gray-400">Ganhos hoje</p>
            <p className="text-2xl font-bold text-primary">R$ {earningsToday.toFixed(2)}</p>
          </div>
          <div className="txd-card p-4 rounded-2xl border border-card-border bg-card-bg">
            <p className="text-xs text-gray-400">Ganhos semana</p>
            <p className="text-2xl font-bold text-primary">R$ {earningsWeek.toFixed(2)}</p>
          </div>
        </div>

        <div className="txd-card p-4 rounded-2xl border border-card-border bg-card-bg">
          <p className="text-xs text-gray-400">Avaliação média</p>
          <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
        </div>

        <div className="txd-card p-4 rounded-2xl border border-card-border bg-card-bg">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-white">Últimos fretes</p>
            <span className="text-xs text-gray-400">{recentTrips.length} registros</span>
          </div>
          {recentTrips.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum frete encontrado.</p>
          ) : (
            <div className="space-y-3">
              {recentTrips.slice(0, 5).map((trip: any) => (
                <div key={trip.id} className="border border-card-border rounded-2xl p-3 bg-[#111]">
                  <p className="text-sm font-semibold">R$ {trip.final_fare || trip.estimated_fare || "—"}</p>
                  <p className="text-xs text-gray-400 capitalize">{trip.status.toLowerCase().replace(/_/g, " ")}</p>
                  <p className="text-[11px] text-gray-500 mt-2">{new Date(trip.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
