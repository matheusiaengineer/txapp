"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browser";

export default function DriverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [online, setOnline] = useState(false);
  const [rides, setRides] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      setUser(data.user);
      loadDriver(data.user.id);
      loadRides(data.user.id);
    });
  }, []);

  async function loadDriver(userId: string) {
    const { data } = await supabase.from("drivers").select("*").eq("id", userId).single();
    setDriver(data);
    if (data?.preco_por_km) setOnline(data.status === "online");
  }

  async function loadRides(userId: string) {
    const { data } = await supabase
      .from("rides")
      .select("*")
      .eq("motorista_id", userId)
      .order("criada_em", { ascending: false })
      .limit(5);
    setRides(data || []);
  }

  async function toggleOnline() {
    const newStatus = online ? "offline" : "online";
    await supabase.from("drivers").update({ status: newStatus }).eq("id", user.id);
    setOnline(!online);
  }

  const needsKyc = !driver?.cnh_numero;
  const needsPricing = !driver?.preco_por_km;

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-card-border">
        <div>
          <h1 className="text-lg font-bold text-white">Motorista</h1>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <Link href="/dashboard/driver/earnings" className="text-primary text-sm font-medium">Ganhos</Link>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full space-y-4 overflow-y-auto">
        {needsKyc && (
          <div className="txd-card p-4 border-warning/30 bg-warning/5">
            <p className="text-sm font-medium text-warning mb-2">Complete seu cadastro</p>
            <Link href="/dashboard/driver/kyc" className="text-sm bg-primary text-black font-bold px-4 py-2 rounded-full inline-block">
              Fazer cadastro
            </Link>
          </div>
        )}

        {!needsKyc && (
          <div className="txd-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className="text-lg font-bold text-white">{online ? "Online" : "Offline"}</p>
            </div>
            <button
              onClick={toggleOnline}
              className={`w-20 h-10 rounded-full transition-all flex items-center px-1 ${
                online ? "bg-primary justify-end" : "bg-gray-600 justify-start"
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${online ? "bg-white" : "bg-gray-400"}`} />
            </button>
          </div>
        )}

        {!needsKyc && (
          <>
            <div className="txd-card p-4">
              <p className="text-sm text-gray-400 mb-1">Seu preço</p>
              <p className="text-2xl font-bold text-primary">R$ {driver?.preco_por_km || "—"}/km</p>
              <Link href="/dashboard/driver/pricing" className="text-xs text-primary mt-1 inline-block">Alterar</Link>
            </div>

            <div className="txd-card p-4">
              <p className="text-sm text-gray-400 mb-1">Veículo</p>
              <p className="text-white font-medium capitalize">{driver?.tipo_veiculo || "—"}</p>
              <p className="text-xs text-gray-500">{driver?.placa || "—"}</p>
            </div>

            <h3 className="text-sm font-semibold text-white mt-4">Últimas corridas</h3>
            {rides.length === 0 && (
              <p className="text-sm text-gray-500">Nenhuma corrida ainda</p>
            )}
            {rides.map((ride: any) => (
              <div key={ride.id} className="txd-card p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm text-white">R$ {ride.valor_total || "—"}</p>
                  <p className="text-xs text-gray-400 capitalize">{ride.status}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(ride.criada_em).toLocaleDateString()}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      <nav className="border-t border-card-border px-4 py-2 flex justify-around">
        <Link href="/dashboard/driver" className="flex flex-col items-center text-primary text-xs gap-1">
          <span>🏠</span><span>Início</span>
        </Link>
        <Link href="/dashboard/driver/map" className="flex flex-col items-center text-gray-500 text-xs gap-1">
          <span>🗺️</span><span>Mapa</span>
        </Link>
        <Link href="/dashboard/driver/trips" className="flex flex-col items-center text-gray-500 text-xs gap-1">
          <span>📋</span><span>Viagens</span>
        </Link>
        <Link href="/dashboard/driver/wallet" className="flex flex-col items-center text-gray-500 text-xs gap-1">
          <span>💰</span><span>Carteira</span>
        </Link>
      </nav>
    </main>
  );
}
