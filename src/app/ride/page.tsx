"use client"

import { useState, useEffect, Suspense, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useGeolocation } from "@/hooks/useGeolocation"
import { supabase } from "@/lib/supabase/browser"
import { Search, MapPin, X, Loader2, ArrowLeft, ChevronRight } from "lucide-react"

const DriverMap = dynamic(() => import("@/components/maps/DriverMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center text-primary text-sm">Carregando mapa...</div>
  ),
})

interface Suggestion {
  display: string
  lat: number
  lng: number
}

function RideContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { coords } = useGeolocation()

  const preSelectedCategory = searchParams.get("category") || "car"
  const initialPickup = searchParams.get("pickup") || ""
  const initialDropoff = searchParams.get("dropoff") || ""
  const initialDestLat = searchParams.get("destLat")
  const initialDestLng = searchParams.get("destLng")

  const [step, setStep] = useState<"vehicle" | "driver" | "confirm" | "searching">("vehicle")
  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>(
    initialDestLat && initialDestLng && initialDropoff
      ? { lat: parseFloat(initialDestLat), lng: parseFloat(initialDestLng), address: initialDropoff }
      : null
  )
  const [vehicleType, setVehicleType] = useState<"moto" | "car" | "van">(
    preSelectedCategory === "moto" || preSelectedCategory === "motoboy" ? "moto" : "car"
  )
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([])
  const [routeDistance, setRouteDistance] = useState<number>(0)
  const [routeDuration, setRouteDuration] = useState<number>(0)

  const [destQuery, setDestQuery] = useState(initialDropoff || "")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [rideCreated, setRideCreated] = useState(false)
  const [createdTripId, setCreatedTripId] = useState<string | null>(null)
  const [tripStatus, setTripStatus] = useState<string | null>(null)

  async function fetchRoute(origin: [number, number], dest: [number, number]) {
    try {
      const res = await fetch(
        `/api/routing?origin=${origin[0]},${origin[1]}&destination=${dest[0]},${dest[1]}`
      )
      const data = await res.json()
      if (data.polyline && data.polyline.length > 1) {
        setRouteCoords(data.polyline.map((p: { lat: number; lng: number }) => [p.lat, p.lng] as [number, number]))
        setRouteDistance(data.distance || 0)
        setRouteDuration(data.duration || 0)
      }
    } catch (err) {
      console.warn("[RIDE] Erro ao buscar rota:", err)
    }
  }

  useEffect(() => {
    if (destination && coords) {
      fetchRoute(coords, [destination.lat, destination.lng])
    }
  }, [destination, coords])

  function useGeolocationCoords(): [number, number] {
    return coords || [-23.5505, -46.6333]
  }

  useEffect(() => {
    if (!coords || step !== "driver") return
    setLoading(true)
    fetch(`/api/drivers/nearby?lat=${coords[0]}&lng=${coords[1]}&vehicleType=${vehicleType}&radius=5`)
      .then(r => r.json())
      .then(data => {
        setNearbyDrivers(data.drivers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [coords, vehicleType, step])

  useEffect(() => {
    if (!createdTripId) return
    const channel = supabase
      .channel(`trip-${createdTripId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "trips",
        filter: `id=eq.${createdTripId}`,
      }, (payload) => {
        const trip = payload.new as any
        setTripStatus(trip.status)
        if (trip.status === "DRIVER_ACCEPTED" || trip.status === "accepted") {
          router.push(`/dashboard/passenger?tripId=${createdTripId}`)
        }
      })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [createdTripId, router])

  const estimatedPrice = selectedDriver && routeDistance > 0
    ? selectedDriver.price_per_km * (routeDistance / 1000)
    : selectedDriver && routeDistance === 0
      ? selectedDriver.price_per_km * 5
      : 0

  const handleCreateRide = async () => {
    if (!coords || !destination || !selectedDriver) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }

    const distKm = routeDistance > 0 ? routeDistance / 1000 : 5
    const estimatedPrice = selectedDriver.price_per_km * distKm

    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driver_id: selectedDriver.id,
        from_lat: coords[0],
        from_lng: coords[1],
        to_lat: destination.lat,
        to_lng: destination.lng,
        from_address: initialPickup || "Localização atual",
        to_address: destination.address,
        vehicle_type: vehicleType,
        estimated_price: Math.round(estimatedPrice * 100) / 100,
      }),
    })

    const data = await res.json()
    if (data.success) {
      setRideCreated(true)
      setCreatedTripId(data.tripId)
    }
  }

  const vehicleOptions = [
    { type: "moto" as const, icon: "🛵", name: "Moto", desc: "Rápido e ágil" },
    { type: "car" as const, icon: "🚕", name: "Carro", desc: "Conforto e segurança" },
    { type: "van" as const, icon: "🚐", name: "Van", desc: "Para grupos e cargas" },
  ]

  return (
    <div className="min-h-screen bg-white text-foreground flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-base text-foreground">
            {step === "vehicle" && "Escolha o veículo"}
            {step === "driver" && "Escolha o motorista"}
            {step === "confirm" && "Confirmar corrida"}
            {step === "searching" && "Procurando motorista..."}
          </h1>
          {destination && (
            <p className="text-xs text-muted truncate">{destination.address}</p>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 px-4 pb-4">
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <Suspense fallback={<div className="h-full bg-gray-100 flex items-center justify-center text-primary">Carregando mapa...</div>}>
            <DriverMap
              userLocation={useGeolocationCoords()}
              nearbyDrivers={step === "driver" ? nearbyDrivers : []}
              destination={destination && destination.lat !== 0 && destination.lng !== 0 ? [destination.lat, destination.lng] : undefined}
              route={routeCoords.length > 0 ? routeCoords : undefined}
              onDriverClick={step === "driver" ? setSelectedDriver : undefined}
            />
          </Suspense>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="bg-white border-t border-gray-100 px-4 pt-4 pb-6"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>

        {/* Route info */}
        {routeDistance > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <span className="text-muted">{(routeDistance / 1000).toFixed(1)} km</span>
            <span className="text-gray-300">•</span>
            <span className="text-muted">{Math.round(routeDuration / 60)} min</span>
          </div>
        )}

        {step === "vehicle" && (
          <div className="space-y-2">
            {vehicleOptions.map(v => (
              <button
                key={v.type}
                onClick={() => { setVehicleType(v.type); setStep("driver") }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  vehicleType === v.type ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <span className="text-3xl">{v.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-bold text-foreground">{v.name}</div>
                  <div className="text-xs text-muted">{v.desc}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        )}

        {step === "driver" && (
          <>
            {loading ? (
              <div className="text-center py-6 text-muted text-sm">Buscando motoristas próximos...</div>
            ) : nearbyDrivers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted text-sm mb-3">Nenhum motorista próximo no momento.</p>
                <button onClick={() => setStep("vehicle")} className="text-primary text-sm font-medium hover:underline">
                  ← Escolher outro veículo
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {nearbyDrivers.map((driver: any) => (
                  <button
                    key={driver.id}
                    onClick={() => { setSelectedDriver(driver); setStep("confirm") }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      selectedDriver?.id === driver.id ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                      {driver.vehicle_type === "moto" ? "🛵" : "🚕"}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-sm text-foreground">{driver.name}</div>
                      <div className="text-xs text-muted">⭐ {driver.rating} • {Math.round(driver.distance_meters / 100) / 10} km</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary text-sm">R$ {driver.price_per_km}/km</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep("vehicle")} className="w-full text-center text-sm text-muted mt-3 py-2 hover:text-foreground transition-colors">
              ← Voltar
            </button>
          </>
        )}

        {step === "confirm" && selectedDriver && (
          <>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Motorista</span>
                <span className="font-bold text-foreground">{selectedDriver.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Veículo</span>
                <span className="text-foreground">{vehicleType === "moto" ? "🛵 Moto" : vehicleType === "van" ? "🚐 Van" : "🚕 Carro"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Preço/km</span>
                <span className="text-primary font-bold">R$ {selectedDriver.price_per_km}</span>
              </div>
              {routeDistance > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Distância</span>
                  <span className="text-foreground">{(routeDistance / 1000).toFixed(1)} km</span>
                </div>
              )}
              {routeDuration > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Tempo</span>
                  <span className="text-foreground">{Math.round(routeDuration / 60)} min</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-foreground">Total</span>
                <span className="text-primary font-bold text-xl">
                  R$ {estimatedPrice.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("driver")} className="flex-1 bg-gray-100 text-foreground font-medium py-4 rounded-2xl text-sm hover:bg-gray-200 transition-colors">
                ← Voltar
              </button>
              <button onClick={handleCreateRide} className="flex-1 bg-primary hover:bg-primary-hover text-black font-bold py-4 rounded-2xl text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
                Confirmar
              </button>
            </div>
          </>
        )}

        {rideCreated && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-base font-bold text-primary">Procurando motorista...</p>
            <p className="text-sm text-muted text-center">
              {selectedDriver?.name} está sendo notificado
            </p>
            {tripStatus && (
              <p className="text-xs text-primary font-medium">Status: {tripStatus}</p>
            )}
            <button
              onClick={() => {
                setRideCreated(false)
                setCreatedTripId(null)
                setStep("driver")
              }}
              className="mt-2 px-6 py-3 bg-gray-100 rounded-2xl text-sm text-muted hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RidePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-primary">Carregando...</div>}>
      <RideContent />
    </Suspense>
  )
}
