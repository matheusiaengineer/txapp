"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase/browser";

const MapWithNoSSR = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

type Category = "carro" | "moto" | "motoboy" | "caminhao" | "van" | "fiorino";

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "carro", label: "Carro", icon: "🚗" },
  { id: "moto", label: "Moto", icon: "🏍️" },
  { id: "motoboy", label: "Motoboy", icon: "📦" },
  { id: "caminhao", label: "Caminhão", icon: "🚛" },
  { id: "van", label: "Van", icon: "🚐" },
  { id: "fiorino", label: "Fiorino", icon: "🚚" },
];

const POPULAR_PLACES = [
  { label: "Shopping", icon: "🛍️", type: "shopping_mall" },
  { label: "Aeroporto", icon: "✈️", type: "airport" },
  { label: "Hospital", icon: "🏥", type: "hospital" },
  { label: "Universidade", icon: "🎓", type: "university" },
  { label: "Supermercado", icon: "🛒", type: "supermarket" },
];

export default function PassengerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [category, setCategory] = useState<Category>("carro");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [showCategory, setShowCategory] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      setUser(data.user);
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: -19.9167, lng: -43.9345 }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  async function handleRequestRide() {
    if (!pickup || !dropoff || !user || !location) return;
    router.push(`/ride?pickup=${encodeURIComponent(pickup)}&dropoff=${encodeURIComponent(dropoff)}&category=${category}&originLat=${location.lat}&originLng=${location.lng}`);
  }

  const handlePlaceSelect = useCallback((placeType: string) => {
    if (!location) return;
    setDropoff(placeType);
    router.push(`/ride?pickup=${encodeURIComponent(pickup || "Localização atual")}&dropoff=${placeType}&category=${category}&originLat=${location.lat}&originLng=${location.lng}`);
  }, [location, category, pickup, router]);

  return (
    <main className="h-[100dvh] bg-background flex flex-col relative overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

      {/* Mapa Full Screen */}
      <div className="absolute inset-0 z-0">
        {location && <MapWithNoSSR pickupCoords={location} />}
      </div>

      {/* Topo: Logo + Busca */}
      <div className="relative z-10 px-4 pt-3 space-y-2 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 glass-panel px-3 py-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-black font-bold text-xs">T</span>
            </div>
            <span className="font-bold text-sm text-white">TXAP</span>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/passenger/history" className="glass-panel px-3 py-2 text-xs text-white pointer-events-auto">
              📋 Histórico
            </Link>
            <Link href="/dashboard/passenger/wallet" className="glass-panel px-3 py-2 text-xs text-white pointer-events-auto">
              💰 Carteira
            </Link>
          </div>
        </div>

        <div className="space-y-2 pointer-events-auto">
          <div className="glass-panel flex items-center gap-3 px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <input
              type="text"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Local de partida"
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
            />
          </div>
          <div className="glass-panel flex items-center gap-3 px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-error shrink-0" />
            <input
              type="text"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              placeholder="Para onde vai?"
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
              onFocus={() => setShowCategory(false)}
            />
          </div>
        </div>
      </div>

      {/* Lugares Populares */}
      <div className="relative z-10 px-4 mt-2 pointer-events-none">
        <div className="flex gap-2 overflow-x-auto pb-1 pointer-events-auto scrollbar-none">
          {POPULAR_PLACES.map((p) => (
            <button
              key={p.type}
              onClick={() => handlePlaceSelect(p.label)}
              className="glass-panel px-4 py-2 flex items-center gap-2 shrink-0"
            >
              <span>{p.icon}</span>
              <span className="text-xs text-white font-medium">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="relative z-10 mt-auto pointer-events-none">
        <div className="glass-panel rounded-t-3xl rounded-b-none p-4 space-y-4 pointer-events-auto"
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
          
          {/* Categorias */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Escolha a categoria</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                    category === c.id
                      ? "bg-primary text-black font-bold"
                      : "bg-card-bg-2 text-gray-300 border border-card-border"
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Solicitar */}
          <button
            onClick={handleRequestRide}
            disabled={!dropoff}
            className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-4 rounded-2xl txd-green-glow-sm disabled:opacity-30 text-lg"
          >
            Solicitar {CATEGORIES.find(c => c.id === category)?.label}
          </button>
        </div>
      </div>
    </main>
  );
}
