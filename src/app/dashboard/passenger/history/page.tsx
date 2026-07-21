"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import Link from "next/link";

export default function PassengerHistoryPage() {
  const router = useRouter();
  const [rides, setRides] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      const { data: r } = await supabase.from("rides").select("*")
        .eq("passageiro_id", data.user.id)
        .order("criada_em", { ascending: false }).limit(20);
      setRides(r || []);
    });
  }, []);

  return (
    <main className="min-h-[100dvh] bg-background p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <Link href="/dashboard/passenger" className="text-gray-400 text-sm mb-4 inline-block">← Voltar</Link>
      <h1 className="text-2xl font-bold text-white mb-6">Histórico</h1>
      {rides.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">Nenhuma corrida ainda</p>
          <Link href="/dashboard/passenger" className="text-primary text-sm mt-2 inline-block">Solicitar primeira corrida</Link>
        </div>
      )}
      {rides.map((ride: any) => (
        <div key={ride.id} className="txd-card p-4 mb-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-white capitalize">{ride.tipo_veiculo || "Corrida"}</p>
              <p className="text-xs text-gray-400">R$ {ride.valor_total || "—"}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              ride.status === "finalizada" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
            }`}>{ride.status}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">{new Date(ride.criada_em).toLocaleString()}</p>
        </div>
      ))}
    </main>
  );
}
