"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase/browser";
import { Search, MapPin, X, Loader2, Navigation, Star, Clock } from "lucide-react";

const MapWithNoSSR = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

type Category = "car" | "moto" | "motoboy" | "caminhao" | "van" | "fiorino";

interface CategoryDef {
  id: Category;
  label: string;
  icon: string;
  badge?: string;
}

const CATEGORIES: CategoryDef[] = [
  { id: "car", label: "Carro", icon: "🚗", badge: "4 lugares" },
  { id: "moto", label: "Moto", icon: "🏍️", badge: "1 passageiro" },
  { id: "motoboy", label: "Motoboy", icon: "📦", badge: "entregas" },
  { id: "caminhao", label: "Caminhão", icon: "🚛", badge: "cargas" },
  { id: "van", label: "Van", icon: "🚐", badge: "grupos" },
  { id: "fiorino", label: "Fiorino", icon: "🚚", badge: "fretes" },
];

interface PlaceCategory {
  key: string;
  label: string;
  icon: string;
}

const POPULAR_PLACES: PlaceCategory[] = [
  { key: "pharmacy", label: "Farmácia", icon: "💊" },
  { key: "supermarket", label: "Mercado", icon: "🛒" },
  { key: "restaurant", label: "Restaurante", icon: "🍕" },
  { key: "shopping_mall", label: "Shopping", icon: "🛍️" },
  { key: "airport", label: "Aeroporto", icon: "✈️" },
  { key: "hospital", label: "Hospital", icon: "🏥" },
  { key: "mechanic", label: "Mecânico", icon: "🔧" },
  { key: "petshop", label: "Pet Shop", icon: "🐶" },
];

interface Suggestion {
  display: string;
  lat: number;
  lng: number;
}

interface NearbyDriver {
  id: string;
  name: string;
  vehicle_type: string;
  distance_meters: number;
  price_per_km: number;
  rating: number;
}

interface PlaceResult {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  rating?: number;
  distance?: number;
  delivery_fee?: number;
  is_open?: boolean;
}

