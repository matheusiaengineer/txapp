"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase/browser";
import { Search, MapPin, X, Loader2, Navigation } from "lucide-react";

const MapWithNoSSR = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

type Category = "car" | "moto" | "motoboy" | "caminhao" | "van" | "fiorino";

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "car", label: "Carro", icon: "🚗" },
  { id: "moto", label: "Moto", icon: "🏍️" },
  { id: "motoboy", label: "Motoboy", icon: "📦" },
  { id: "caminhao", label: "Caminhão", icon: "🚛" },
  { id: "van", label: "Van", icon: "🚐" },
  { id: "fiorino", label: "Fiorino", icon: "🚚" },
];

const POPULAR_PLACES = [
  { label: "Shopping", icon: "🛍️" },
  { label: "Aeroporto", icon: "✈️" },
  { label: "Hospital", icon: "🏥" },
  { label: "Supermercado", icon: "🛒" },
  { label: "Farmácia", icon: "💊" },
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

export default function PassengerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [category, setCategory] = useState<Category>("car");
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      setUser(data.user);
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        loadNearbyDrivers(pos.coords.latitude, pos.coords.longitude);
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
    <main className="min-h-screen bg-[#f8f9fa]"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

      <div className="overflow-y-auto" style={{ height: "100dvh" }}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-black font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-base text-foreground">TXAP</span>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/passenger/history"
                className="bg-white rounded-xl px-4 py-2 text-xs text-foreground font-medium shadow-sm border border-gray-200 hover:border-gray-300 transition-all">
                📋 Histórico
              </Link>
              <Link href="/dashboard/passenger/wallet"
                className="bg-white rounded-xl px-4 py-2 text-xs text-foreground font-medium shadow-sm border border-gray-200 hover:border-gray-300 transition-all">
                💰 Carteira
              </Link>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="px-4 mb-4">
          <div className="h-[36vh] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            {location && (
              <MapWithNoSSR
                pickupCoords={location}
                destinationCoords={selectedDest ? { lat: selectedDest.lat, lng: selectedDest.lng } : null}
                showLayers={true}
              />
            )}
          </div>
        </div>

        {/* De onde / Para onde */}
        <div className="px-4 mb-4 space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
              <input
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="De onde?"
                className="flex-1 bg-transparent text-foreground text-base placeholder-gray-400 focus:outline-none"
              />
              <button
                onClick={() => { navigator.geolocation.getCurrentPosition((pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })) }}
                className="text-gray-400 hover:text-primary transition-colors"
                title="Usar localização atual"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5 relative">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
              <div className="flex-1 flex items-center gap-2">
                {searching ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" /> : <Search className="w-4 h-4 text-gray-400 shrink-0" />}
                <input
                  type="text"
                  value={destQuery}
                  onChange={(e) => searchAddresses(e.target.value)}
                  placeholder="Para onde vai?"
                  className="flex-1 bg-transparent text-foreground text-base placeholder-gray-400 focus:outline-none"
                />
                {destQuery && (
                  <button
                    onClick={() => { setDestQuery(""); setSuggestions([]); setSelectedDest(null); setDropoff("") }}
                    className="text-gray-400 hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {suggestions.length > 0 && (
              <div className="border-t border-gray-100 max-h-44 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                    <span className="text-sm text-foreground">{s.display}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lugares Populares */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {POPULAR_PLACES.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setDestQuery(p.label);
                  setDropoff(p.label);
                }}
                className="bg-white rounded-full px-4 py-2.5 flex items-center gap-2 shrink-0 shadow-sm border border-gray-200 hover:border-gray-300 transition-all"
              >
                <span>{p.icon}</span>
                <span className="text-xs text-foreground font-medium">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Motoristas Próximos */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Motoristas próximos</h3>
            <button onClick={() => location && loadNearbyDrivers(location.lat, location.lng)}
              className="text-xs text-primary font-medium hover:underline">
              Atualizar
            </button>
          </div>
          {driversLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted">Buscando motoristas...</p>
            </div>
          ) : nearbyDrivers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
              <p className="text-xs text-muted">Nenhum motorista disponível no momento</p>
            </div>
          ) : (
            <div className="space-y-2">
              {nearbyDrivers.slice(0, 3).map((d) => (
                <div key={d.id}
                  className="bg-white rounded-2xl border border-gray-200 p-3.5 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    {d.vehicle_type === "moto" ? "🛵" : "🚕"}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-foreground">{d.name}</div>
                    <div className="text-xs text-muted">
                      ⭐ {d.rating || "5.0"} • {Math.round(d.distance_meters / 10) / 100} km
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">R$ {d.price_per_km}/km</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categorias */}
        <div className="px-4 mb-4">
          <p className="text-sm font-semibold text-foreground mb-3">Escolha o veículo</p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-2xl text-sm transition-all border ${
                  category === c.id
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-white border-gray-200 text-foreground hover:border-gray-300 shadow-sm"
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span className="text-xs">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Solicitar */}
        <div className="px-4 pb-8">
          <button
            onClick={handleRequestRide}
            disabled={!dropoff}
            className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-4 rounded-2xl text-base shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
          >
            Solicitar {CATEGORIES.find(c => c.id === category)?.label}
          </button>
        </div>

      </div>
    </main>
  );
}
