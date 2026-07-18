"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Package, TrendingUp, Users, Star, DollarSign, Clock, Calendar, Loader2, Truck, MapPin, Navigation, PlusCircle, Eye, Shield } from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";
import { useCompanyData } from "@/lib/hooks/use-company-data";
import GeofenceB2B from "@/components/map/GeofenceB2B";
import { PageLayout, PageHeader } from "@/components/ui/page-layout";
import { StatCard } from "@/components/ui/stat-card";

interface LoadItem {
  id: string;
  origin_address: string;
  dest_address: string;
  description: string;
  vehicle_type: string;
  status: string;
  created_at: string;
  budget_min?: number;
  budget_max?: number;
}

interface BidItem {
  id: string;
  load_id: string;
  amount: number;
  status: string;
  transporter_name?: string;
  created_at: string;
}

export default function CompanyDashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { company, activeDrivers, totalDrivers, recentDeliveries, todayCount, successRate, monthlyCount, revenue, loading: dataLoading } = useCompanyData(user?.id);
  const [myLoads, setMyLoads] = useState<LoadItem[]>([]);
  const [myBids, setMyBids] = useState<BidItem[]>([]);
  const [loadsLoading, setLoadsLoading] = useState(true);

  useEffect(() => {
    async function fetchFreightData() {
      try {
        const [loadsRes, bidsRes] = await Promise.all([
          fetch("/api/freight/loads?status=open"),
          fetch("/api/freight/loads?status=in_progress"),
        ]);
        const loadsData = await loadsRes.json();
        const inProgressData = await bidsRes.json();
        setMyLoads([...(loadsData.loads || []), ...(inProgressData.loads || [])]);
      } catch {}
      setLoadsLoading(false);
    }
    fetchFreightData();
  }, []);

  if (userLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const stats = [
    { icon: Package, label: "Entregas Hoje", value: String(todayCount), color: "#3ECB8E" },
    { icon: TrendingUp, label: "Taxa Sucesso", value: `${successRate.toFixed(1)}%`, color: "#60a5fa" },
    { icon: Star, label: "Avaliação", value: "4.8★", color: "#f59e0b" },
    { icon: DollarSign, label: "Faturamento", value: `R$ ${revenue.toFixed(0)}`, color: "#a78bfa" },
  ];

  return (
    <PageLayout>
      <PageHeader
        title="Painel Empresarial"
        subtitle={company?.corporate_name || "Bem-vindo"}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard icon={s.icon} label={s.label} value={s.value} color={s.color} />
          </motion.div>
        ))}
      </div>

      <button onClick={() => router.push("/freight/post")}
        className="w-full txd-card p-4 flex items-center gap-3 hover:border-primary/30 transition-all border border-card-border">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <PlusCircle className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-sm">Publicar nova carga</div>
          <div className="text-xs text-gray-500">Receba lances de transportadores da região</div>
        </div>
        <Truck className="w-5 h-5 text-gray-500" />
      </button>

      <div className="txd-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" /> Minhas Cargas
          </h2>
          <button onClick={() => router.push("/freight/post")} className="text-xs text-primary hover:underline">Nova carga</button>
        </div>
        {loadsLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
        ) : myLoads.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Nenhuma carga publicada</p>
        ) : (
          <div className="space-y-2">
            {myLoads.map(load => (
              <div key={load.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-card-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{load.vehicle_type}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      load.status === "open" ? "bg-primary/10 text-primary" : "bg-yellow-400/10 text-yellow-400"
                    }`}>{load.status === "open" ? "Aberto" : "Em andamento"}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{load.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3" />{load.origin_address?.split(",")[0]} → {load.dest_address?.split(",")[0]}
                  </div>
                </div>
                <button onClick={() => router.push(`/freight/loads/${load.id}`)}
                  className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
                  <Eye className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="txd-card p-5">
        <h2 className="font-semibold mb-4">Entregas Recentes</h2>
        <div className="space-y-3">
          {recentDeliveries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nenhuma entrega ainda</p>
          ) : recentDeliveries.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-card-border">
              <div>
                <div className="text-sm font-medium">#{d.id.slice(0, 8)}</div>
                <div className="text-xs text-gray-500">{d.origin_address} → {d.dest_address}</div>
                <div className="text-xs text-gray-500">R$ {(d.final_fare || d.estimated_fare || 0).toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-medium ${
                  d.status === "PAYMENT_CONFIRMED" || d.status === "COMPLETED" ? "text-primary" :
                  d.status === "IN_PROGRESS" || d.status === "ACCEPTED" ? "text-yellow-400" : "text-gray-400"
                }`}>{d.status}</div>
                <div className="text-xs text-gray-500">{new Date(d.created_at).toLocaleDateString("pt-BR")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="txd-card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Motoristas
          </h2>
          <div className="text-2xl font-bold">{totalDrivers}</div>
          <div className="text-xs text-gray-500">{activeDrivers} ativos · {totalDrivers - activeDrivers} offline</div>
        </div>
        <div className="txd-card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Entregas no Mês
          </h2>
          <div className="text-2xl font-bold">{monthlyCount}</div>
          <div className="text-xs text-gray-500">Média de {Math.round(monthlyCount / 30) || 0}/dia</div>
        </div>
      </div>

      {/* Geofence B2B - Controle de zona para corridas corporativas */}
      <div className="relative">
        <div className="txd-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Segurança Corporativa</h2>
            </div>
            <GeofenceB2B />
          </div>
          <p className="text-xs text-gray-400">
            Configure zonas geográficas para restringir corridas corporativas.
            Funcionários só podem solicitar viagens dentro das áreas definidas.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
