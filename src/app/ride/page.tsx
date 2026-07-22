"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useGeolocation } from "@/hooks/useGeolocation"
import { supabase } from "@/lib/supabase/browser"

const DriverMap = dynamic(() => import("@/components/maps/DriverMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-card-bg-2 rounded-2xl flex items-center justify-center text-primary text-sm">🗺️ Carregando mapa...</div>
  ),
})

function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371
  const dLat = (coord2[0] - coord1[0]) * Math.PI / 180
  const dLon = (coord2[1] - coord1[1]) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function RideContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { coords } = useGeolocation()

  const preSelectedType = searchParams.get("type") || "taxi"

  const [step, setStep] = useState<"location" | "vehicle" | "driver" | "confirm">("location")
  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [vehicleType, setVehicleType] = useState<"moto" | "carro" | "van">(
    preSelectedType === "moto" || preSelectedType === "motoboy" ? "moto" : "carro"
  )
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!coords || step !== "driver") return
    setLoading(true)
    const typeParam = vehicleType === "moto" ? "moto" : undefined
    fetch(`/api/drivers/nearby?lat=${coords[0]}&lng=${coords[1]}&vehicleType=${typeParam || ""}&radius=5`)
      .then(r => r.json())
      .then(data => {
        setNearbyDrivers(data.drivers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [coords, vehicleType, step])

  const handleCreateRide = async () => {
    if (!coords || !destination || !selectedDriver) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }

    const dist = calculateDistance(coords, [destination.lat, destination.lng])
    const estimatedPrice = selectedDriver.price_per_km * dist

    const res = await fetch("/api/rides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rider_id: user.id,
        driver_id: selectedDriver.id,
        from_lat: coords[0],
        from_lng: coords[1],
        to_lat: destination.lat,
        to_lng: destination.lng,
        from_address: "Localização atual",
        to_address: destination.address,
        vehicle_type: vehicleType,
        estimated_price: Math.round(estimatedPrice * 100) / 100,
      }),
    })

    const data = await res.json()
    if (data.success) {
      router.push(`/ride/${data.rideId || data.tripId}/tracking`)
    }
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <div className="p-4 flex items-center gap-3 border-b border-white/5">
        <button onClick={() => router.back()} className="text-2xl">←</button>
        <h1 className="font-bold text-lg">
          {step === "location" && "📍 Para onde?"}
          {step === "vehicle" && "🚗 Escolha o veículo"}
          {step === "driver" && "👤 Escolha o motorista"}
          {step === "confirm" && "✅ Confirmar corrida"}
        </h1>
      </div>

      <div className="h-[50vh] relative">
        <Suspense fallback={<div className="h-full bg-card-bg-2 flex items-center justify-center text-primary">Carregando mapa...</div>}>
          <DriverMap
            userLocation={coords || [-23.5505, -46.6333]}
            nearbyDrivers={step === "driver" ? nearbyDrivers : []}
            destination={destination ? [destination.lat, destination.lng] : undefined}
            onMapClick={step === "location" ? (lat, lng) => setDestination({ lat, lng, address: "Endereço selecionado" }) : undefined}
            onDriverClick={step === "driver" ? setSelectedDriver : undefined}
          />
        </Suspense>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {step === "location" && (
          <>
            <input
              type="text"
              placeholder="Digite o endereço de destino..."
              className="w-full bg-card-bg-2 border border-card-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            />
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {[{ icon: "🏠", label: "Casa" }, { icon: "💼", label: "Trabalho" }, { icon: "❤️", label: "Namorada" }, { icon: "⭐", label: "Favoritos" }].map(p => (
                <button key={p.label} className="flex-shrink-0 bg-card-bg-2 border border-card-border rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep("vehicle")}
              className="w-full bg-primary text-black font-bold py-4 rounded-xl disabled:opacity-50"
            >
              Continuar
            </button>
          </>
        )}

        {step === "vehicle" && (
          <div className="space-y-3">
            {[
              { type: "moto" as const, icon: "🛵", name: "Moto", desc: "Rápido e ágil", eta: "3-5 min" },
              { type: "carro" as const, icon: "🚕", name: "Carro", desc: "Conforto e segurança", eta: "5-8 min" },
              { type: "van" as const, icon: "🚐", name: "Van", desc: "Para grupos e cargas", eta: "8-12 min" },
            ].map(v => (
              <button
                key={v.type}
                onClick={() => { setVehicleType(v.type); setStep("driver") }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  vehicleType === v.type ? "border-primary bg-primary/10" : "border-card-border bg-card-bg-2"
                }`}
              >
                <span className="text-3xl">{v.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-bold">{v.name}</div>
                  <div className="text-xs text-gray-400">{v.desc}</div>
                </div>
                <div className="text-xs text-primary">{v.eta}</div>
              </button>
            ))}
          </div>
        )}

        {step === "driver" && (
          <>
            {loading ? (
              <div className="text-center py-8 text-gray-400">Buscando motoristas próximos...</div>
            ) : nearbyDrivers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">😕 Nenhum motorista próximo no momento.</div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {nearbyDrivers.map((driver: any) => (
                  <button
                    key={driver.id}
                    onClick={() => { setSelectedDriver(driver); setStep("confirm") }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedDriver?.id === driver.id ? "border-primary bg-primary/10" : "border-card-border bg-card-bg-2"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#00a884] flex items-center justify-center text-lg">
                      {driver.vehicle_type === "moto" ? "🛵" : "🚕"}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-sm">{driver.name}</div>
                      <div className="text-xs text-gray-400">⭐ {driver.rating} • {Math.round(driver.distance_meters / 100) / 10}km</div>
                    </div>
                    <div className="text-right font-bold text-primary">R$ {driver.price_per_km}/km</div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep("vehicle")} className="flex-1 bg-card-bg-2 border border-card-border py-3 rounded-xl text-sm">← Voltar</button>
            </div>
          </>
        )}

        {step === "confirm" && selectedDriver && (
          <>
            <div className="bg-card-bg-2 border border-card-border rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Motorista</span>
                <span className="font-bold">{selectedDriver.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Veículo</span>
                <span>{vehicleType === "moto" ? "🛵 Moto" : "🚕 Carro"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Preço/km</span>
                <span className="text-primary font-bold">R$ {selectedDriver.price_per_km}</span>
              </div>
              <div className="border-t border-card-border pt-2 flex justify-between">
                <span className="font-bold">Total estimado</span>
                <span className="text-primary font-bold text-lg">
                  R$ {(selectedDriver.price_per_km * 5).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("driver")} className="flex-1 bg-card-bg-2 border border-card-border py-3 rounded-xl text-sm">← Voltar</button>
              <button onClick={handleCreateRide} className="flex-1 bg-primary text-black font-bold py-3 rounded-xl text-lg">🚗 Confirmar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function RidePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-primary">Carregando...</div>}>
      <RideContent />
    </Suspense>
  )
}
