"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase/browser";
import { Search, MapPin, X, Loader2 } from "lucide-react";

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

export default function PassengerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [category, setCategory] = useState<Category>("car");
  const [dropoff, setDropoff] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [destQuery, setDestQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDest, setSelectedDest] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      setUser(data.user);
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: -23.561, lng: -46.656 }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

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

  function confirmDestination() {
    if (destQuery.trim()) {
      setShowCategories(true);
    }
  }

  async function handleRequestRide() {
    const addr = selectedDest?.address || dropoff;
    const lat = selectedDest?.lat || 0;
    const lng = selectedDest?.lng || 0;
    if (!addr || !user || !location) return;
    router.push(
      `/ride?pickup=${encodeURIComponent("Localização atual")}&dropoff=${encodeURIComponent(addr)}&category=${category}&originLat=${location.lat}&originLng=${location.lng}&destLat=${lat}&destLng=${lng}`
    );
  }

  return (
    <main className="h-[100dvh] bg-white flex flex-col relative overflow-hidden">
      {/* Mapa Full Screen */}
      <div className="absolute inset-0 z-0">
        {location && (
          <MapWithNoSSR
            pickupCoords={location}
            destinationCoords={selectedDest ? { lat: selectedDest.lat, lng: selectedDest.lng } : null}
            showLayers={true}
          />
        )}
      </div>

      {/* Top bar */}
      <div className="relative z-20 px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-sm border border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-black font-bold text-xs">T</span>
            </div>
            <span className="font-bold text-sm text-foreground">TXAP</span>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/passenger/history"
              className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 text-xs text-foreground font-medium shadow-sm border border-gray-100 hover:bg-white transition-all">
              📋 Histórico
            </Link>
            <Link href="/dashboard/passenger/wallet"
              className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 text-xs text-foreground font-medium shadow-sm border border-gray-100 hover:bg-white transition-all">
              💰 Carteira
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {searching ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <Search className="w-4 h-4 text-gray-400" />}
            </div>
            <input
              type="text"
              value={destQuery}
              onChange={(e) => searchAddresses(e.target.value)}
              placeholder="Para onde vai?"
              className="w-full bg-transparent text-foreground text-base placeholder-gray-400 pl-10 pr-10 py-4 focus:outline-none"
            />
            {destQuery && (
              <button
                onClick={() => { setDestQuery(""); setSuggestions([]); setSelectedDest(null); setDropoff(""); setShowCategories(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="border-t border-gray-100 max-h-48 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                  <span className="text-sm text-foreground">{s.display}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lugares Populares */}
      <div className="relative z-20 px-4 mb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {POPULAR_PLACES.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setDestQuery(p.label);
                setDropoff(p.label);
              }}
              className="bg-white/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 shrink-0 shadow-sm border border-gray-100 hover:bg-white transition-all"
            >
              <span>{p.icon}</span>
              <span className="text-xs text-foreground font-medium">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Sheet — só aparece depois de escolher destino */}
      {showCategories && (
        <div className="relative z-20 mt-auto pointer-events-none">
          <div className="bg-white rounded-t-3xl shadow-xl border-t border-gray-100 px-5 pt-5 pb-6 pointer-events-auto"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>

            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted">Destino:</p>
              <p className="text-sm text-foreground font-medium truncate ml-2">{destQuery}</p>
            </div>

            <div className="mt-4">
              <p className="text-xs text-muted mb-3 font-medium uppercase tracking-wider">Escolha o veículo</p>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl text-sm transition-all border ${
                      category === c.id
                        ? "bg-primary/10 border-primary text-primary font-bold"
                        : "bg-gray-50 border-gray-100 text-foreground hover:border-gray-200"
                    }`}
                  >
                    <span className="text-2xl">{c.icon}</span>
                    <span className="text-xs">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRequestRide}
              className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-4 rounded-2xl mt-4 text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            >
              Solicitar {CATEGORIES.find(c => c.id === category)?.label}
            </button>

            <button
              onClick={() => setShowCategories(false)}
              className="w-full text-center text-sm text-muted mt-3 py-2 hover:text-foreground transition-colors"
            >
              Alterar destino
            </button>
          </div>
        </div>
      )}

      {/* Se não escolheu destino ainda — hint sutil */}
      {!showCategories && (
        <div className="relative z-20 mt-auto px-4 pb-4 text-center">
          <p className="text-xs text-white/70 drop-shadow-sm">
            Digite seu destino para começar
          </p>
        </div>
      )}
    </main>
  );
}
