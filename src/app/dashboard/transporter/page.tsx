"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Truck, Package, DollarSign, Map, Clock, Star, Loader2, Search, MapPin, Navigation, Heart } from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";
import { useTransporterData } from "@/lib/hooks/use-transporter-data";
import SosButton from "@/components/safety/SosButton";
import FreightStackCard from "@/components/freight/FreightStackCard";
import { PageLayout, PageHeader } from "@/components/ui/page-layout";
import { StatCard } from "@/components/ui/stat-card";

interface BidItem {
  id: string;
  load_id: string;
  amount: number;
  status: string;
  created_at: string;
  load_description?: string;
  load_origin?: string;
  load_dest?: string;
  load_vehicle?: string;
}

const COMMISSION_PERCENT = 15;

export default function TransporterDashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { activeFreights, todayDeliveries, earningsToday, earningsWeek, recentTrips, averageRating, loading: dataLoading } = useTransporterData(user?.id);
  const [myBids, setMyBids] = useState<BidItem[]>([]);
  const [bidsLoading, setBidsLoading] = useState(true);

  useEffect(() => {
    async function fetchBids() {
      try {
        const res = await fetch("/api/freight/bids?mine=true");
        const data = await res.json();
        setMyBids(data.bids || []);
      } catch {}
      setBidsLoading(false);
    }
    fetchBids();
  }, []);

  if (userLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const stats = [
    { icon: Truck, label: "Fretes Ativos", value: String(activeFreights), color: "#3ECB8E" },
    { icon: Package, label: "Entregas Hoje", value: String(todayDeliveries), color: "#60a5fa" },
    { icon: DollarSign, label: "Ganhos Hoje", value: `R$ ${earningsToday.toFixed(0)}`, color: "#f59e0b" },
    { icon: Star, label: "Avaliação", value: `${averageRating.toFixed(1)}★`, color: "#a78bfa" },
  ];

  const activeBids = myBids.filter(b => b.status === "pending");
  const wonBids = myBids.filter(b => b.status === "accepted");

  return (
    <PageLayout>
      <SosButton />
      <PageHeader
        title="Transportador"
        subtitle="Gerencie seus fretes e cargas"
      />

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push("/freight/loads")}
          className="txd-card p-4 flex items-center gap-3 hover:border-primary/30 transition-all border border-card-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-sm">Ver cargas</div>
            <div className="text-xs text-gray-500">Encontre cargas e dê lances</div>
          </div>
          <Truck className="w-5 h-5 text-gray-500" />
        </button>
        <button onClick={() => router.push("/dashboard/transporter/addresses")}
          className="txd-card p-4 flex items-center gap-3 hover:border-primary/30 transition-all border border-card-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-sm">Endereços</div>
            <div className="text-xs text-gray-500">Pontos de carga e descarga</div>
          </div>
          <Navigation className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard icon={s.icon} label={s.label} value={s.value} color={s.color} />
          </motion.div>
        ))}
      </div>

      {/* Mapa de rotas + Ofertas de frete empilhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="txd-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Map className="w-4 h-4 text-primary" /> Rotas disponíveis
            </h2>
            <button onClick={() => router.push("/freight/loads")} className="text-xs text-primary">Ver todas</button>
          </div>
          <div className="relative h-48 rounded-xl overflow-hidden bg-[#0a0d12]">
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 30% 40%, #3ECB8E 0%, transparent 50%), radial-gradient(circle at 70% 60%, #f59e0b 0%, transparent 50%)" }} />
            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(#2a2a2a 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            {/* Rota A → B */}
            <svg className="absolute inset-0 w-full h-full">
              <line x1="25%" y1="35%" x2="70%" y2="55%" stroke="#3ECB8E" strokeWidth="3" strokeDasharray="8,4" opacity="0.8" />
              <circle cx="25%" cy="35%" r="6" fill="#3ECB8E" />
              <circle cx="70%" cy="55%" r="6" fill="#ef4444" />
              <text x="22%" y="30%" fill="#3ECB8E" fontSize="10" fontWeight="bold">SP</text>
              <text x="72%" y="50%" fill="#ef4444" fontSize="10" fontWeight="bold">RJ</text>
            </svg>
            <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] text-gray-500 bg-black/60 px-2 py-1 rounded-lg">
              <span>🚚 3 cargas disponíveis</span>
              <span>💰 R$ 2.500 - R$ 5.000</span>
            </div>
          </div>
        </div>
        <FreightStackCard />
      </div>

      {activeBids.length > 0 && (
        <div className="txd-card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" /> Lances pendentes ({activeBids.length})
          </h2>
          <div className="space-y-2">
            {activeBids.slice(0, 5).map(bid => (
              <div key={bid.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-card-border">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-300 truncate">{bid.load_description || "Carga"}</div>
                  <div className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />{bid.load_origin?.split(",")[0]} → {bid.load_dest?.split(",")[0]}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="text-sm font-bold text-white">R$ {bid.amount.toFixed(0)}</div>
                  <div className="text-xs text-amber-400">-{COMMISSION_PERCENT}% = R$ {(bid.amount * (1 - COMMISSION_PERCENT/100)).toFixed(0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="txd-card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" /> Fretes Ativos
        </h2>
        <div className="space-y-3">
          {recentTrips.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum frete ainda</p>
          ) : recentTrips.filter((t: any) => t.status === "ACCEPTED" || t.status === "IN_PROGRESS" || t.status === "DRIVER_ARRIVED").length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum frete ativo</p>
          ) : recentTrips.filter((t: any) => t.status === "ACCEPTED" || t.status === "IN_PROGRESS" || t.status === "DRIVER_ARRIVED").map((f: any) => (
            <div key={f.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-card-border">
              <div>
                <div className="text-sm font-medium">#{f.id.slice(0, 8).toUpperCase()}</div>
                <div className="text-xs text-gray-500">{f.origin_address} → {f.dest_address}</div>
                <div className="text-xs text-gray-500">R$ {(f.final_fare || f.estimated_fare || 0).toFixed(2)}</div>
              </div>
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                f.status === "IN_PROGRESS" ? "bg-primary/20 text-primary" :
                f.status === "ACCEPTED" ? "bg-yellow-400/20 text-yellow-400" :
                "bg-gray-500/20 text-gray-400"
              }`}>{f.status === "IN_PROGRESS" ? "Em rota" : f.status === "ACCEPTED" ? "Aceito" : f.status}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="txd-card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Map className="w-4 h-4 text-primary" /> Rotas Recentes
          </h2>
          <div className="space-y-2">
            {recentTrips.slice(0, 3).map((r: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-400">{r.origin_address?.split(",")[0]} → {r.dest_address?.split(",")[0]}</span>
                <span className="text-gray-500">{r.estimated_distance_km?.toFixed(0)} km · {r.estimated_duration_min} min</span>
              </div>
            ))}
            {recentTrips.length === 0 && <span className="text-xs text-gray-500">Nenhuma rota ainda</span>}
          </div>
        </div>
        <div className="txd-card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Ganhos da Semana
          </h2>
          <div className="text-2xl font-bold">R$ {earningsWeek.toFixed(0)}</div>
          <div className="text-xs text-gray-500">
            {earningsWeek > 0 ? `${todayDeliveries} entregas esta semana` : "Nenhum ganho ainda"}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
