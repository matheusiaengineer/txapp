"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import Link from "next/link";

export default function DriverPricingPage() {
  const router = useRouter();
  const [preco, setPreco] = useState("5");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      const { data: pricing } = await supabase
        .from("driver_pricing")
        .select("min_price_per_km")
        .eq("driver_id", data.user.id)
        .maybeSingle();
      if (pricing?.min_price_per_km) setPreco(String(pricing.min_price_per_km));
    });
  }, []);

  async function handleSave() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get vehicle category first to map service_type
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("category")
      .eq("driver_id", user.id)
      .maybeSingle();

    const serviceType = vehicle?.category || "carro";

    await supabase.from("driver_pricing").upsert({
      driver_id: user.id,
      service_type: serviceType,
      min_price_per_km: parseFloat(preco),
      suggested_price_per_km: parseFloat(preco) * 1.2,
      is_active: true,
    }, {
      onConflict: "driver_id,service_type"
    });

    setLoading(false);
    setSaved(true);
    setTimeout(() => router.back(), 1000);
  }

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
        <Link href="/dashboard/driver" className="text-gray-400 text-sm mb-6">← Voltar</Link>

        <h1 className="text-2xl font-bold text-white mb-2">Valor do quilômetro</h1>
        <p className="text-sm text-gray-400 mb-8">Você define o preço. Sem limite mínimo ou máximo.</p>

        <div className="txd-card p-8 text-center mb-8">
          <div className="text-6xl font-bold text-primary mb-2">R$ {preco}</div>
          <div className="text-sm text-gray-400">por quilômetro rodado</div>
        </div>

        <input
          type="range"
          min="1"
          max="30"
          step="0.5"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="w-full accent-primary mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500 mb-8">
          <span>R$ 1</span><span>R$ 10</span><span>R$ 20</span><span>R$ 30</span>
        </div>

        {saved && (
          <div className="text-success text-sm bg-success/10 px-4 py-2 rounded-lg text-center mb-4">
            Preço atualizado!
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-primary text-black font-bold py-3.5 rounded-full txd-green-glow-sm disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar preço"}
        </button>
      </div>
    </main>
  );
}
