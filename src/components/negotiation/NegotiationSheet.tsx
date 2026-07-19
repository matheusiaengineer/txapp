"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Send, X, Check, ArrowLeftRight, Loader2, Clock, MessageSquare,
} from "lucide-react";

interface DriverInfo {
  driverId: string;
  distanceKm: number;
  rating: number;
  pricing: {
    min_price_per_km: number;
    suggested_price_per_km: number;
    min_trip_value: number;
  } | null;
}

interface Props {
  driver: DriverInfo;
  distanceKm: number;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  serviceType: string;
  onClose: () => void;
  onSuccess: (negotiation: any) => void;
}

function formatCurrency(v: number): string {
  return `R$ ${v.toFixed(2)}`;
}

export function NegotiationSheet({ driver, distanceKm, originLat, originLng, destLat, destLng, serviceType, onClose, onSuccess }: Props) {
  const PLATFORM_FEE_PERCENT = 10;

  const calcPrice = (perKm: number) => Math.max(
    Math.round(distanceKm * perKm * 100) / 100,
    driver.pricing?.min_trip_value || 0
  );

  const suggestedPrice = driver.pricing
    ? calcPrice(driver.pricing.suggested_price_per_km)
    : calcPrice(25);
  const minPrice = driver.pricing
    ? calcPrice(driver.pricing.min_price_per_km)
    : calcPrice(20);
  const minTrip = driver.pricing?.min_trip_value || 0;
  const commissionValue = (offerPrice: number) => Math.round(offerPrice * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  const driverGets = (offerPrice: number) => Math.round((offerPrice - commissionValue(offerPrice)) * 100) / 100;

  const [offerPrice, setOfferPrice] = useState(suggestedPrice);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"offer" | "sent" | "result">("offer");
  const [result, setResult] = useState<any>(null);

  const handleSend = async () => {
    if (offerPrice <= 0) { setError("Valor inválido"); return; }
    if (minTrip > 0 && offerPrice < minTrip) {
      setError(`Valor mínimo para este motorista: ${formatCurrency(minTrip)}`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/negotiation/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: driver.driverId,
          service_type: serviceType,
          origin_lat: originLat,
          origin_lng: originLng,
          dest_lat: destLat,
          dest_lng: destLng,
          distance_km: distanceKm,
          requested_price: offerPrice,
          message: message || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao enviar oferta"); setLoading(false); return; }
      setResult(data);
      setStep("sent");
      onSuccess(data);
    } catch { setError("Erro ao conectar com servidor"); }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="fixed bottom-0 left-0 right-0 z-50 txd-glass-strong rounded-t-3xl max-h-[85vh] overflow-y-auto"
    >
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-white">Fazer oferta</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Distância</span>
            <span className="text-white font-medium">{distanceKm} km</span>
          </div>
          {driver.pricing && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Preço mínimo/km</span>
                <span className="text-white font-medium">{formatCurrency(driver.pricing.min_price_per_km)}/km</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Preço sugerido/km</span>
                <span className="text-white font-medium">{formatCurrency(driver.pricing.suggested_price_per_km)}/km</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
            <span className="text-gray-400">Estimativa sugerida</span>
            <span className="text-primary font-bold text-lg">{formatCurrency(suggestedPrice)}</span>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-2">{error}</div>
        )}

        {step === "offer" && (
          <>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Sua oferta</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <input type="number" step="0.50" min={minPrice}
                  value={offerPrice}
                  onChange={e => setOfferPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-card-bg border border-card-border rounded-xl py-3.5 pl-10 pr-4 text-white text-lg font-bold focus:outline-none focus:border-primary/50" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">total</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setOfferPrice(minPrice)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${offerPrice === minPrice ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                  Mínimo {formatCurrency(minPrice)}
                </button>
                <button onClick={() => setOfferPrice(suggestedPrice)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${offerPrice === suggestedPrice ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                  Sugerido {formatCurrency(suggestedPrice)}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Mensagem (opcional)</label>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Ex: Preciso ir até o centro..."
                  value={message} onChange={e => setMessage(e.target.value)}
                  className="flex-1 bg-card-bg border border-card-border rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-primary/50" />
              </div>
            </div>

            <div className="glass-panel p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Valor da corrida</span>
                <span className="text-white">{formatCurrency(offerPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Comissão TXD ({PLATFORM_FEE_PERCENT}%)</span>
                <span className="text-red-400">-{formatCurrency(commissionValue(offerPrice))}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-white/5">
                <span className="text-gray-400 font-medium">Motorista recebe</span>
                <span className="text-primary font-bold">{formatCurrency(driverGets(offerPrice))}</span>
              </div>
            </div>

            <button onClick={handleSend} disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Enviar oferta de {formatCurrency(offerPrice)}
            </button>
          </>
        )}

        {step === "sent" && result && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Oferta enviada!</h3>
              <p className="text-sm text-gray-400 mt-1">Aguardando resposta do motorista</p>
            </div>
            <div className="glass-panel p-4">
              <div className="text-2xl font-bold text-primary">{formatCurrency(result.requested_price)}</div>
              <div className="text-xs text-gray-500 mt-1">Sua oferta para este motorista</div>
            </div>
            <p className="text-xs text-gray-500">A oferta expira em 5 minutos. Você recebe uma notificação quando o motorista responder.</p>
            <button onClick={onClose}
              className="w-full bg-card-bg border border-card-border hover:border-primary/30 text-gray-300 font-medium py-3 rounded-xl transition text-sm">
              Voltar
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}