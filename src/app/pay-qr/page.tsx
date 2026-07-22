"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

type PageState = "loading" | "pending" | "paid" | "expired" | "error"

function PayQRContent() {
  const params = useSearchParams()
  const pi = params.get("pi")
  const trip = params.get("trip")

  const [state, setState] = useState<PageState>("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [amount, setAmount] = useState(0)
  const [qrCodePix, setQrCodePix] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  useEffect(() => {
    if (!pi || !trip) {
      setState("error")
      setErrorMsg("Link inválido")
      return
    }
    checkPaymentStatus()
  }, [pi, trip])

  async function checkPaymentStatus() {
    try {
      const res = await fetch(`/api/payments/status?pi=${pi}`)
      const data = await res.json()

      if (data.status === "succeeded") {
        setState("paid")
        setAmount(data.amount / 100)
        return
      }

      if (data.status === "expired") {
        setState("expired")
        return
      }

      setState("pending")
      setAmount(data.amount / 100)
      setPaymentId(data.id)
    } catch {
      setState("error")
      setErrorMsg("Erro ao verificar pagamento")
    }
  }

  async function handlePayPix() {
    if (!paymentId) return
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod: "pix",
          metadata: { payment_intent_id: paymentId, trip_id: trip },
        }),
      })
      const data = await res.json()
      if (data.qrCode) {
        setQrCodePix(data.qrCode)
      }
    } catch {
      setErrorMsg("Erro ao gerar PIX")
    }
  }

  async function handlePayCard() {
    if (!paymentId) return
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod: "card",
          metadata: { payment_intent_id: paymentId, trip_id: trip },
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setErrorMsg("Erro ao processar cartão")
    }
  }

  if (state === "loading") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Verificando pagamento...</p>
        </div>
      </main>
    )
  }

  if (state === "paid") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
          <span className="text-4xl text-success">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Pagamento confirmado!</h1>
        <p className="text-lg text-primary font-bold mb-6">R$ {amount.toFixed(2)}</p>
        <p className="text-sm text-gray-400 text-center mb-8">
          O motorista já foi notificado.
          <br />Volte ao app para continuar.
        </p>
      </main>
    )
  }

  if (state === "expired") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-full bg-warning/20 flex items-center justify-center mb-6">
          <span className="text-4xl text-warning">⏰</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">QR Code expirado</h1>
        <p className="text-sm text-gray-400 text-center mb-8">
          O QR Code do motorista expirou.
          <br />Peça para ele gerar um novo.
        </p>
      </main>
    )
  }

  if (state === "error") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center mb-6">
          <span className="text-4xl text-error">!</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Erro</h1>
        <p className="text-sm text-gray-400 mb-4">{errorMsg}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <span className="text-3xl">🚀</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-1">Pagamento TXAP</h1>
        <p className="text-3xl font-bold text-primary mb-8">R$ {amount.toFixed(2)}</p>

        {qrCodePix ? (
          <div className="txd-card p-6 text-center w-full mb-4">
            <h3 className="text-sm font-medium text-white mb-4">Escaneie o QR Code para pagar</h3>
            <img src={qrCodePix} alt="QR Code PIX" className="w-48 h-48 mx-auto mb-4" />
            <p className="text-xs text-gray-400">Use qualquer banco ou carteira digital</p>
          </div>
        ) : (
          <div className="w-full space-y-3">
            <button onClick={handlePayPix}
              className="w-full txd-card p-4 flex items-center gap-3 text-left hover:border-primary/30">
              <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center text-lg">📱</div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">PIX</div>
                <div className="text-xs text-gray-400">Pague com QR Code</div>
              </div>
            </button>

            <button onClick={handlePayCard}
              className="w-full txd-card p-4 flex items-center gap-3 text-left hover:border-primary/30">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center text-lg">💳</div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">Cartão</div>
                <div className="text-xs text-gray-400">Crédito ou débito</div>
              </div>
            </button>
          </div>
        )}

        {errorMsg && (
          <p className="text-error text-sm mt-4">{errorMsg}</p>
        )}
      </div>
    </main>
  )
}

export default function PayQRPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </main>
    }>
      <PayQRContent />
    </Suspense>
  )
}
