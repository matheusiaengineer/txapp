"use client"

import { useState, useEffect, Suspense, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useGeolocation } from "@/hooks/useGeolocation"
import { supabase } from "@/lib/supabase/browser"
import { Search, MapPin, X, Loader2 } from "lucide-react"

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

const SAVED_PLACES: { label: string; icon: string; template: string }[] = []

function RideContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { coords } = useGeolocation()

  const preSelectedCategory = searchParams.get("category") || "car"
  const initialPickup = searchParams.get("pickup") || ""
  const initialDropoff = searchParams.get("dropoff") || ""
  const initialDestLat = searchParams.get("destLat")
  const initialDestLng = searchParams.get("destLng")

  const [step, setStep] = useState<"location" | "vehicle" | "driver" | "confirm">("location")
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

  // Auto-advance if destination was pre-selected from dashboard
  useEffect(() => {
    if (destination && step === "location" && coords) {
      fetchRoute(coords, [destination.lat, destination.lng])
      setStep("vehicle")
    }
  }, [destination, step, coords])

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

  async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const res = await fetch(`/api/geocoding?q=${encodeURIComponent(address)}&limit=1`)
      const data = await res.json()
      if (data.suggestions && data.suggestions.length > 0) {
        return { lat: data.suggestions[0].lat, lng: data.suggestions[0].lng }
      }
    } catch {}
    return null
  }

  async function searchAddresses(q: string) {
    setDestQuery(q)
    if (q.length < 3) {
      setSuggestions([])
      return
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/geocoding?q=${encodeURIComponent(q)}&limit=5`)
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      } catch {
        setSuggestions([])
      }
      setSearching(false)
    }, 400)
  }

  function selectSuggestion(s: Suggestion) {
    setDestQuery(s.display)
    setSuggestions([])
    setDestination({ lat: s.lat, lng: s.lng, address: s.display })
    if (coords && s.lat !== 0 && s.lng !== 0) {
      fetchRoute(coords, [s.lat, s.lng])
    }
  }

  async function handleSavedPlace(address: string) {
    setDestQuery(address)
    const coords = await geocodeAddress(address)
    if (coords) {
      setDestination({ lat: coords.lat, lng: coords.lng, address })
      if (coords) {
        fetchRoute(useGeolocationCoords(), [coords.lat, coords.lng])
      }
    } else {
      setDestination({ lat: 0, lng: 0, address })
    }
  }

  function useGeolocationCoords(): [number, number] {
    return coords || [-23.5505, -46.6333]
  }

  function handleSetDestination(lat: number, lng: number, address: string) {
    if (lat === 0 && lng === 0) {
      handleSavedPlace(address)
      return
    }
    setDestination({ lat, lng, address })
    setDestQuery(address)
    if (coords && lat !== 0 && lng !== 0) fetchRoute(coords, [lat, lng])
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

  // Realtime subscription for trip status
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

  return (
    <div className="min-h-screen bg-white text-foreground flex flex-col">
      <div className="p-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-foreground text-xl">←</button>
        <h1 className="font-bold text-lg text-foreground">
          {step === "location" && "Para onde?"}
          {step === "vehicle" && "Escolha o veículo"}
          {step === "driver" && "Escolha o motorista"}
          {step === "confirm" && "Confirmar corrida"}
        </h1>
      </div>

      <div className="h-[50vh] relative">
        <Suspense fallback={<div className="h-full bg-gray-100 flex items-center justify-center text-primary">Carregando mapa...</div>}>
          <DriverMap
            userLocation={useGeolocationCoords()}
            nearbyDrivers={step === "driver" ? nearbyDrivers : []}
            destination={destination && destination.lat !== 0 && destination.lng !== 0 ? [destination.lat, destination.lng] : undefined}
            route={routeCoords.length > 0 ? routeCoords : undefined}
            onMapClick={step === "location" ? (lat, lng) => handleSetDestination(lat, lng, "Endereço selecionado no mapa") : undefined}
            onDriverClick={step === "driver" ? setSelectedDriver : undefined}
          />
        </Suspense>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {step === "location" && (
          <>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </div>
              <input
                type="text"
                value={destQuery}
                onChange={(e) => searchAddresses(e.target.value)}
                placeholder="Digite o endereço de destino..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pl-10 pr-10 text-foreground placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              {destQuery && (
                <button
                  onClick={() => { setDestQuery(""); setSuggestions([]); setDestination(null); setRouteCoords([]) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto shadow-sm">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                    <span className="text-sm text-foreground line-clamp-2">{s.display}</span>
                  </button>
                ))}
              </div>
            )}

            {destination && destination.lat !== 0 && routeDistance > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-sm">{(routeDistance / 1000).toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary text-sm">{Math.round(routeDuration / 60)} min</span>
                </div>
              </div>
            )}

            {SAVED_PLACES.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {SAVED_PLACES.map(p => (
                  <button key={p.label} onClick={() => handleSavedPlace(p.template)} className="flex-shrink-0 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm flex items-center gap-2 hover:border-primary/40 transition-colors">
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => destination && destination.lat !== 0 && setStep("vehicle")}
              disabled={!destination || destination.lat === 0}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl disabled:opacity-30 hover:bg-primary-hover transition-all"
            >
              Continuar
            </button>
          </>
        )}

        {step === "vehicle" && (
          <div className="space-y-3">
            {[
              { type: "moto" as const, icon: "🛵", name: "Moto", desc: "Rápido e ágil", eta: "3-5 min" },
              { type: "car" as const, icon: "🚕", name: "Carro", desc: "Conforto e segurança", eta: "5-8 min" },
              { type: "van" as const, icon: "🚐", name: "Van", desc: "Para grupos e cargas", eta: "8-12 min" },
            ].map(v => (
              <button
                key={v.type}
                onClick={() => { setVehicleType(v.type); setStep("driver") }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  vehicleType === v.type ? "border-primary bg-primary/5" : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-3xl">{v.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-bold text-foreground">{v.name}</div>
                  <div className="text-xs text-muted">{v.desc}</div>
                </div>
                <div className="text-xs text-primary">{v.eta}</div>
              </button>
            ))}
          </div>
        )}

        {step === "driver" && (
          <>
            {loading ? (
              <div className="text-center py-8 text-muted">Buscando motoristas próximos...</div>
            ) : nearbyDrivers.length === 0 ? (
              <div className="text-center py-8 text-muted">Nenhum motorista próximo no momento.</div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {nearbyDrivers.map((driver: any) => (
                  <button
                    key={driver.id}
                    onClick={() => { setSelectedDriver(driver); setStep("confirm") }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedDriver?.id === driver.id ? "border-primary bg-primary/5" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#00a884] flex items-center justify-center text-lg text-white">
                      {driver.vehicle_type === "moto" ? "🛵" : "🚕"}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-sm text-foreground">{driver.name}</div>
                      <div className="text-xs text-muted">⭐ {driver.rating} • {Math.round(driver.distance_meters / 100) / 10}km</div>
                    </div>
                    <div className="text-right font-bold text-primary">R$ {driver.price_per_km}/km</div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep("vehicle")} className="flex-1 bg-white border border-gray-200 text-foreground py-3 rounded-xl text-sm hover:bg-gray-50">← Voltar</button>
            </div>
          </>
        )}

        {step === "confirm" && selectedDriver && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 shadow-sm">
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
                  <span className="text-muted">Tempo estimado</span>
                  <span className="text-foreground">{Math.round(routeDuration / 60)} min</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="font-bold text-foreground">Total estimado</span>
                <span className="text-primary font-bold text-lg">
                  R$ {estimatedPrice.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("driver")} className="flex-1 bg-white border border-gray-200 text-foreground py-3 rounded-xl text-sm hover:bg-gray-50">← Voltar</button>
              <button onClick={handleCreateRide} className="flex-1 bg-primary text-white font-bold py-3 rounded-xl text-lg hover:bg-primary-hover">🚗 Confirmar</button>
            </div>
          </>
        )}

        {rideCreated && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-bold text-primary">Procurando motorista...</p>
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
              className="mt-4 px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm text-muted hover:bg-gray-50"
            >
              ← Cancelar e voltar
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
