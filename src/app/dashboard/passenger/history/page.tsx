"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import Link from "next/link";

export default function PassengerHistoryPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      const { data: t } = await supabase.from("trips").select("*")
        .eq("passenger_id", data.user.id)
        .order("created_at", { ascending: false }).limit(20);
      setTrips(t || []);
    });
  }, []);

  const statusColor = (s: string) => {
    if (s === "COMPLETED" || s === "FINISHED") return "bg-success/10 text-success";
    if (s === "CANCELLED") return "bg-error/10 text-error";
    return "bg-warning/10 text-warning";
  };

  return (
    <main className="min-h-[100dvh] bg-background p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <Link href="/dashboard/passenger" className="text-gray-400 text-sm mb-4 inline-block">← Voltar</Link>
      <h1 className="text-2xl font-bold text-white mb-6">Histórico</h1>
      {trips.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">Nenhuma corrida ainda</p>
          <Link href="/dashboard/passenger" className="text-primary text-sm mt-2 inline-block">Solicitar primeira corrida</Link>
        </div>
      )}
      {trips.map((trip: any) => (
        <div key={trip.id} className="txd-card p-4 mb-2 rounded-2xl border border-card-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-white">{trip.origin_address || "Origem"} → {trip.dest_address || "Destino"}</p>
              <p className="text-xs text-gray-400">R$ {trip.final_fare || trip.estimated_fare || "—"}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(trip.status)}`}>
              {trip.status?.toLowerCase().replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">{new Date(trip.created_at).toLocaleString()}</p>
        </div>
      ))}
    </main>
  );
}
