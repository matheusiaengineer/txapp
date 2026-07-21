"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browser";

const MapWithNoSSR = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

export default function DriverMapPage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    supabase.auth.getUser();
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: -19.9167, lng: -43.9345 }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <main className="h-[100dvh] bg-background flex flex-col relative overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="absolute inset-0 z-0">
        {location && <MapWithNoSSR pickupCoords={location} />}
      </div>
      <div className="relative z-10 px-4 pt-3">
        <Link href="/dashboard/driver" className="glass-panel px-3 py-2 inline-flex items-center gap-1 text-sm text-white">
          ← Voltar
        </Link>
      </div>
    </main>
  );
}
