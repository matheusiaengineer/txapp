"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/browser"

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return }
      setUser(data.user)
    })
  }, [])

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/companies/${id}`).then((r) => r.json()),
      fetch(`/api/companies/${id}/products`).then((r) => r.json()),
    ]).then(([companyData, productsData]) => {
      setCompany(companyData)
      setProducts(productsData)
      setLoading(false)
    })
  }, [id])

  function addToCart(product: any) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]
    })
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId)
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
        )
      }
      return prev.filter((i) => i.productId !== productId)
    })
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const finalTotal = cartTotal + (company?.delivery_fee || 0)

  async function handleOrder() {
    if (!deliveryAddress) {
      setError("Informe o endereço de entrega")
      return
    }
    setOrdering(true)
    setError(null)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: id,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          deliveryAddress,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erro ao criar pedido")
      } else {
        setOrdered(true)
        setCart([])
      }
    } catch {
      setError("Erro de conexão")
    }
    setOrdering(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </main>
    )
  }

  if (!company) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-400">Empresa não encontrada</p>
      </main>
    )
  }

  if (ordered) {
    return (
      <main className="min-h-[100dvh] bg-background flex flex-col p-4 items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
          <span className="text-3xl text-success">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Pedido realizado!</h1>
        <p className="text-sm text-gray-400 mb-8 text-center">
          A empresa vai preparar seu pedido.
          <br />Acompanhe em "Meus Pedidos".
        </p>
        <Link href="/dashboard/passenger/explore"
          className="bg-primary text-black font-bold px-8 py-3.5 rounded-full">
          Continuar comprando
        </Link>
      </main>
    )
  }

  const groupedProducts = products.reduce((acc: any, p: any) => {
    const cat = p.category || "other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    water: "💧 Água",
    gas: "🔥 Gás",
    supermarket: "🛒 Mercado",
    pharmacy: "💊 Farmácia",
    restaurant: "🍕 Restaurante",
    other: "📦 Outros",
  }

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

      <div className="relative h-48 bg-gradient-to-b from-primary/20 to-background flex items-end p-4">
        <Link href="/dashboard/passenger/explore" className="absolute top-4 left-4 glass-panel px-3 py-2 text-sm text-white">
          ← Voltar
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{company.trade_name || company.corporate_name}</h1>
          <p className="text-sm text-gray-400">{company.address}</p>
          {company.is_open !== undefined && (
            <span className={`text-xs ${company.is_open ? "text-success" : "text-gray-500"}`}>
              {company.is_open ? "● Aberto agora" : "○ Fechado"}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {company.whatsapp && (
          <a href={`https://wa.me/${company.whatsapp}`} target="_blank"
            className="flex items-center gap-2 text-sm text-primary">
            📱 WhatsApp: {company.whatsapp}
          </a>
        )}

        {Object.entries(groupedProducts).map(([category, items]: [string, any]) => (
          <div key={category}>
            <h2 className="text-sm font-semibold text-white mb-3">
              {categoryLabels[category] || `📦 ${category}`}
            </h2>
            <div className="space-y-2">
              {(items as any[]).map((product: any) => (
                <div key={product.id}
                  className="txd-card p-3 flex items-center gap-3">
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name}
                      className="w-14 h-14 rounded-xl object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.description}</p>
                    <p className="text-sm font-bold text-primary mt-1">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="w-8 h-8 rounded-full bg-primary text-black font-bold text-lg flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && !showCart && (
        <div className="sticky bottom-0 p-4 pointer-events-none">
          <button onClick={() => setShowCart(true)}
            className="w-full bg-primary text-black font-bold py-4 rounded-2xl pointer-events-auto text-lg">
            Ver carrinho • R$ {finalTotal.toFixed(2)}
          </button>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="bg-background w-full rounded-t-3xl p-4 max-h-[80vh] overflow-y-auto"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Carrinho</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 text-sm">Fechar</button>
            </div>

            <div className="space-y-2 mb-4">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-white">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      R$ {item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(item.productId)}
                      className="w-7 h-7 rounded-full bg-card-bg-2 text-white flex items-center justify-center text-sm">
                      −
                    </button>
                    <span className="text-white text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => addToCart({ id: item.productId, name: item.name, price: item.price })}
                      className="w-7 h-7 rounded-full bg-primary text-black flex items-center justify-center text-sm">
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-card-border pt-3 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">R$ {cartTotal.toFixed(2)}</span>
              </div>
              {company?.delivery_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Taxa de entrega</span>
                  <span className="text-white">R$ {company.delivery_fee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-primary">R$ {finalTotal.toFixed(2)}</span>
              </div>

              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Endereço de entrega *"
                className="w-full bg-card-bg-2 text-white text-sm px-4 py-3 rounded-xl border border-card-border placeholder-gray-500 focus:outline-none focus:border-primary"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações (opcional)"
                rows={2}
                className="w-full bg-card-bg-2 text-white text-sm px-4 py-3 rounded-xl border border-card-border placeholder-gray-500 focus:outline-none focus:border-primary"
              />

              {error && (
                <p className="text-error text-sm bg-error/10 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                onClick={handleOrder}
                disabled={ordering}
                className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-4 rounded-2xl disabled:opacity-30 text-lg"
              >
                {ordering ? "Processando..." : "Confirmar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
