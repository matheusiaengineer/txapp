"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

function PixPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tripId = searchParams.get("trip")

  const [pixData, setPixData] = useState<any>(null)
  const [status, setStatus] = useState<"pending" | "paid" | "expired" | "error">("pending")
  const [timeLeft, setTimeLeft] = useState(1800)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (tripId) {
      createPixPayment()
    }
  }, [tripId])

  useEffect(() => {
    if (timeLeft > 0 && status === "pending") {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
      return () => clearInterval(timer)
    }
    if (timeLeft === 0 && status === "pending") {
      setStatus("expired")
    }
  }, [timeLeft, status])

  useEffect(() => {
    if (status === "pending" && pixData?.paymentIntentId) {
      const interval = setInterval(checkPayment, 5000)
      return () => clearInterval(interval)
    }
  }, [status, pixData])

  async function createPixPayment() {
    const res = await fetch("/api/payments/create-pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId,
        amount: 25.0,
        driverId: "uuid-do-motorista",
        riderId: "uuid-do-passageiro",
      }),
    })
    const data = await res.json()
    if (data.error) {
      setStatus("error")
      setMessage(data.error)
      return
    }
    setPixData(data)
  }

  async function checkPayment() {
    if (!pixData?.paymentIntentId) return
    const res = await fetch("/api/payments/verify-pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentIntentId: pixData.paymentIntentId,
        tripId,
      }),
    })
    const data = await res.json()
    if (data.status === "paid") {
      setStatus("paid")
    }
  }

  async function handleCopyCode() {
    if (pixData?.clientSecret) {
      await navigator.clipboard.writeText(pixData.clientSecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  if (status === "paid") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
          <span className="text-4xl text-success">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Pagamento Confirmado!</h1>
        <p className="text-sm text-gray-400 mb-4">O motorista foi notificado.</p>
        <p className="text-xs text-gray-500">Você pode fechar esta tela.</p>
      </main>
    )
  }

  if (status === "expired") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-full bg-warning/20 flex items-center justify-center mb-6">
          <span className="text-4xl text-warning">⏰</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">QR Code expirado</h1>
        <p className="text-sm text-gray-400 mb-4">O tempo para pagamento acabou.</p>
        <button onClick={() => { setStatus("pending"); createPixPayment() }}
          className="bg-primary text-black font-bold px-6 py-3 rounded-full text-sm">
          Gerar novo QR Code
        </button>
      </main>
    )
  }

  if (status === "error") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center mb-6">
          <span className="text-4xl text-error">!</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Erro</h1>
        <p className="text-sm text-gray-400 mb-4">{message}</p>
        <Link href="/dashboard/passenger" className="text-primary text-sm font-semibold">
          Voltar ao início
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col items-center justify-center">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-black text-center mb-2">Pagar com PIX</h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            Escaneie o QR Code ou copie o código
          </p>

          {pixData?.qrCodeUrl ? (
            <div className="flex justify-center mb-6">
              <img src={pixData.qrCodeUrl} alt="QR Code PIX" className="w-56 h-56" />
            </div>
          ) : pixData?.qrCode ? (
            <div className="flex justify-center mb-6">
              <img src={`data:image/png;base64,${pixData.qrCode}`} alt="QR Code PIX" className="w-56 h-56" />
            </div>
          ) : (
            <div className="flex justify-center mb-6">
              <div className="w-56 h-56 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}

          {pixData?.qrCode && (
            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">Código PIX (Copia e Cola):</p>
              <div className="flex gap-2">
                <code className="text-xs break-all flex-1 bg-white p-2 rounded max-h-16 overflow-y-auto">
                  {pixData.clientSecret || pixData.qrCode}
                </code>
                <button onClick={handleCopyCode}
                  className="bg-primary text-black px-3 py-1 rounded text-sm font-bold shrink-0 hover:bg-primary-hover">
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              R$ {pixData?.amount?.toFixed(2) || "—"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Expira em: <span className="text-red-500 font-mono">{formatTime(timeLeft)}</span>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Aguardando pagamento...
          </div>
        </div>
      </div>
    </main>
  )
}

export default function PixPaymentPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <PixPaymentContent />
    </Suspense>
  )
}
