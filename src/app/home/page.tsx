"use client"

import { useState, Suspense } from "react"
import dynamic from "next/dynamic"
import { useGeolocation } from "@/hooks/useGeolocation"

const DriverMap = dynamic(() => import("@/components/maps/DriverMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1a1a2e] rounded-2xl flex items-center justify-center text-emerald-500 text-sm">
      🗺️ Carregando mapa...
    </div>
  ),
})

const mockDrivers = [
  { id: "1", name: "Joao Silva", lat: -23.5505, lng: -46.6333, vehicleType: "moto" as const, rating: 4.8, pricePerKm: 2.50, isOnline: true },
  { id: "2", name: "Maria Souza", lat: -23.5520, lng: -46.6350, vehicleType: "carro" as const, rating: 4.9, pricePerKm: 3.80, isOnline: true },
  { id: "3", name: "Pedro Costa", lat: -23.5480, lng: -46.6310, vehicleType: "moto" as const, rating: 4.5, pricePerKm: 2.20, isOnline: true },
  { id: "4", name: "Ana Oliveira", lat: -23.5535, lng: -46.6345, vehicleType: "carro" as const, rating: 4.7, pricePerKm: 3.50, isOnline: true },
]

const QUICK_ACTIONS = [
  { icon: "🚕", label: "Taxi", color: "from-amber-500 to-orange-600" },
  { icon: "🛵", label: "Motoboy", color: "from-emerald-500 to-teal-600" },
  { icon: "📦", label: "Frete", color: "from-blue-500 to-indigo-600" },
  { icon: "🏙️", label: "Cidade", color: "from-purple-500 to-pink-600" },
]

export default function HomePage() {
  const { coords, loading, error, getLocation } = useGeolocation()
  const [selectedDriver, setSelectedDriver] = useState<any>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center text-emerald-500">
        📍 Obtendo sua localizacao...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center gap-4">
        <div className="text-red-400">❌ {error}</div>
        <button onClick={getLocation} className="px-6 py-3 bg-emerald-500 text-black rounded-xl font-bold cursor-pointer hover:bg-emerald-400">
          🔄 Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white flex flex-col">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Bem-vindo ao</div>
          <div className="text-xl font-extrabold bg-gradient-to-r from-white to-emerald-500 bg-clip-text text-transparent">TXAP</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-emerald-500">📍 Sao Paulo</span>
          <span className="text-xl cursor-pointer">🔔</span>
        </div>
      </div>

      <div className="px-4 h-[45vh] min-h-[300px]">
        <Suspense fallback={<div className="text-emerald-500">Carregando...</div>}>
          <DriverMap
            userLocation={coords || [-23.5505, -46.6333]}
            nearbyDrivers={mockDrivers}
            onDriverClick={setSelectedDriver}
            onMapClick={(lat, lng) => console.log("Clicou em:", lat, lng)}
          />
        </Suspense>
      </div>

      <div className="px-4 py-4 grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.label}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-gradient-to-br ${action.color} text-white text-xs font-semibold cursor-pointer border-none hover:scale-[1.02] transition-transform`}
          >
            <span className="text-xl">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      <div className="px-4">
        <h3 className="text-sm font-semibold mb-3">Empresas em Destaque</h3>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[140px] bg-white/5 border border-white/10 rounded-xl p-3 shrink-0">
              <div className="w-full h-20 rounded-lg bg-gradient-to-br from-emerald-500/20 to-purple-500/20 mb-2 flex items-center justify-center text-2xl">
                {["🏪", "🍕", "💊"][i - 1]}
              </div>
              <p className="text-xs font-semibold">{["Mercado Silva", "Pizza Nova", "Farmacia Total"][i - 1]}</p>
              <p className="text-[10px] text-gray-500">⭐ 4.{8 - i}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedDriver && (
        <div className="fixed bottom-20 left-4 right-4 bg-[#1a1a2e]/95 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur z-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">{selectedDriver.vehicleType === "moto" ? "🛵" : "🚕"} {selectedDriver.name}</div>
              <div className="text-xs text-gray-400">⭐ {selectedDriver.rating} • R$ {selectedDriver.pricePerKm}/km</div>
            </div>
            <button className="px-5 py-2.5 bg-emerald-500 text-black rounded-xl font-bold cursor-pointer border-none hover:bg-emerald-400 text-sm">
              Chamar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
