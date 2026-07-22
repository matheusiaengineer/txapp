"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CompanySubscriptionPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<any[]>([])
  const [currentSub, setCurrentSub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/companies/register").then(r => r.json()),
      fetch("/api/payments").then(r => r.json()),
    ]).then(([company, paymentsData]) => {
      const plansData = paymentsData?.plans || []
      setPlans(plansData)
      setCurrentSub(company?.company_subscriptions?.[0] || null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId)
    try {
      const res = await fetch("/api/companies/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.ok) {
        alert(data.message)
        router.refresh()
      } else {
        alert(data.error || "Erro ao assinar")
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubscribing(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Planos para sua Empresa</h1>
      <p className="text-muted-foreground mb-6">
        Apareça em destaque no mapa do TXAP e receba mais clientes.
      </p>

      {currentSub && (
        <div className="bg-green-50 border border-green-200 p-4 rounded mb-6">
          <p className="text-green-800 font-semibold">
            Plano ativo: {currentSub.company_subscription_plans?.name || "Assinante"}
          </p>
          <p className="text-green-600 text-sm">
            Válido até {new Date(currentSub.current_period_end).toLocaleDateString("pt-BR")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan: any) => (
          <div
            key={plan.id}
            className={`border rounded-lg p-6 flex flex-col ${
              plan.is_featured ? "ring-2 ring-primary border-primary" : ""
            } ${currentSub?.plan_id === plan.id ? "bg-primary/5" : ""}`}
          >
            <div className="flex-1">
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="text-3xl font-bold my-3">
                R$ {Number(plan.price_weekly).toFixed(2).replace(".", ",")}
                <span className="text-sm font-normal text-muted-foreground">/semana</span>
              </p>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <ul className="space-y-2">
                {(plan.features || []).map((f: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={subscribing === plan.id || currentSub?.plan_id === plan.id}
              className={`mt-6 w-full py-2.5 rounded font-semibold text-sm disabled:opacity-50 ${
                plan.price_weekly === 0
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {subscribing === plan.id
                ? "Processando..."
                : currentSub?.plan_id === plan.id
                ? "Plano Atual"
                : plan.price_weekly === 0
                ? "Ativar Grátis"
                : "Assinar"}
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
