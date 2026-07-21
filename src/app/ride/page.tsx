"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase/browser";

const MapWithNoSSR = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

const CATEGORY_LABELS: Record<string, string> = {
  carro: "Carro", moto: "Moto", motoboy: "Motoboy",
  caminhao: "Caminhão", van: "Van", fiorino: "Fiorino",
};

function RideContent() {
  const router = useRouter();
  const params = useSearchParams();
  const pickup = params.get("pickup") || "";
  const dropoff = params.get("dropoff") || "";
  const category = params.get("category") || "carro";
  const originLat = parseFloat(params.get("originLat") || "0");
  const originLng = parseFloat(params.get("originLng") || "0");

  const [user, setUser] = useState<any>(null);
  const [rideId, setRideId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("procurando");
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      setUser(data.user);
      requestRide(data.user.id);
    });
  }, []);

  async function requestRide(userId: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("rides")
      .insert([{
        passageiro_id: userId,
        origem_lat: originLat,
        origem_lng: originLng,
        tipo_veiculo: category,
        status: "procurando",
      }])
      .select()
      .single();

    if (!error && data) {
      setRideId(data.id);
      subscribeRide(data.id);
    }
    setLoading(false);
  }

  function subscribeRide(rideId: string) {
    const channel = supabase
      .channel(`ride-${rideId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "rides",
        filter: `id=eq.${rideId}`,
      }, (payload: any) => {
        setStatus(payload.new.status);
        if (payload.new.motorista_id) {
          loadDriver(payload.new.motorista_id);
        }
      })
      .subscribe();
  }

  async function loadDriver(driverId: string) {
    const { data } = await supabase.from("drivers").select("*").eq("id", driverId).single();
    setDriver(data);
  }

  const statusSteps = [
    { key: "procurando", label: "Procurando motorista..." },
    { key: "aceita", label: "Motorista a caminho" },
    { key: "em_corrida", label: "Em corrida" },
    { key: "finalizada", label: "Corrida finalizada" },
  ];

  const currentStepIdx = statusSteps.findIndex(s => s.key === status);

  return (
    <main className="h-[100dvh] bg-background flex flex-col relative overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

      <div className="absolute inset-0 z-0">
        <MapWithNoSSR pickupCoords={{ lat: originLat, lng: originLng }} />
      </div>

      <div className="relative z-10 px-4 pt-3">
        <Link href="/dashboard/passenger" className="glass-panel px-3 py-2 inline-flex items-center gap-1 text-sm text-white">
          ← Voltar
        </Link>
      </div>

      <div className="relative z-10 mt-auto pointer-events-none">
        <div className="glass-panel rounded-t-3xl rounded-b-none p-5 space-y-4 pointer-events-auto"
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>

          {/* Status Progress */}
          <div className="flex items-center gap-2">
            {statusSteps.map((s, i) => (
              <div key={s.key} className="flex-1">
                <div className={`h-1 rounded-full transition-all ${
                  i <= currentStepIdx ? "bg-primary" : "bg-card-border"
                }`} />
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">
              {statusSteps[currentStepIdx]?.label || "Corrida"}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-gray-300">{pickup || "Localização atual"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-error" />
              <span className="text-gray-300">{dropoff}</span>
            </div>
          </div>

          {/* Categoria */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">{CATEGORY_LABELS[category] || category}</span>
            {driver && (
              <span className="text-sm text-primary">R$ {driver.preco_por_km}/km</span>
            )}
          </div>

          {/* Actions */}
          {status === "finalizada" ? (
            <Link
              href={`/payment?rideId=${rideId}`}
              className="w-full bg-primary text-black font-bold py-4 rounded-2xl txd-green-glow-sm text-center block text-lg"
            >
              Pagar corrida
            </Link>
          ) : loading ? (
            <div className="w-full bg-card-bg-2 text-gray-400 font-bold py-4 rounded-2xl text-center">
              Solicitando corrida...
            </div>
          ) : (
            <div className="w-full bg-card-bg-2 text-gray-400 font-bold py-4 rounded-2xl text-center">
              Aguardando...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function RidePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-gray-400">Carregando...</div>}>
      <RideContent />
    </Suspense>
  );
}
