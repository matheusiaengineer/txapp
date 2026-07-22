"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Favorite {
  id: string
  favorite_type: "driver" | "place" | "route"
  driver_id?: string
  driver_name?: string
  driver_rating?: number
  driver_vehicle_type?: string
  place_name?: string
  place_address?: string
  place_icon?: string
  route_from_name?: string
  route_to_name?: string
  created_at: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "driver" | "place" | "route">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/favorites")
      .then(r => r.json())
      .then(data => {
        setFavorites(data.favorites || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = activeTab === "all" ? favorites : favorites.filter(f => f.favorite_type === activeTab)

  const removeFavorite = async (id: string) => {
    await fetch(`/api/favorites/${id}`, { method: "DELETE" })
    setFavorites(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="min-h-screen bg-background text-white p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-2xl">←</button>
        <h1 className="text-xl font-bold">⭐ Meus Favoritos</h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {[
          { key: "all" as const, label: "Todos" },
          { key: "driver" as const, label: "🛵 Motoristas" },
          { key: "place" as const, label: "📍 Lugares" },
          { key: "route" as const, label: "🛣️ Rotas" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key ? "bg-primary text-black" : "bg-card-bg-2 text-gray-400 border border-card-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">⭐</div>
          <div className="text-gray-400">Nenhum favorito ainda</div>
          <p className="text-gray-500 text-sm mt-1">Favorite motoristas, lugares e rotas para acessar rapidamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(fav => (
            <div key={fav.id} className="bg-card-bg-2 border border-card-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-[#00a884] flex items-center justify-center text-xl shrink-0">
                {fav.favorite_type === "driver" && (fav.driver_vehicle_type === "moto" ? "🛵" : "🚕")}
                {fav.favorite_type === "place" && (fav.place_icon || "📍")}
                {fav.favorite_type === "route" && "🛣️"}
              </div>
              <div className="flex-1 min-w-0">
                {fav.favorite_type === "driver" && (
                  <>
                    <div className="font-bold text-sm">{fav.driver_name}</div>
                    <div className="text-xs text-gray-400">⭐ {fav.driver_rating} • Motorista {fav.driver_vehicle_type}</div>
                  </>
                )}
                {fav.favorite_type === "place" && (
                  <>
                    <div className="font-bold text-sm">{fav.place_name}</div>
                    <div className="text-xs text-gray-400 truncate">{fav.place_address}</div>
                  </>
                )}
                {fav.favorite_type === "route" && (
                  <>
                    <div className="font-bold text-sm truncate">{fav.route_from_name} → {fav.route_to_name}</div>
                    <div className="text-xs text-gray-400">Rota salva</div>
                  </>
                )}
              </div>
              <button onClick={() => removeFavorite(fav.id)} className="text-error hover:text-error/80 p-2">
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
