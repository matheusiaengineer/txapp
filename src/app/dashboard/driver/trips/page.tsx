"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import Link from "next/link";

export default function DriverTripsPage() {
  const router = useRouter();
  const [rides, setRides] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      const { data: r } = await supabase.from("rides").select("*")
        .eq("motorista_id", data.user.id)
        .order("criada_em", { ascending: false }).limit(20);
      setRides(r || []);
    });
  }, []);

  return (
    <main className="min-h-[100dvh] bg-background p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <Link href="/dashboard/driver" className="text-gray-400 text-sm mb-4 inline-block">← Voltar</Link>
      <h1 className="text-2xl font-bold text-white mb-6">Viagens</h1>
      {rides.length === 0 && <p className="text-sm text-gray-500">Nenhuma viagem ainda</p>}
      {rides.map((ride: any) => (
        <div key={ride.id} className="txd-card p-4 mb-2">
          <div className="flex justify-between">
            <p className="text-sm text-white font-medium">R$ {ride.valor_total || "—"}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              ride.status === "finalizada" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
            }`}>{ride.status}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{new Date(ride.criada_em).toLocaleString()}</p>
        </div>
      ))}
    </main>
  );
}
