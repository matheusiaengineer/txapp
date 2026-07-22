"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/browser"

const STATUS_STEPS = [
  { key: "DRIVER_ACCEPTED", label: "Aceito", icon: "✅" },
  { key: "GOING_TO_PICKUP", label: "Indo buscar", icon: "🚗" },
  { key: "ARRIVED", label: "Cheguei", icon: "📍" },
  { key: "IN_PROGRESS", label: "Em viagem", icon: "🚀" },
  { key: "PAYMENT_CONFIRMED", label: "Pago", icon: "💰" },
]

const STATUS_INDEX = STATUS_STEPS.reduce((acc, s, i) => ({ ...acc, [s.key]: i }), {} as Record<string, number>)

export default function DriverActiveTripPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [trip, setTrip] = useState<any>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string | null>(null)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [paid, setPaid] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return }
      setUser(data.user)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel("driver-active-trip")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "trips",
        filter: `driver_id=eq.${user.id}`,
      }, (payload) => {
        const newRow = payload.new as any
        if (newRow?.payment_status === "paid" || newRow?.status === "PAYMENT_CONFIRMED" || newRow?.status === "FINISHED" || newRow?.status === "COMPLETED") {
          setPaid(true)
          setTrip(newRow)
          if (audioRef.current) audioRef.current.play()
        } else if (newRow) {
          setTrip(newRow)
        }
      })
      .subscribe()

    fetchActiveTrip()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  async function fetchActiveTrip() {
    if (!user) return
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("driver_id", user.id)
      .in("status", ["DRIVER_ACCEPTED", "GOING_TO_PICKUP", "ARRIVED", "PASSENGER_ON_BOARD", "IN_PROGRESS", "FINISHING", "PAYMENT_CONFIRMED"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setTrip(data)
      if (data.status === "PAYMENT_CONFIRMED") setPaid(true)
    }
  }

  async function handleGenerateQR() {
    if (!trip) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}/generate-payment-qr`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.qrCodeDataUrl) {
        setQrCodeDataUrl(data.qrCodeDataUrl)
        setShowQR(true)
      }
    } catch (err) {
      console.error("Erro ao gerar QR:", err)
    }
    setGenerating(false)
  }

  async function handleGeneratePixQR() {
    if (!trip) return
    setGenerating(true)
    try {
      const res = await fetch("/api/payments/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: trip.id,
          amount: trip.final_fare || trip.estimated_fare || 0,
          driverId: user.id,
          riderId: trip.passenger_id,
        }),
      })
      const data = await res.json()
      if (data.qrCodeUrl) {
        setPixQrCodeUrl(data.qrCodeUrl)
        setShowQR(true)
      } else if (data.qrCode) {
        setPixQrCode(data.qrCode)
        setShowQR(true)
      }
    } catch (err) {
      console.error("Erro ao gerar PIX QR:", err)
    }
    setGenerating(false)
  }

  async function updateStatus(newStatus: string) {
    const res = await fetch("/api/trip/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: trip.id, newStatus }),
    })
    const data = await res.json()
    if (data.success) {
      setTrip((prev: any) => prev ? { ...prev, status: newStatus } : null)
    }
  }

  const currentIdx = trip ? (STATUS_INDEX[trip.status] ?? -1) : -1

  if (!trip && !paid) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-4xl mb-4">🚗</p>
        <h1 className="text-xl font-bold text-white mb-2">Nenhuma corrida ativa</h1>
        <p className="text-sm text-gray-400 mb-6">Você não tem uma corrida em andamento.</p>
        <Link href="/dashboard/driver" className="text-primary font-semibold text-sm">
          ← Voltar ao início
        </Link>
      </main>
    )
  }

  if (paid) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <audio ref={audioRef} src="/sounds/payment-confirmed.mp3" preload="auto" />
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
          <span className="text-4xl text-success">💰</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Pagamento confirmado!</h1>
        <p className="text-lg text-primary font-bold mb-6">
          R$ {trip?.final_fare?.toFixed(2) || trip?.estimated_fare?.toFixed(2)}
        </p>
        <p className="text-sm text-gray-400 mb-8">Você pode liberar o passageiro.</p>
        <Link href="/dashboard/driver" className="bg-primary text-black font-bold px-8 py-3.5 rounded-full">
          Voltar ao início
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="p-4">
        <Link href="/dashboard/driver" className="text-gray-400 text-sm">← Voltar</Link>
      </div>

      <div className="flex-1 p-4 space-y-6">
        <h1 className="text-xl font-bold text-white">Corrida atual</h1>

        {/* Progresso */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {STATUS_STEPS.map((step, i) => {
            const isActive = i === currentIdx
            const isPast = i < currentIdx
            return (
              <div key={step.key}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  isPast ? "bg-success/20 text-success" :
                  isActive ? "bg-primary text-black font-bold" :
                  "bg-card-bg-2 text-gray-500"
                }`}>
                <span>{step.icon}</span>
                <span>{step.label}</span>
              </div>
            )
          })}
        </div>

        {/* Informações da corrida */}
        <div className="txd-card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
            <div className="flex-1">
              <p className="text-sm text-white">{trip?.origin_address}</p>
            </div>
          </div>
          <div className="h-6 border-l-2 border-dashed border-gray-600 ml-1" />
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-error mt-1.5" />
            <div className="flex-1">
              <p className="text-sm text-white">{trip?.dest_address}</p>
            </div>
          </div>
        </div>

        {/* Valor */}
        <div className="txd-card p-4 flex items-center justify-between">
          <span className="text-sm text-gray-400">Valor da corrida</span>
          <span className="text-xl font-bold text-primary">
            R$ {(trip?.final_fare || trip?.estimated_fare || 0).toFixed(2)}
          </span>
        </div>

        {/* Ações */}
        <div className="space-y-3">
          {trip?.status === "DRIVER_ACCEPTED" && (
            <button onClick={() => updateStatus("GOING_TO_PICKUP")}
              className="w-full bg-primary text-black font-bold py-4 rounded-2xl text-lg">
              Iniciar busca
            </button>
          )}

          {trip?.status === "GOING_TO_PICKUP" && (
            <button onClick={() => updateStatus("ARRIVED")}
              className="w-full bg-primary text-black font-bold py-4 rounded-2xl text-lg">
              Cheguei ao destino
            </button>
          )}

          {trip?.status === "ARRIVED" && !showQR && (
            <>
              <button onClick={handleGeneratePixQR} disabled={generating}
                className="w-full bg-success text-white font-bold py-4 rounded-2xl text-lg">
                {generating ? "Gerando..." : "📱 Gerar QR Code PIX"}
              </button>
              <button onClick={handleGenerateQR} disabled={generating}
                className="w-full bg-info text-white font-bold py-4 rounded-2xl text-lg border border-info/30">
                {generating ? "Gerando..." : "💳 QR Code de Pagamento"}
              </button>
              <button onClick={() => updateStatus("PASSENGER_ON_BOARD")}
                className="w-full bg-primary text-black font-bold py-4 rounded-2xl text-lg">
                Passageiro a bordo (pular)
              </button>
            </>
          )}

          {trip?.status === "PASSENGER_ON_BOARD" && (
            <button onClick={() => updateStatus("IN_PROGRESS")}
              className="w-full bg-primary text-black font-bold py-4 rounded-2xl text-lg">
              Iniciar viagem
            </button>
          )}
        </div>

        {/* QR Code em tela cheia */}
        {showQR && (qrCodeDataUrl || pixQrCodeUrl || pixQrCode) && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8"
            onClick={() => setShowQR(false)}>
            <div className="w-64 h-64 md:w-80 md:h-80 bg-white p-4 rounded-2xl flex items-center justify-center">
              {pixQrCodeUrl ? (
                <img src={pixQrCodeUrl} alt="QR Code PIX" className="w-full h-full object-contain" />
              ) : pixQrCode ? (
                <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX" className="w-full h-full object-contain" />
              ) : qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code de Pagamento" className="w-full h-full object-contain" />
              ) : null}
            </div>
            <p className="text-primary font-bold text-lg mt-4">
              R$ {(trip?.final_fare || trip?.estimated_fare || 0).toFixed(2)}
            </p>
            <p className="text-white text-sm mt-2 text-center">
              Peça para o passageiro escanear com o banco<br />
              ou clique para fechar
            </p>
            <p className="text-gray-400 text-xs mt-2">Expira em 30 minutos</p>
          </div>
        )}
      </div>
    </main>
  )
}
