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
  const [accountType, setAccountType] = useState<string>("")
  const [online, setOnline] = useState(false)
  const [rides, setRides] = useState<any[]>([])
  const [incomingRequest, setIncomingRequest] = useState<any>(null)
  const [driverLat, setDriverLat] = useState<number | null>(null)
  const [driverLng, setDriverLng] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth/login"); return }
      setUser(data.user)
      loadDriver(data.user.id)
      loadRides(data.user.id)
    })
  }, [])

  async function loadDriver(userId: string) {
    setLoading(true)
    try {
      const [profileRes, vehicleRes, pricingRes, accountRes] = await Promise.all([
        supabase.from("driver_profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("vehicles").select("*").eq("driver_id", userId).maybeSingle(),
        supabase.from("driver_pricing").select("*").eq("driver_id", userId).maybeSingle(),
        supabase.from("profiles").select("account_type").eq("id", userId).maybeSingle(),
      ]);

      if (accountRes.data) {
        setAccountType(accountRes.data.account_type || "")
      }

      if (profileRes.data) {
        const driverData = {
          ...profileRes.data,
          cnh_numero: profileRes.data.cpf ? "Verified" : null,
          tipo_veiculo: vehicleRes.data?.category || null,
          placa: vehicleRes.data?.license_plate || null,
          preco_por_km: pricingRes.data?.min_price_per_km || null,
          status: profileRes.data.status, // approved, pending, rejected
          is_freight: accountType === "freight", // Tag para identificar se é motorista de frete
        };
        setDriver(driverData)
        setOnline(profileRes.data.current_live_status === "ONLINE")
      } else {
        setDriver(null)
      }
    } catch (err) {
      console.error("Error loading driver:", err)
    } finally {
      setLoading(false)
    }
  }

  async function loadRides(userId: string) {
    try {
      const { data } = await supabase
        .from("trips")
        .select("*")
        .eq("driver_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)
      setRides(data || [])
    } catch (err) {
      console.error("Error loading rides:", err)
    }
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
    const newStatus = online ? "OFFLINE" : "ONLINE"
    await supabase.from("driver_profiles").update({ current_live_status: newStatus }).eq("id", user.id)
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

  // KYC States
  const needsKyc = !driver;
  const kycPending = driver && driver.status === "pending";
  const kycRejected = driver && driver.status === "rejected";
  const kycApproved = driver && driver.status === "approved";

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col text-white"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-card-border bg-card-bg/40 backdrop-blur-md sticky top-0 z-50">
        <div>
          <h1 className="text-lg font-bold text-white">{accountType === "driver_moto" ? "Motoboy" : accountType === "driver_car" || accountType === "freight" ? "Motorista" : "Motorista"}</h1>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <Link href="/dashboard/driver/earnings" className="text-primary text-sm font-medium">Ganhos</Link>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full space-y-4 overflow-y-auto">
        {needsKyc && (
          <div className="txd-card p-5 border-warning/30 bg-warning/5 rounded-2xl space-y-3">
            <span className="text-3xl block">🪪</span>
            <p className="text-sm font-bold text-warning">Complete o seu cadastro</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Para começar a receber corridas, envie seus documentos e configure o seu veículo.
            </p>
            <Link href="/dashboard/driver/kyc" className="w-full text-center text-sm bg-primary text-black font-bold px-4 py-3.5 rounded-full inline-block transition-all hover:scale-[1.02] active:scale-[0.98]">
              Fazer cadastro
            </Link>
          </div>
        )}

        {kycPending && (
          <div className="txd-card p-5 border-blue-500/30 bg-blue-500/5 rounded-2xl space-y-3">
            <span className="text-3xl block">⏳</span>
            <p className="text-sm font-bold text-blue-400">Cadastro em análise</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              A nossa equipe está analisando os seus documentos e dados do veículo. Você será notificado por aqui quando for aprovado.
            </p>
            <div className="text-[10px] uppercase font-bold text-blue-400/80 tracking-wider">Prazo: até 2 horas úteis</div>
          </div>
        )}

        {kycRejected && (
          <div className="txd-card p-5 border-error/30 bg-error/5 rounded-2xl space-y-3">
            <span className="text-3xl block">⚠️</span>
            <p className="text-sm font-bold text-error">Cadastro rejeitado</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Algumas informações ou documentos não estavam em conformidade. Refaça o cadastro com fotos nítidas.
            </p>
            <Link href="/dashboard/driver/kyc" className="w-full text-center text-sm bg-error text-white font-bold px-4 py-3.5 rounded-full inline-block transition-all hover:scale-[1.02] active:scale-[0.98]">
              Refazer cadastro
            </Link>
          </div>
        )}

        {kycApproved && (
          <>
            <div className="txd-card p-4 flex items-center justify-between rounded-2xl border-card-border">
              <div>
                <p className="text-sm text-gray-400">Status de Trabalho</p>
                <p className={`text-lg font-bold mt-0.5 ${online ? "text-primary" : "text-gray-500"}`}>
                  {online ? "🟢 Online" : "⚫ Offline"}
                </p>
                {online && <p className="text-xs text-primary mt-1">Ouvindo solicitações de corridas...</p>}
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

            <div className="txd-card p-4 rounded-2xl border-card-border">
              <p className="text-sm text-gray-400 mb-1">Seu preço</p>
              <p className="text-2xl font-bold text-primary">R$ {driver?.preco_por_km || "—"}/km</p>
              <Link href="/dashboard/driver/pricing" className="text-xs text-primary mt-1 inline-block hover:underline">Alterar preço</Link>
            </div>

            <div className="txd-card p-4 rounded-2xl border-card-border">
              <p className="text-sm text-gray-400 mb-1">Veículo cadastrado</p>
              <p className="text-white font-semibold capitalize text-base">{driver?.tipo_veiculo || "—"}</p>
              <p className="text-xs text-gray-500 mt-0.5">{driver?.placa || "—"}</p>
            </div>

            <h3 className="text-sm font-semibold text-white mt-4">Últimas corridas</h3>
            {rides.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center">Nenhuma corrida registrada</p>
            )}
            {rides.map((ride: any) => (
              <div key={ride.id} className="txd-card p-4 flex justify-between items-center rounded-2xl border-card-border">
                <div>
                  <p className="text-sm font-bold text-white">R$ {ride.final_fare || ride.estimated_fare || "—"}</p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{ride.status.toLowerCase().replace(/_/g, " ")}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(ride.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      <nav className="border-t border-card-border px-4 py-2 flex justify-around bg-card-bg/40 backdrop-blur-md sticky bottom-0 z-50">
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

      <div className="fixed right-4 bottom-24 z-[1000]">
        <Link href="/dashboard/driver/drone" className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all cursor-pointer border-2 border-emerald-400/30">
          <span className="text-xl">🚁</span>
        </Link>
        <div className="text-xs text-center mt-1 text-gray-400">Drone</div>
      </div>

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
