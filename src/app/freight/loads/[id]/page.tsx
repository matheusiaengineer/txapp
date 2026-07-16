"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Navigation, ArrowLeft, DollarSign, Package, Truck,
  Scale, Ruler, Clock, Star, CheckCircle, X, Loader2,
  Calendar, MessageCircle, Phone, User, Info, TrendingUp,
} from "lucide-react";

interface LoadDetail {
  id: string;
  origin_address: string;
  dest_address: string;
  description: string;
  weight_kg?: number;
  volume_m3?: number;
  vehicle_type: string;
  photos: string[];
  pickup_date?: string;
  budget_min?: number;
  budget_max?: number;
  status: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

interface BidItem {
  id: string;
  load_id: string;
  transporter_id: string;
  amount: number;
  message?: string;
  estimated_days?: number;
  status: string;
  created_at: string;
  transporter_name?: string;
  transporter_rating?: number;
}

const VEHICLE_ICONS: Record<string, string> = {
  moto: "🛵", carro: "🚗", van: "🚐", caminhao: "🚚", carreta: "🚛",
};

const VEHICLE_LABELS: Record<string, string> = {
  moto: "Moto", carro: "Carro", van: "Van", caminhao: "Caminhão", carreta: "Carreta",
};

export default function LoadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [load, setLoad] = useState<LoadDetail | null>(null);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTransporter, setIsTransporter] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState(0);
  const [bidMessage, setBidMessage] = useState("");
  const [bidDays, setBidDays] = useState(1);
  const [bidLoading, setBidLoading] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState<string | null>(null);

  const COMMISSION_PERCENT = 15;

  useEffect(() => {
    async function fetchData() {
      try {
        const [loadRes, bidsRes] = await Promise.all([
          fetch(`/api/freight/loads/${id}`),
          fetch(`/api/freight/bids?load_id=${id}`),
        ]);
        const loadData = await loadRes.json();
        const bidsData = await bidsRes.json();
        setLoad(loadData.load || null);
        setBids(bidsData.bids || []);
        if (loadData.load?.budget_min) {
          setBidAmount(loadData.load.budget_min);
        }
      } catch (err) {
        console.error("Erro ao carregar dados", err);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  async function handleBid() {
    if (!bidAmount || bidAmount <= 0) return;
    setBidLoading(true);
    try {
      const res = await fetch("/api/freight/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "anon_transporter" },
        body: JSON.stringify({
          load_id: id,
          amount: bidAmount,
          message: bidMessage,
          estimated_days: bidDays,
          transporter_name: "Transportador",
          transporter_rating: 4.8,
        }),
      });
      const data = await res.json();
      if (data.bid) {
        setBidSuccess(true);
        setBids(prev => [data.bid, ...prev]);
        setShowBidForm(false);
        setTimeout(() => setBidSuccess(false), 3000);
      }
    } catch {
      alert("Erro ao enviar lance");
    }
    setBidLoading(false);
  }

  async function handleAcceptBid(bidId: string) {
    setAcceptLoading(bidId);
    try {
      const res = await fetch(`/api/freight/bids/${bidId}/accept`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) {
        setBids(prev => prev.map(b => ({
          ...b,
          status: b.id === bidId ? "accepted" : b.status === "pending" ? "rejected" : b.status,
        })));
        setLoad(prev => prev ? { ...prev, status: "in_progress" } : null);
      }
    } catch {
      alert("Erro ao aceitar lance");
    }
    setAcceptLoading(null);
  }

  const platformFee = bidAmount * (COMMISSION_PERCENT / 100);
  const transporterEarns = bidAmount - platformFee;

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </main>
    );
  }

  if (!load) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Package className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-lg font-bold text-white mb-1">Carga não encontrada</h2>
        <button onClick={() => router.back()} className="text-primary text-sm mt-4">Voltar</button>
      </main>
    );
  }

  const acceptedBid = bids.find(b => b.status === "accepted");

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-card-border px-5 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white transition" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-white text-lg">Detalhes da carga</h1>
            <p className="text-xs text-gray-500">
              {load.status === "open" ? "Aceitando lances" :
               load.status === "in_progress" ? "Em andamento" : load.status}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        <div className="txd-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">{VEHICLE_ICONS[load.vehicle_type] || "📦"}</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg">{VEHICLE_LABELS[load.vehicle_type] || load.vehicle_type}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  load.status === "open" ? "bg-primary/10 text-primary" :
                  load.status === "in_progress" ? "bg-yellow-400/10 text-yellow-400" :
                  "bg-gray-500/10 text-gray-400"
                }`}>{load.status === "open" ? "Aberto" : load.status === "in_progress" ? "Em andamento" : load.status}</span>
              </div>
              <p className="text-xs text-gray-500">Publicado em {new Date(load.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>

          <p className="text-sm text-gray-300 mb-4">{load.description}</p>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div><div className="text-white font-medium">Coleta</div><div className="text-gray-400">{load.origin_address}</div></div>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div><div className="text-white font-medium">Entrega</div><div className="text-gray-400">{load.dest_address}</div></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
            {load.weight_kg && <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> {load.weight_kg}kg</span>}
            {load.volume_m3 && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {load.volume_m3}m³</span>}
            {load.pickup_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Coleta: {new Date(load.pickup_date).toLocaleDateString("pt-BR")}</span>}
          </div>

          {load.budget_max && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-white font-bold">Orçamento: R$ {load.budget_min || 0} - R$ {load.budget_max}</span>
            </div>
          )}

          {load.photos && load.photos.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-2">Fotos</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {load.photos.map((p, i) => (
                  <div key={i} className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {isTransporter && load.status === "open" && !showBidForm && !acceptedBid && (
          <button onClick={() => setShowBidForm(true)}
            className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all text-base flex items-center justify-center gap-2">
            <DollarSign className="w-5 h-5" /> Dar lance
          </button>
        )}

        <AnimatePresence>
          {showBidForm && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="txd-card p-4 space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Seu lance
              </h3>
              <div>
                <label className="text-xs text-gray-500 mb-1">Valor (R$)</label>
                <input type="number" value={bidAmount} onChange={e => setBidAmount(Number(e.target.value))}
                  min={1} step={5}
                  className="w-full bg-card-bg border border-card-border rounded-xl py-3 px-4 text-white text-lg font-bold outline-none focus:border-primary/50 transition"
                  autoFocus
                />
              </div>
              <div className="bg-primary/5 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Valor do lance</span>
                  <span className="text-white font-medium">R$ {bidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Comissão TXD ({COMMISSION_PERCENT}%)</span>
                  <span className="text-amber-400">-R$ {platformFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-card-border pt-1 flex justify-between font-bold text-white">
                  <span>Você recebe</span>
                  <span>R$ {transporterEarns.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1">Prazo estimado (dias)</label>
                <input type="number" value={bidDays} onChange={e => setBidDays(Number(e.target.value))}
                  min={1} max={30}
                  className="w-full bg-card-bg border border-card-border rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50 transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1">Mensagem (opcional)</label>
                <textarea value={bidMessage} onChange={e => setBidMessage(e.target.value)}
                  placeholder="Ex: Posso buscar amanhã às 8h..."
                  rows={2}
                  className="w-full bg-card-bg border border-card-border rounded-xl py-3 px-4 text-white text-sm placeholder-gray-500 outline-none focus:border-primary/50 transition resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowBidForm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-card-border text-gray-400 text-sm font-medium hover:text-white transition">
                  Cancelar
                </button>
                <button onClick={handleBid} disabled={bidLoading || bidAmount <= 0}
                  className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                  {bidLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Enviar lance
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {bidSuccess && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-sm text-primary flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Lance enviado com sucesso!
          </motion.div>
        )}

        {acceptedBid ? (
          <div className="txd-card p-4 border-primary/40">
            <div className="flex items-center gap-2 text-primary mb-2">
              <CheckCircle className="w-5 h-5" />
              <h3 className="font-semibold text-white">Lance aceito</h3>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="text-white font-bold">R$ {acceptedBid.amount.toFixed(2)}</div>
                <div className="text-gray-500">{acceptedBid.transporter_name}</div>
              </div>
              {acceptedBid.estimated_days && (
                <div className="text-xs text-gray-400">Entrega em ~{acceptedBid.estimated_days} dia(s)</div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 text-xs py-2 rounded-xl bg-white/5 hover:bg-white/10 transition flex items-center justify-center gap-1 text-gray-300">
                <MessageCircle className="w-3 h-3" /> Mensagem
              </button>
              <button className="flex-1 text-xs py-2 rounded-xl bg-primary hover:bg-primary-hover text-black font-semibold transition flex items-center justify-center gap-1">
                <Phone className="w-3 h-3" /> Contato
              </button>
            </div>
          </div>
        ) : null}

        {bids.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Lances recebidos ({bids.length})
            </h3>
            {bids.map((bid, i) => {
              const isAccepted = bid.status === "accepted";
              const isRejected = bid.status === "rejected";
              return (
                <div key={bid.id}
                  className={`txd-card p-4 transition-all ${
                    isAccepted ? "border-primary/50 bg-primary/5" :
                    isRejected ? "opacity-50" : ""
                  }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-sm text-white">
                          {bid.transporter_name || "Transportador"}
                        </span>
                        {bid.transporter_rating && (
                          <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                            <Star className="w-3 h-3" /> {bid.transporter_rating}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(bid.created_at).toLocaleString("pt-BR")}
                      </div>
                      {bid.message && (
                        <p className="text-xs text-gray-400 mt-2 italic">"{bid.message}"</p>
                      )}
                      {bid.estimated_days && (
                        <p className="text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3 inline" /> Entrega em ~{bid.estimated_days} dia(s)
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className={`text-xl font-bold ${
                        isAccepted ? "text-primary" : isRejected ? "text-gray-500" : "text-white"
                      }`}>R$ {bid.amount.toFixed(0)}</div>
                      <div className="text-xs text-gray-500">
                        Comissão: R$ {(bid.amount * COMMISSION_PERCENT / 100).toFixed(0)}
                      </div>
                      {isAccepted && (
                        <span className="text-xs font-medium text-primary">Aceito</span>
                      )}
                      {isRejected && (
                        <span className="text-xs font-medium text-gray-500">Recusado</span>
                      )}
                    </div>
                  </div>
                  {!isTransporter && bid.status === "pending" && (
                    <button onClick={() => handleAcceptBid(bid.id)} disabled={acceptLoading === bid.id}
                      className="mt-3 w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                      {acceptLoading === bid.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Aceitar lance - R$ {bid.amount.toFixed(0)}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
