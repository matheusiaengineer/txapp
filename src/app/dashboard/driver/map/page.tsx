"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";

const MapWithNoSSR = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

export default function DriverMapPage() {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasActiveTrip, setHasActiveTrip] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }

      const { data: trip } = await supabase
        .from("trips")
        .select("id")
        .eq("driver_id", data.user.id)
        .in("status", ["DRIVER_ACCEPTED", "GOING_TO_PICKUP", "ARRIVED", "PASSENGER_ON_BOARD", "IN_PROGRESS"])
        .limit(1)
        .maybeSingle();

      if (trip) setHasActiveTrip(true);
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: -23.561, lng: -46.656 }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <main className="h-[100dvh] bg-background flex flex-col relative overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="absolute inset-0 z-0">
        {location && <MapWithNoSSR pickupCoords={location} showLayers={true} />}
      </div>
      <div className="relative z-10 px-4 pt-3 flex items-center justify-between">
        <Link href="/dashboard/driver" className="glass-panel px-3 py-2 inline-flex items-center gap-1 text-sm text-white">
          ← Voltar
        </Link>
        {hasActiveTrip && (
          <Link href="/dashboard/driver/active-trip" className="bg-primary text-black font-bold px-4 py-2 rounded-full text-sm">
            🚗 Corrida ativa
          </Link>
        )}
      </div>
    </main>
  );
}
