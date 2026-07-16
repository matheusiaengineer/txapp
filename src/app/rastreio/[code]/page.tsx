"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin, Navigation, Clock, Package, Truck, Share2, CheckCircle,
  Loader2, Copy, Smartphone,
} from "lucide-react";

interface TrackingData {
  id: string;
  status: string;
  origin: string;
  destination: string;
  driverName: string;
  driverPhoto: string;
  vehicleType: string;
  vehiclePlate: string;
  estimatedDelivery: string;
  lastUpdate: string;
  currentLocation: string;
  events: { status: string; location: string; time: string }[];
}

export default function PublicTrackingPage() {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setData({
        id: code,
        status: "in_transit",
        origin: "Av. Paulista, 1000 - São Paulo",
        destination: "Rua das Flores, 500 - Potéia, MG",
        driverName: "Carlos M.",
        driverPhoto: "CM",
        vehicleType: "Caminhão",
        vehiclePlate: "ABC-1D23",
        estimatedDelivery: "Hoje às 18:30",
        lastUpdate: "Há 2 minutos",
        currentLocation: "BR-381, km 152 - Próximo a Governador Valadares",
        events: [
          { status: "Coleta realizada", location: "São Paulo, SP", time: "08:30 - Hoje" },
          { status: "Em trânsito", location: "BR-381, km 100", time: "11:15 - Hoje" },
          { status: "Atual", location: "BR-381, km 152", time: "14:20 - Hoje" },
        ],
      });
      setLoading(false);
    }, 1000);
  }, [code]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/rastreio/${code}` : "";

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: "Rastrear carga TXDAPP", url: shareUrl });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Buscando rastreamento...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Código não encontrado</h1>
          <p className="text-sm text-gray-500">Verifique o código de rastreamento e tente novamente</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="bg-gradient-to-b from-primary/10 to-transparent px-5 pt-8 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Truck className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">Rastreamento</h1>
          <p className="text-sm text-gray-400 mt-1">Código: <span className="text-primary font-mono font-bold">{code}</span></p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-gray-500">{data.lastUpdate}</span>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 px-5 py-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="txd-card p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
              {data.driverPhoto}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">{data.driverName}</div>
              <div className="text-xs text-gray-500">{data.vehicleType} · {data.vehiclePlate}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Previsão</div>
              <div className="text-sm font-bold text-primary">{data.estimatedDelivery}</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="txd-card p-4 space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500">Origem</div>
              <div className="text-white">{data.origin}</div>
            </div>
          </div>
          <div className="border-l-2 border-dashed border-card-border ml-2 h-6" />
          <div className="flex items-start gap-3 text-sm">
            <Navigation className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500">Destino</div>
              <div className="text-white">{data.destination}</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="txd-card p-4">
          <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Atualizações
          </h3>
          <div className="relative pl-6 space-y-5">
            {data.events.map((evt, i) => (
              <div key={i} className="relative">
                <div className={`absolute left-[-18px] top-0.5 w-3 h-3 rounded-full border-2 border-background ${
                  i === data.events.length - 1 ? "bg-primary" : "bg-card-border"
                }`} />
                {i < data.events.length - 1 && (
                  <div className="absolute left-[-14px] top-4 w-0.5 bottom-[-24px] bg-card-border" />
                )}
                <p className={`text-sm ${i === data.events.length - 1 ? "text-white font-medium" : "text-gray-400"}`}>{evt.status}</p>
                <p className="text-xs text-gray-500">{evt.location}</p>
                <p className="text-xs text-gray-600">{evt.time}</p>
              </div>
            ))}
            <div className="relative animate-pulse">
              <div className="absolute left-[-18px] top-0.5 w-3 h-3 rounded-full bg-primary/50" />
              <p className="text-sm text-gray-500">Próxima atualização...</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="space-y-3">
          <div className="txd-card p-4 text-sm text-gray-400 flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-primary shrink-0" />
            <p>Baixe o app TXDAPP para acompanhar em tempo real com mapa</p>
          </div>

          <button onClick={handleShare}
            className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
            {copied ? <><CheckCircle className="w-5 h-5" /> Link copiado!</> : <><Share2 className="w-5 h-5" /> Compartilhar rastreamento</>}
          </button>
        </motion.div>
      </div>
    </main>
  );
}
