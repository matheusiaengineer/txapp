"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browser";

type PaymentMethod = "carteira" | "pix" | "card";

function PaymentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const rideId = params.get("rideId");

  const [user, setUser] = useState<any>(null);
  const [ride, setRide] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [method, setMethod] = useState<PaymentMethod>("carteira");
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      setUser(data.user);
      if (rideId) {
        const { data: rideData } = await supabase.from("rides").select("*").eq("id", rideId).single();
        setRide(rideData);
        if (rideData?.motorista_id) {
          const { data: driverData } = await supabase.from("drivers").select("*").eq("id", rideData.motorista_id).single();
          setDriver(driverData);
        }
      }
      const { data: walletData } = await supabase.from("wallet").select("*").eq("user_id", data.user.id).single();
      setWallet(walletData);
    });
  }, [rideId]);

  const distanciaKm = ride ? calcularDistancia(
    ride.origem_lat, ride.origem_lng,
    ride.destino_lat || ride.origem_lat + 0.01,
    ride.destino_lng || ride.origem_lng + 0.01
  ) : 0;

  const precoPorKm = driver?.preco_por_km || 5;
  const valorTotal = 5 + distanciaKm * precoPorKm;

  async function handlePayWithWallet() {
    setLoading(true);
    setError(null);

    if (!wallet || wallet.saldo < valorTotal) {
      setError("Saldo insuficiente. Use outra forma de pagamento.");
      setLoading(false);
      return;
    }

    const taxaTxap = valorTotal * 0.2;
    const valorMotorista = valorTotal * 0.8;

    await supabase.from("wallet").update({ saldo: wallet.saldo - valorTotal }).eq("user_id", user.id);

    if (driver) {
      const { data: driverWallet } = await supabase.from("wallet").select("saldo").eq("user_id", driver.id).single();
      await supabase.from("wallet").upsert({
        user_id: driver.id,
        saldo: (driverWallet?.saldo || 0) + valorMotorista,
      });
    }

    await supabase.from("transactions").insert([{
      corrida_id: rideId,
      passageiro_id: user.id,
      motorista_id: driver?.id,
      valor_total: valorTotal,
      taxa_txap: taxaTxap,
      valor_motorista: valorMotorista,
      metodo: "carteira",
      status: "pago",
    }]);

    await supabase.from("rides").update({ status: "finalizada", valor_total: valorTotal }).eq("id", rideId);

    setLoading(false);
    setPaid(true);
  }

  async function handlePayWithPix() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rideId,
          passageiroId: user.id,
          motoristaId: driver?.id,
          valor: Math.round(valorTotal * 100),
          metodo: "pix",
        }),
      });
      const data = await res.json();
      if (data.qrCode) setQrCode(data.qrCode);
      else setError("Erro ao gerar QR Code");
    } catch {
      setError("Erro de conexão");
    }
    setLoading(false);
  }

  async function handlePayWithCard() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/payments/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rideId,
        passageiroId: user.id,
        motoristaId: driver?.id,
        valor: Math.round(valorTotal * 100),
        metodo: "card",
      }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError("Erro ao processar pagamento");
    }
    setLoading(false);
  }

  if (paid) {
    return (
      <main className="min-h-[100dvh] bg-background flex flex-col p-4 items-center justify-center"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
          <span className="text-3xl text-success">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Pagamento confirmado!</h1>
        <p className="text-sm text-gray-400 mb-8">R$ {valorTotal.toFixed(2)}</p>
        <Link href="/dashboard/passenger" className="bg-primary text-black font-bold px-8 py-3.5 rounded-full">
          Voltar ao início
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <Link href="/dashboard/passenger" className="text-gray-400 text-sm mb-4">← Voltar</Link>

        <h1 className="text-2xl font-bold text-white mb-2">Pagamento</h1>
        <p className="text-sm text-gray-400 mb-6">{ride?.status === "finalizada" ? "Corrida finalizada" : "Aguardando finalização"}</p>

        {/* Resumo */}
        <div className="txd-card p-4 space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Distância</span>
            <span className="text-white">{distanciaKm.toFixed(1)} km</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Preço por km</span>
            <span className="text-white">R$ {precoPorKm.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Taxa base</span>
            <span className="text-white">R$ 5,00</span>
          </div>
          <hr className="border-card-border" />
          <div className="flex justify-between text-lg font-bold">
            <span className="text-white">Total</span>
            <span className="text-primary">R$ {valorTotal.toFixed(2)}</span>
          </div>
        </div>

        {wallet && (
          <div className="txd-card p-3 mb-4">
            <p className="text-xs text-gray-400">Saldo da Carteira TXAP</p>
            <p className="text-lg font-bold text-white">R$ {(wallet.saldo || 0).toFixed(2)}</p>
          </div>
        )}

        {error && (
          <div className="text-error text-sm bg-error/10 px-4 py-2 rounded-lg mb-4">{error}</div>
        )}

        {qrCode ? (
          <div className="txd-card p-6 text-center">
            <h3 className="text-sm font-medium text-white mb-4">Escaneie o QR Code para pagar</h3>
            <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto mb-4" />
            <p className="text-xs text-gray-400">Use qualquer banco ou carteira digital</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handlePayWithWallet}
              disabled={loading}
              className="w-full txd-card p-4 flex items-center gap-3 text-left hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-lg">💰</div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">Carteira TXAP</div>
                <div className="text-xs text-gray-400">Pagar com saldo disponível</div>
              </div>
            </button>

            <button
              onClick={handlePayWithPix}
              disabled={loading}
              className="w-full txd-card p-4 flex items-center gap-3 text-left hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center text-lg">📱</div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">PIX</div>
                <div className="text-xs text-gray-400">QR Code para pagar na hora</div>
              </div>
            </button>

            <button
              onClick={handlePayWithCard}
              disabled={loading}
              className="w-full txd-card p-4 flex items-center gap-3 text-left hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center text-lg">💳</div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">Cartão</div>
                <div className="text-xs text-gray-400">Crédito ou débito</div>
              </div>
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center text-sm text-gray-400 mt-4">Processando...</div>
        )}
      </div>
    </main>
  );
}

function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-gray-400">Carregando...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