export default function PassengerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [category, setCategory] = useState<Category>("motoboy");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [destQuery, setDestQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDest, setSelectedDest] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);

  const [selectedPlaceType, setSelectedPlaceType] = useState<string | null>(null);
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      setUser(data.user);
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        loadNearbyDrivers(loc.lat, loc.lng);
      },
      () => {
        const fallback = { lat: -23.561, lng: -46.656 };
        setLocation(fallback);
        loadNearbyDrivers(fallback.lat, fallback.lng);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  async function loadNearbyDrivers(lat: number, lng: number) {
    setDriversLoading(true);
    try {
      const res = await fetch(`/api/drivers/nearby?lat=${lat}&lng=${lng}&radius=10`);
      const data = await res.json();
      setNearbyDrivers(data.drivers || []);
    } catch { setNearbyDrivers([]); }
    setDriversLoading(false);
  }

  async function searchAddresses(q: string) {
    setDestQuery(q);
    if (q.length < 3) { setSuggestions([]); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geocoding?q=${encodeURIComponent(q)}&limit=5`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch { setSuggestions([]); }
      setSearching(false);
    }, 400);
  }

  function selectSuggestion(s: Suggestion) {
    setDestQuery(s.display);
    setSuggestions([]);
    setSelectedDest({ lat: s.lat, lng: s.lng, address: s.display });
    setDropoff(s.display);
    setSelectedPlaceType(null);
    setPlaceResults([]);
  }

  async function handlePlaceClick(place: PlaceCategory) {
    setSelectedPlaceType(place.key);
    setPlacesLoading(true);
    setSelectedPlace(null);
    setSelectedDest(null);
    setDestQuery("");
    setCategory("motoboy");
    setDropoff("");

    try {
      const res = await fetch("/api/companies/featured");
      const data = await res.json();
      const allCompanies: any[] = data.all || [];

      const filtered = allCompanies.filter((c: any) => {
        const cats: string[] = c.service_categories || [];
        return cats.some((cat: string) =>
          cat.toLowerCase().includes(place.key) ||
          cat.toLowerCase().includes(place.label.toLowerCase())
        );
      });

      const withDistance = filtered.map((c: any) => {
        let dist = 0;
        if (location && c.lat && c.lng) {
          const R = 6371;
          const dLat = ((c.lat - location.lat) * Math.PI) / 180;
          const dLng = ((c.lng - location.lng) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos((location.lat * Math.PI) / 180) * Math.cos((c.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
          dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
        return {
          id: c.id,
          name: c.trade_name || c.corporate_name,
          category: place.label,
          lat: c.lat || 0,
          lng: c.lng || 0,
          address: c.address || "",
          rating: c.rating || 4.5,
          distance: Math.round(dist * 10) / 10,
          delivery_fee: c.delivery_fee || 0,
          is_open: c.is_open !== false,
        } as PlaceResult;
      });

      setPlaceResults(withDistance.sort((a: PlaceResult, b: PlaceResult) => (a.distance || 0) - (b.distance || 0)));
    } catch { setPlaceResults([]); }
    setPlacesLoading(false);
  }

  function selectPlace(place: PlaceResult) {
    setSelectedPlace(place);
    setSelectedDest({ lat: place.lat, lng: place.lng, address: place.name });
    setDestQuery(place.name);
    setDropoff(place.name);
  }

  async function handleRequestRide() {
    const addr = selectedDest?.address || dropoff;
    const lat = selectedDest?.lat || 0;
    const lng = selectedDest?.lng || 0;
    if (!addr || !user || !location) return;
    router.push(
      `/ride?pickup=${encodeURIComponent(pickup || "Localização atual")}&dropoff=${encodeURIComponent(addr)}&category=${category}&originLat=${location.lat}&originLng=${location.lng}&destLat=${lat}&destLng=${lng}`
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

      <div className="overflow-y-auto" style={{ height: "100dvh" }}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-md shadow-primary/30">
                <span className="text-black font-bold text-base">T</span>
              </div>
              <div>
                <span className="font-bold text-lg text-foreground tracking-tight">TXAP</span>
                <span className="text-[10px] text-muted ml-2 font-medium uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">Passageiro</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Link href="/dashboard/passenger/history"
                className="bg-white rounded-xl px-3.5 py-2 text-xs text-foreground font-medium shadow-sm border border-gray-200/80 hover:border-gray-300 hover:shadow-md transition-all active:scale-95">
                📋
              </Link>
              <Link href="/dashboard/passenger/wallet"
                className="bg-white rounded-xl px-3.5 py-2 text-xs text-foreground font-medium shadow-sm border border-gray-200/80 hover:border-gray-300 hover:shadow-md transition-all active:scale-95">
                💰
              </Link>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="px-4 mb-3">
          <div className="h-[34vh] w-full rounded-3xl overflow-hidden shadow-lg border border-gray-200/60 relative">
            {location && (
              <MapWithNoSSR
                pickupCoords={location}
                destinationCoords={selectedDest && selectedDest.lat !== 0 ? { lat: selectedDest.lat, lng: selectedDest.lng } : null}
                showLayers={true}
                placeMarkers={placeResults.map(p => ({
                  lat: p.lat,
                  lng: p.lng,
                  name: p.name,
                  category: p.category,
                  icon: POPULAR_PLACES.find(pp => pp.label === p.category)?.icon || "📍",
                }))}
                onPlaceClick={(place) => {
                  const found = placeResults.find(p => p.name === place.name)
                  if (found) selectPlace(found)
                }}
              />
            )}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-semibold text-foreground">
                  {nearbyDrivers.length} motoristas perto
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* De onde / Para onde */}
        <div className="px-4 mb-3">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                <div className="w-px h-3 bg-gray-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
              </div>
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="De onde?"
                  className="w-full bg-transparent text-foreground text-sm placeholder-gray-400 focus:outline-none"
                />
                <div className="relative">
                  <input
                    type="text"
                    value={destQuery}
                    onChange={(e) => {
                      searchAddresses(e.target.value);
                      setSelectedPlaceType(null);
                      setPlaceResults([]);
                    }}
                    placeholder="Para onde vai?"
                    className="w-full bg-transparent text-foreground text-sm placeholder-gray-400 focus:outline-none"
                  />
                  {destQuery && (
                    <button
                      onClick={() => { setDestQuery(""); setSuggestions([]); setSelectedDest(null); setDropoff(""); setSelectedPlace(null); setSelectedPlaceType(null) }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {suggestions.length > 0 && (
              <div className="border-t border-gray-100 max-h-40 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                    <div>
                      <span className="text-sm text-foreground line-clamp-1">{s.display}</span>
                      <span className="text-[10px] text-muted">Endereço</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lugares Populares */}
        <div className="px-4 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {POPULAR_PLACES.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePlaceClick(p)}
                className={`px-4 py-2.5 rounded-full flex items-center gap-2 shrink-0 text-sm font-medium transition-all active:scale-95 border ${
                  selectedPlaceType === p.key
                    ? "bg-primary text-black border-primary shadow-md shadow-primary/20"
                    : "bg-white text-foreground border-gray-200/80 hover:border-gray-300 shadow-sm"
                }`}
              >
                <span className="text-base">{p.icon}</span>
                <span className="text-xs whitespace-nowrap">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Place Results */}
        {selectedPlaceType && (
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold text-foreground">
                {POPULAR_PLACES.find(p => p.key === selectedPlaceType)?.label || "Estabelecimentos"}
              </h3>
              {placeResults.length > 0 && (
                <span className="text-[10px] text-muted bg-gray-100 px-2 py-0.5 rounded-full">{placeResults.length} encontrados</span>
              )}
            </div>
            {placesLoading ? (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-8 text-center shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs text-muted">Buscando...</p>
              </div>
            ) : placeResults.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-8 text-center shadow-sm">
                <p className="text-sm text-muted">Nenhum estabelecimento encontrado nessa categoria</p>
                <p className="text-[10px] text-gray-400 mt-1">Estabelecimentos precisam se cadastrar no TXAP</p>
              </div>
            ) : (
              <div className="space-y-2">
                {placeResults.slice(0, 5).map((place) => (
                  <button
                    key={place.id}
                    onClick={() => selectPlace(place)}
                    className={`w-full bg-white rounded-2xl border p-3.5 flex items-center gap-3 transition-all active:scale-[0.99] text-left ${
                      selectedPlace?.id === place.id
                        ? "border-primary shadow-md shadow-primary/10"
                        : "border-gray-200/80 shadow-sm hover:border-gray-300"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center text-xl">
                      {POPULAR_PLACES.find(p => p.key === selectedPlaceType)?.icon || "📍"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">{place.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] text-muted font-medium">{place.rating}</span>
                        </div>
                        <span className="text-[10px] text-muted">•</span>
                        <span className="text-[10px] text-muted">{place.distance} km</span>
                        {place.is_open && (
                          <>
                            <span className="text-[10px] text-muted">•</span>
                            <span className="text-[10px] text-success font-medium">Aberto</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted">Entrega</div>
                      <div className="text-xs font-bold text-primary">
                        {place.delivery_fee ? `R$ ${place.delivery_fee.toFixed(2)}` : "Grátis"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Motoristas Próximos */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">Motoristas próximos</h3>
            <button onClick={() => location && loadNearbyDrivers(location.lat, location.lng)}
              className="text-[10px] text-primary font-semibold hover:underline">
              Atualizar
            </button>
          </div>
          {driversLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 text-center shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
            </div>
          ) : nearbyDrivers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 text-center shadow-sm">
              <p className="text-xs text-muted">Nenhum motorista disponível agora</p>
            </div>
          ) : (
            <div className="space-y-2">
              {nearbyDrivers.slice(0, 3).map((d) => (
                <div key={d.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-3.5 flex items-center gap-3 shadow-sm">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg shadow-inner">
                    {d.vehicle_type === "moto" ? "🛵" : "🚕"}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-foreground">{d.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] text-muted font-medium">{d.rating || "5.0"}</span>
                      </div>
                      <span className="text-[10px] text-muted">•</span>
                      <Clock className="w-3 h-3 text-muted" />
                      <span className="text-[10px] text-muted">{Math.round((d.distance_meters || 0) / 10) / 100} km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-primary">R$ {d.price_per_km}</div>
                    <div className="text-[10px] text-muted">/km</div>
                  </div>
                </div>
              ))}
              {nearbyDrivers.length > 3 && (
                <button className="w-full text-center text-[10px] text-primary font-semibold py-2 hover:underline">
                  +{nearbyDrivers.length - 3} motoristas
                </button>
              )}
            </div>
          )}
        </div>

        {/* Categorias */}
        <div className="px-4 mb-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Escolha o veículo</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`relative group flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl text-sm transition-all duration-200 border overflow-hidden ${
                  category === c.id
                    ? "bg-gradient-to-b from-primary to-emerald-500 text-black border-primary shadow-lg shadow-primary/25 scale-[1.02]"
                    : "bg-white text-foreground border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300 active:scale-95"
                }`}
                style={{ transform: category === c.id ? "perspective(200px) rotateX(2deg)" : "perspective(200px)" }}
              >
                {category === c.id && (
                  <div className="absolute inset-0 bg-white/10" />
                )}
                <span className={`text-2xl relative z-10 ${category === c.id ? "drop-shadow-lg" : ""}`}
                  style={{ filter: category === c.id ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "none" }}>
                  {c.icon}
                </span>
                <span className={`text-xs font-semibold relative z-10 ${category === c.id ? "text-black" : "text-foreground"}`}>
                  {c.label}
                </span>
                {c.badge && (
                  <span className={`text-[8px] uppercase tracking-wider relative z-10 ${category === c.id ? "text-black/70" : "text-gray-400"}`}>
                    {c.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Solicitar */}
        <div className="px-4 pb-8">
          <button
            onClick={handleRequestRide}
            disabled={!dropoff}
            className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:from-emerald-500 hover:to-primary text-black font-bold py-4 rounded-2xl text-base shadow-xl shadow-primary/30 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
          >
            {dropoff ? `Solicitar ${CATEGORIES.find(c => c.id === category)?.label}` : "Defina um destino"}
          </button>
        </div>

      </div>
    </main>
  );
}
