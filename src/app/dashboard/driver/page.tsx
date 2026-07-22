"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/browser"

function RideRequestPopup({ request, onAccept, onDecline }: {
  request: any
  onAccept: () => void
  onDecline: () => void
}) {
  const [countdown, setCountdown] = useState(15)

  useEffect(() => {
    if (countdown <= 0) { onDecline(); return }
    const timer = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown, onDecline])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg border border-primary/20 rounded-2xl p-6 max-w-sm w-full">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🚗</div>
          <div className="font-bold text-lg">Nova solicitação!</div>
          <div className="text-sm text-gray-400">{countdown}s para aceitar</div>
        </div>
        <div className="bg-card-bg-2 rounded-xl p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">De:</span>
            <span className="font-medium">{request.from_address || "Localização do passageiro"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Para:</span>
            <span className="font-medium">{request.to_address}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Valor:</span>
            <span className="text-primary font-bold">R$ {request.estimated_price}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onDecline} className="flex-1 bg-card-bg-2 border border-card-border text-white font-bold py-3 rounded-xl">Recusar</button>
          <button onClick={onAccept} className="flex-1 bg-primary text-black font-bold py-3 rounded-xl">Aceitar</button>
        </div>
      </div>
    </div>
  )
}

export default function DriverDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [driver, setDriver] = useState<any>(null)
  const [online, setOnline] = useState(false)
  const [rides, setRides] = useState<any[]>([])
  const [incomingRequest, setIncomingRequest] = useState<any>(null)
  const [driverLat, setDriverLat] = useState<number | null>(null)
  const [driverLng, setDriverLng] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth/login"); return }
      setUser(data.user)
      loadDriver(data.user.id)
      loadRides(data.user.id)
    })
  }, [])

  async function loadDriver(userId: string) {
    const { data } = await supabase.from("drivers").select("*").eq("id", userId).single()
    setDriver(data)
    if (data?.preco_por_km) setOnline(data.status === "online")
  }

  async function loadRides(userId: string) {
    const { data } = await supabase
      .from("rides")
      .select("*")
      .eq("motorista_id", userId)
      .order("criada_em", { ascending: false })
      .limit(5)
    setRides(data || [])
  }

  // Real-time ride requests when online
  useEffect(() => {
    if (!online || !user?.id || driverLat === null || driverLng === null) return

    const channel = supabase
      .channel("driver-rides")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "trips",
        filter: `status=eq.pending`,
      }, (payload) => {
        const trip = payload.new as any
        if (!trip.from_lat || !trip.from_lng) return

        const distance = Math.sqrt(
          Math.pow((driverLat - trip.from_lat) * 111, 2) +
          Math.pow((driverLng - trip.from_lng) * 111 * Math.cos(driverLat * Math.PI / 180), 2)
        )

        if (distance <= 5) {
          setIncomingRequest(trip)
          if (navigator.vibrate) navigator.vibrate([200, 100, 200])
        }
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [online, user?.id, driverLat, driverLng]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track driver location when online
  useEffect(() => {
    if (!online) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setDriverLat(pos.coords.latitude)
        setDriverLng(pos.coords.longitude)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [online])

  async function toggleOnline() {
    const newStatus = online ? "offline" : "online"
    await supabase.from("drivers").update({ status: newStatus }).eq("id", user.id)
    setOnline(!online)
  }

  const handleAccept = useCallback(async () => {
    if (!incomingRequest) return
    await supabase.from("trips").update({ status: "accepted", driver_id: user.id }).eq("id", incomingRequest.id)
    setIncomingRequest(null)
    router.push(`/dashboard/driver/active-trip?tripId=${incomingRequest.id}`)
  }, [incomingRequest, user?.id, router])

  const handleDecline = useCallback(() => {
    setIncomingRequest(null)
  }, [])

  const needsKyc = !driver?.cnh_numero
  const needsPricing = !driver?.preco_por_km

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-card-border">
        <div>
          <h1 className="text-lg font-bold text-white">Motorista</h1>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <Link href="/dashboard/driver/earnings" className="text-primary text-sm font-medium">Ganhos</Link>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full space-y-4 overflow-y-auto">
        {needsKyc && (
          <div className="txd-card p-4 border-warning/30 bg-warning/5">
            <p className="text-sm font-medium text-warning mb-2">Complete seu cadastro</p>
            <Link href="/dashboard/driver/kyc" className="text-sm bg-primary text-black font-bold px-4 py-2 rounded-full inline-block">
              Fazer cadastro
            </Link>
          </div>
        )}

        {!needsKyc && (
          <div className="txd-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className={`text-lg font-bold ${online ? "text-primary" : "text-gray-500"}`}>
                {online ? "🟢 Online" : "⚫ Offline"}
              </p>
              {online && <p className="text-xs text-primary mt-1">Ouvindo solicitações...</p>}
            </div>
            <button
              onClick={toggleOnline}
              className={`w-20 h-10 rounded-full transition-all flex items-center px-1 ${
                online ? "bg-primary justify-end" : "bg-gray-600 justify-start"
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${online ? "bg-white" : "bg-gray-400"}`} />
            </button>
          </div>
        )}

        {!needsKyc && (
          <>
            <div className="txd-card p-4">
              <p className="text-sm text-gray-400 mb-1">Seu preço</p>
              <p className="text-2xl font-bold text-primary">R$ {driver?.preco_por_km || "—"}/km</p>
              <Link href="/dashboard/driver/pricing" className="text-xs text-primary mt-1 inline-block">Alterar</Link>
            </div>

            <div className="txd-card p-4">
              <p className="text-sm text-gray-400 mb-1">Veículo</p>
              <p className="text-white font-medium capitalize">{driver?.tipo_veiculo || "—"}</p>
              <p className="text-xs text-gray-500">{driver?.placa || "—"}</p>
            </div>

            <h3 className="text-sm font-semibold text-white mt-4">Últimas corridas</h3>
            {rides.length === 0 && (
              <p className="text-sm text-gray-500">Nenhuma corrida ainda</p>
            )}
            {rides.map((ride: any) => (
              <div key={ride.id} className="txd-card p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm text-white">R$ {ride.valor_total || "—"}</p>
                  <p className="text-xs text-gray-400 capitalize">{ride.status}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(ride.criada_em).toLocaleDateString()}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      <nav className="border-t border-card-border px-4 py-2 flex justify-around">
        <Link href="/dashboard/driver" className="flex flex-col items-center text-primary text-xs gap-1">
          <span>🏠</span><span>Início</span>
        </Link>
        <Link href="/dashboard/driver/map" className="flex flex-col items-center text-gray-500 text-xs gap-1">
          <span>🗺️</span><span>Mapa</span>
        </Link>
        <Link href="/dashboard/driver/trips" className="flex flex-col items-center text-gray-500 text-xs gap-1">
          <span>📋</span><span>Viagens</span>
        </Link>
        <Link href="/dashboard/driver/wallet" className="flex flex-col items-center text-gray-500 text-xs gap-1">
          <span>💰</span><span>Carteira</span>
        </Link>
      </nav>

      {incomingRequest && (
        <RideRequestPopup
          request={incomingRequest}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
    </main>
  )
}
