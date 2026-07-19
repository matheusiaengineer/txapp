"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Icon } from "@/components/ui/Icon";
import { CountUp } from "@/components/ui/count-up";
import { useAuth } from "./auth-context";

const actionCards = [
  { icon: "car" as const, label: "Passageiro", href: "#" },
  { icon: "package" as const, label: "Entregas", href: "#" },
  { icon: "truck" as const, label: "Fretes", href: "/freight/post" },
  { icon: "building-2" as const, label: "Empresas", href: "#" },
];

export function LocationBadge() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city: string } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setLocating(true);
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt`
            );
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Sua região";
            setUserLocation({ lat: latitude, lng: longitude, city });
          } catch {
            setUserLocation({ lat: latitude, lng: longitude, city: "Sua região" });
          }
          setLocating(false);
        },
        () => {},
        { timeout: 3000, enableHighAccuracy: false }
      );
    }
  }, []);

  const detectLocation = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt`
        );
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Sua região";
        setUserLocation({ lat: latitude, lng: longitude, city });
      } catch { setUserLocation({ lat: latitude, lng: longitude, city: "Sua região" }); }
      setLocating(false);
    }, () => setLocating(false), { timeout: 3000, enableHighAccuracy: false });
  };

  return (
    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
      <span className="w-2 h-2 rounded-full bg-primary animate-txd-pulse-glow" />
      <span className="text-primary text-sm font-medium">
        {locating ? "Detectando sua localização..." :
         userLocation ? `Beta aberto em ${userLocation.city}` :
         "Plataforma em expansão · Beta aberto na sua região"}
      </span>
      {!userLocation && !locating && (
        <button onClick={detectLocation} className="text-xs text-gray-500 hover:text-white transition ml-1 flex items-center gap-1">
          <Icon name="crosshair" size={12} /> Detectar
        </button>
      )}
      {userLocation && (
        <span className="text-xs text-gray-500 flex items-center gap-1 ml-1"><Icon name="crosshair" size={12} />{userLocation.city}</span>
      )}
    </div>
  );
}

export function HeroCtas() {
  const router = useRouter();
  const { openAuth, setRedirect } = useAuth();

  const handleRequestRide = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) { router.push("/ride"); return; }
    setRedirect("/ride");
    openAuth("login", "passenger");
  };

  return (
    <div className="flex flex-wrap gap-3 mb-7">
      <button onClick={handleRequestRide}
        className="bg-primary hover:bg-primary-hover text-black font-bold px-4 md:px-6 py-3 md:py-4 rounded-full transition-all hover:scale-95 txd-green-glow-sm flex items-center gap-2 text-sm md:text-base">
        <Icon name="car" size={20} /> Solicitar corrida
      </button>
      <button onClick={() => openAuth("register", "driver")}
        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-4 md:px-6 py-3 md:py-4 rounded-full transition-all hover:scale-95 flex items-center gap-2 text-sm md:text-base">
        <Icon name="bike" size={20} /> Seja motorista
      </button>
    </div>
  );
}

const heroStats = [
  { num: 2500, suffix: "+", label: "Motoristas" },
  { num: 180000, suffix: "+", label: "Corridas" },
  { num: 49, suffix: "", label: "Avaliação", decimals: 1 },
  { num: 3, suffix: "s", label: "Aceite" },
];

export function HeroStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      {heroStats.map((s, i) => (
        <div key={i} className="text-center p-3 md:p-4 txd-card border-white/5">
          <div className="txd-gradient-text text-xl md:text-3xl font-bold">
            {s.label === "Avaliação" ? (
              <><CountUp end={s.num} decimals={1} duration={2.5} />★</>
            ) : (
              <><CountUp end={s.num} duration={2.5} />{s.suffix}</>
            )}
          </div>
          <div className="text-gray-500 text-xs md:text-sm mt-0.5 md:mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function ActionCards() {
  const router = useRouter();
  const { openAuth } = useAuth();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
      {actionCards.map((a, i) => (
        <button key={i} onClick={() => a.href && a.href !== "#" ? router.push(a.href) : openAuth("register", a.label.toLowerCase())}
          className="txd-card flex items-center gap-2 md:gap-3 p-3 md:p-4 hover:border-primary/30 group">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition">
            <Icon name={a.icon} size={20} className="text-primary" />
          </div>
          <span className="text-xs md:text-sm font-medium text-gray-300">{a.label}</span>
          <Icon name="chevron-right" size={16} className="text-gray-600 ml-auto" />
        </button>
      ))}
    </div>
  );
}
