"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/browser"
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/payment/constants"

type PaymentMethod = "carteira" | "pix" | "card"

function PaymentContent() {
  const router = useRouter()
  const params = useSearchParams()
  const tripId = params.get("tripId")
  const success = params.get("success")

  const [user, setUser] = useState<any>(null)
  const [trip, setTrip] = useState<any>(null)
  const [driverProfile, setDriverProfile] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [method, setMethod] = useState<PaymentMethod>("carteira")
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return }
      setUser(data.user)

      if (tripId) {
        const { data: tripData } = await supabase
          .from("trips")
          .select("*, driver_profiles(*)")
          .eq("id", tripId)
          .single()
        setTrip(tripData)
        if (tripData?.driver_id) {
          const { data: dProfile } = await supabase
            .from("profiles")
            .select("full_name, phone, avatar_url")
            .eq("id", tripData.driver_id)
            .single()
          setDriverProfile(dProfile)
        }
      }

      if (success === "true" && tripId) {
        setPaid(true)
      }

      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("profile_id", data.user.id)
        .single()
      setWallet(walletData)
    })
  }, [tripId])

  const finalFare = trip?.final_fare || trip?.estimated_fare || 0

  async function handlePayWithWallet() {
    setLoading(true)
    setError(null)

    if (!wallet || wallet.balance < finalFare) {
      setError("Saldo insuficiente. Use outra forma de pagamento.")
      setLoading(false)
      return
    }

    const commission = finalFare * PLATFORM_COMMISSION_PERCENT
    const driverAmount = finalFare - commission

    const { data: pWallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("profile_id", user.id)
      .single()
    if (!pWallet) { setError("Carteira não encontrada"); setLoading(false); return }

    await supabase.rpc("process_ride_payment", { p_ride_id: tripId })

    await supabase
      .from("trips")
      .update({ status: "PAYMENT_CONFIRMED", final_fare: finalFare, updated_at: new Date().toISOString() })
      .eq("id", tripId)

    setLoading(false)
    setPaid(true)
  }

  async function handlePayWithPix() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          userId: user.id,
          driverId: trip?.driver_id,
          amount: Math.round(finalFare * 100),
          method: "pix",
        }),
      })
      const data = await res.json()
      if (data.qrCode) setQrCode(data.qrCode)
      else setError("Erro ao gerar QR Code")
    } catch {
      setError("Erro de conexão")
    }
    setLoading(false)
  }

  async function handlePayWithCard() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          userId: user.id,
          driverId: trip?.driver_id,
          amount: Math.round(finalFare * 100),
          method: "card",
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError("Erro ao processar pagamento")
      }
    } catch {
      setError("Erro de conexão")
    }
    setLoading(false)
  }

  if (paid) {
    return (
      <main className="min-h-[100dvh] bg-background flex flex-col p-4 items-center justify-center"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
          <span className="text-3xl text-success">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Pagamento confirmado!</h1>
        <p className="text-sm text-gray-400 mb-8">R$ {finalFare.toFixed(2)}</p>
        <Link href="/dashboard/passenger" className="bg-primary text-black font-bold px-8 py-3.5 rounded-full">
          Voltar ao início
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <Link href="/dashboard/passenger" className="text-gray-400 text-sm mb-4">← Voltar</Link>

        <h1 className="text-2xl font-bold text-white mb-2">Pagamento</h1>

        <div className="txd-card p-4 space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Distância</span>
            <span className="text-white">{trip?.estimated_distance_km?.toFixed(1) || "—"} km</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Valor estimado</span>
            <span className="text-white">R$ {trip?.estimated_fare?.toFixed(2) || "—"}</span>
          </div>
          <hr className="border-card-border" />
          <div className="flex justify-between text-lg font-bold">
            <span className="text-white">Total</span>
            <span className="text-primary">R$ {finalFare.toFixed(2)}</span>
          </div>
        </div>

        {wallet && (
          <div className="txd-card p-3 mb-4">
            <p className="text-xs text-gray-400">Saldo da Carteira TXAP</p>
            <p className="text-lg font-bold text-white">R$ {(wallet.balance || 0).toFixed(2)}</p>
          </div>
        )}

        {error && (
          <div className="text-error text-sm bg-error/10 px-4 py-2 rounded-lg mb-4">{error}</div>
        )}

        {qrCode ? (
          <div className="txd-card p-6 text-center">
            <h3 className="text-sm font-medium text-white mb-4">Escaneie o QR Code para pagar</h3>
            <img src={qrCode} alt="QR Code PIX" className="w-48 h-48 mx-auto mb-4" />
            <p className="text-xs text-gray-400">Use qualquer banco ou carteira digital</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handlePayWithWallet}
              disabled={loading}
              className="w-full txd-card p-4 flex items-center gap-3 text-left hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-lg">💰</div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">Carteira TXAP</div>
                <div className="text-xs text-gray-400">Pagar com saldo disponível</div>
              </div>
            </button>

            <button
              onClick={handlePayWithPix}
              disabled={loading}
              className="w-full txd-card p-4 flex items-center gap-3 text-left hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center text-lg">📱</div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">PIX</div>
                <div className="text-xs text-gray-400">QR Code para pagar na hora</div>
              </div>
            </button>

            <button
              onClick={handlePayWithCard}
              disabled={loading}
              className="w-full txd-card p-4 flex items-center gap-3 text-left hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center text-lg">💳</div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">Cartão</div>
                <div className="text-xs text-gray-400">Crédito ou débito</div>
              </div>
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center text-sm text-gray-400 mt-4">Processando...</div>
        )}
      </div>
    </main>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-gray-400">Carregando...</div>}>
      <PaymentContent />
    </Suspense>
  )
}
