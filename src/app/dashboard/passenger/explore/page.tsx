"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { supabase } from "@/lib/supabase/browser"

const MapWithNoSSR = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false })

const SERVICE_CATEGORIES = [
  { key: "all", label: "Todos", icon: "📍" },
  { key: "water", label: "Água", icon: "💧" },
  { key: "gas", label: "Gás", icon: "🔥" },
  { key: "supermarket", label: "Mercado", icon: "🛒" },
  { key: "pharmacy", label: "Farmácia", icon: "💊" },
  { key: "restaurant", label: "Restaurante", icon: "🍕" },
  { key: "mechanic", label: "Mecânico", icon: "🔧" },
  { key: "electrician", label: "Eletricista", icon: "⚡" },
  { key: "plumber", label: "Encanador", icon: "🔧" },
  { key: "cleaning", label: "Faxina", icon: "🧹" },
  { key: "petshop", label: "Pet Shop", icon: "🐶" },
]

export default function ExplorePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth/login"); return }
      setUser(data.user)
    })

    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: -19.9167, lng: -43.9345 }),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    if (!location) return
    fetchData()
  }, [location, activeFilter])

  async function fetchData() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        lat: location!.lat.toString(),
        lng: location!.lng.toString(),
        radius: "15",
        type: "all",
      })
      if (activeFilter !== "all") params.set("profession", activeFilter)

      const res = await fetch(`/api/directory?${params}`)
      const data = await res.json()
      setCompanies(data.companies || [])
      setProfessionals(data.professionals || [])
    } catch (err) {
      console.error("Erro ao buscar diretório:", err)
    }
    setLoading(false)
  }

  const filteredCompanies = search
    ? companies.filter((c) =>
        (c.trade_name || c.corporate_name)?.toLowerCase().includes(search.toLowerCase())
      )
    : companies

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return (b.priority_score || 0) - (a.priority_score || 0)
  })

  const allPlaces = [
    ...sortedCompanies.map((c: any) => ({ ...c, type: "company" })),
    ...professionals.map((p: any) => ({ ...p, type: "professional" })),
  ]

  return (
    <main className="h-[100dvh] bg-background flex flex-col relative overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>

      <div className="absolute inset-0 z-0">
        {location && <MapWithNoSSR pickupCoords={location} />}
      </div>

      <div className="relative z-10 px-4 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 glass-panel px-3 py-2">
            <span className="text-lg">🌍</span>
            <span className="font-bold text-sm text-white">Explorar</span>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/company/register" className="glass-panel px-3 py-2 text-xs text-white">
              🏢 Cadastrar Empresa
            </Link>
            <Link href="/dashboard/passenger/orders" className="glass-panel px-3 py-2 text-xs text-white">
              📦 Meus Pedidos
            </Link>
          </div>
        </div>

        <div className="glass-panel flex items-center gap-3 px-4 py-3">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresas, serviços..."
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="relative z-10 px-4 mt-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex gap-2">
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveFilter(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                activeFilter === cat.key
                  ? "bg-primary text-black font-bold"
                  : "glass-panel text-gray-300"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-auto pointer-events-none">
        <div className="glass-panel rounded-t-3xl rounded-b-none p-4 pointer-events-auto max-h-[45vh] overflow-y-auto"
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>

          {loading ? (
            <div className="text-center text-gray-400 text-sm py-8">Carregando...</div>
          ) : allPlaces.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              Nenhum serviço encontrado perto de você
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">
                {allPlaces.length} encontrado{allPlaces.length !== 1 ? "s" : ""} por perto
              </p>
              {allPlaces.map((place: any) => (
                <Link
                  key={`${place.type}-${place.id}`}
                  href={place.type === "company" ? `/dashboard/passenger/explore/${place.id}` : "#"}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-card-bg-2 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-lg shrink-0 relative">
                    {place.type === "company" ? "🏢" : "👤"}
                    {place.is_featured && (
                      <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded-full leading-tight">★</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate flex items-center gap-1">
                      {place.trade_name || place.corporate_name || place.profiles?.full_name}
                      {place.is_featured && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-medium">Destaque</span>}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {place.type === "company" ? place.address : place.profession}
                      {place.is_open !== undefined && (
                        <span className={`ml-2 ${place.is_open ? "text-success" : "text-gray-500"}`}>
                          {place.is_open ? "● Aberto" : "○ Fechado"}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {place.delivery_fee ? `R$ ${place.delivery_fee.toFixed(2)}` : "→"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
