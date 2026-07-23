"use client"

import { useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { useGeolocation } from "@/hooks/useGeolocation"
import { useRouter } from "next/navigation"

const DriverMap = dynamic(() => import("@/components/maps/DriverMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1a1a2e] rounded-2xl flex items-center justify-center text-emerald-500 text-sm">
      🗺️ Carregando mapa...
    </div>
  ),
})

const QUICK_ACTIONS = [
  { icon: "🚕", label: "Taxi", color: "from-amber-500 to-orange-600", type: "taxi" },
  { icon: "🛵", label: "Motoboy", color: "from-emerald-500 to-teal-600", type: "moto" },
  { icon: "📦", label: "Frete", color: "from-blue-500 to-indigo-600", type: "frete" },
  { icon: "🏙️", label: "Cidade", color: "from-purple-500 to-pink-600", type: "cidade" },
]

export default function HomePage() {
  const router = useRouter()
  const { coords, loading, error, getLocation } = useGeolocation()
  const [selectedDriver, setSelectedDriver] = useState<any>(null)
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([])
  const [driversLoading, setDriversLoading] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    if (!coords) return
    setDriversLoading(true)
    fetch(`/api/drivers/nearby?lat=${coords[0]}&lng=${coords[1]}&radius=5`)
      .then(r => r.json())
      .then(data => {
        setNearbyDrivers(data.drivers || [])
        setDriversLoading(false)
      })
      .catch(() => { setNearbyDrivers([]); setDriversLoading(false) })
  }, [coords])

  useEffect(() => {
    fetch("/api/favorites")
      .then(r => r.json())
      .then(data => {
        setFavorites((data.favorites || []).map((f: any) => f.driver_id).filter(Boolean))
      })
      .catch(() => {})
  }, [])

  async function toggleFavorite(driverId: string) {
    if (favorites.includes(driverId)) {
      await fetch(`/api/favorites/${driverId}`, { method: "DELETE" })
      setFavorites(prev => prev.filter(id => id !== driverId))
    } else {
      await fetch(`/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite_type: "driver", driver_id: driverId }),
      })
      setFavorites(prev => [...prev, driverId])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        📍 Obtendo sua localizacao...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-error">❌ {error}</div>
        
        {state.showSettingsPrompt ? (
          <div className="space-y-3 max-w-sm w-full">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">📍 Como ativar a localização:</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong>Safari (iOS/macOS):</strong> Configurações → Safari → Permitir Localização</p>
                <p><strong>Chrome (Android):</strong> Menu 3 pontos → Site settings → Localização → Permitir</p>
                <p><strong>Chrome (iOS):</strong> Settings → Safari → Allow Location</p>
                <p><strong>Firefox:</strong> Menu 3 barras → Site settings → Permissão → Permitir</p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                // For mobile devices, try to open settings app
                if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
                  window.open('settings:', '_self')
                } else {
                  // For desktop, show an alternative way to access settings
                  alert('Para ajustar as configurações de localização:\n\n Safari (iOS/macOS): Configurações → Safari → Permitir Localização\n Chrome/Edge/Firefox: Menu → Configurações → Privacidade e segurança → Permissões do site → Localização')
                }
                // Reset the prompt and try one more time
                setState(prev => ({ ...prev, error: "Tentando novamente...", showSettingsPrompt: false }))
                setTimeout(() => getLocation(false), 500)
              }}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold cursor-pointer hover:bg-emerald-400 transition-all"
            >
              ✅ Ativar Localizacao Agora
            </button>
            
            <button 
              onClick={() => {
                // Skip and continue with limited functionality
                alert('Sem a localização ativada, você pode navegar no mapa mas não encontrará motoristas próximos. Você pode tentar novamente mais tarde.')
                setState(prev => ({ ...prev, error: null, showSettingsPrompt: false, loading: false }))
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl font-bold cursor-pointer hover:bg-gray-500 transition-all"
            >
              Continuar Sem Localizacao
            </button>
          </div>
        ) : (
          <button onClick={() => getLocation(true)} className="px-6 py-3 bg-primary text-black rounded-xl font-bold cursor-pointer hover:bg-primary-hover transition-all">
            🔄 Tentar Novamente
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Bem-vindo ao</div>
          <div className="text-xl font-extrabold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">TXAP</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-primary">📍 Sao Paulo</span>
          <span className="text-xl cursor-pointer">🔔</span>
        </div>
      </div>

      <div className="px-4 h-[45vh] min-h-[300px]">
        <Suspense fallback={<div className="text-primary">Carregando...</div>}>
          <DriverMap
            userLocation={coords || [-23.5505, -46.6333]}
            nearbyDrivers={nearbyDrivers}
            onDriverClick={setSelectedDriver}
            onMapClick={(lat, lng) => console.log("Clicou em:", lat, lng)}
          />
        </Suspense>
      </div>

      {driversLoading && (
        <div className="px-4 py-1 text-xs text-primary">🔄 Buscando motoristas...</div>
      )}

      <div className="px-4 py-4 grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => router.push("/ride?type=" + action.type)}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-gradient-to-br ${action.color} text-white text-xs font-semibold cursor-pointer border-none hover:scale-[1.02] transition-transform`}
          >
            <span className="text-xl">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      <div className="px-4">
        <h3 className="text-sm font-semibold mb-3">Empresas em Destaque</h3>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[140px] bg-card-bg-2 border border-card-border rounded-xl p-3 shrink-0">
              <div className="w-full h-20 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 mb-2 flex items-center justify-center text-2xl">
                {["🏪", "🍕", "💊"][i - 1]}
              </div>
              <p className="text-xs font-semibold">{["Mercado Silva", "Pizza Nova", "Farmacia Total"][i - 1]}</p>
              <p className="text-[10px] text-gray-500">⭐ 4.{8 - i}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedDriver && (
        <div className="fixed bottom-20 left-4 right-4 bg-[#1a1a2e]/95 border border-primary/20 rounded-2xl p-4 backdrop-blur z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="font-bold">{selectedDriver.vehicle_type === "moto" ? "🛵" : "🚕"} {selectedDriver.name}</div>
                <div className="text-xs text-gray-400">⭐ {selectedDriver.rating} • R$ {selectedDriver.price_per_km}/km</div>
              </div>
              <button onClick={() => toggleFavorite(selectedDriver.id)} className="text-lg">
                {favorites.includes(selectedDriver.id) ? "⭐" : "☆"}
              </button>
            </div>
            <button
              onClick={() => router.push(`/ride?driverId=${selectedDriver.id}&type=${selectedDriver.vehicle_type}`)}
              className="px-5 py-2.5 bg-primary text-black rounded-xl font-bold cursor-pointer border-none hover:bg-primary-hover text-sm"
            >
              Chamar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}