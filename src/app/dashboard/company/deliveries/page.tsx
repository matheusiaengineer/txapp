"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Clock, Check, AlertCircle, Search, MapPin, User } from "lucide-react";

export default function CompanyDeliveriesPage() {
  const [tab, setTab] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/company/deliveries").then(r => r.ok ? r.json() : []).then(d => { setDeliveries(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = deliveries.filter((d: any) => {
    if (tab === "active") return d.status === "open" || d.status === "in_progress";
    if (tab === "completed") return d.status === "delivered" || d.status === "completed";
    if (tab === "cancelled") return d.status === "cancelled";
    return true;
  }).filter((d: any) => search === "" || d.origin?.toLowerCase().includes(search.toLowerCase()) || d.destination?.toLowerCase().includes(search.toLowerCase()));

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: "Aberta", color: "text-yellow-400 bg-yellow-400/15" },
    in_progress: { label: "Em andamento", color: "text-blue-400 bg-blue-400/15" },
    completed: { label: "Concluída", color: "text-primary bg-primary/15" },
    delivered: { label: "Entregue", color: "text-primary bg-primary/15" },
    cancelled: { label: "Cancelada", color: "text-red-400 bg-red-400/15" },
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cargas</h1>
          <button className="bg-primary hover:bg-primary-hover text-background text-xs font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[0.98] flex items-center gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> Nova Carga
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
          {["all", "active", "completed", "cancelled"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                tab === t ? "bg-primary text-background" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}>
              {t === "all" ? "Todas" : t === "active" ? "Ativas" : t === "completed" ? "Concluídas" : "Canceladas"}
            </button>
          ))}
        </motion.div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Buscar por endereço..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-background border border-card-border rounded-xl p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors" />
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({length:4}).map((_,i) => (
            <div key={i} className="glass-panel p-4 animate-pulse"><div className="h-4 bg-white/10 rounded w-3/4 mb-2" /><div className="h-3 bg-white/5 rounded w-1/2" /></div>
          ))}</div>
        ) : (
          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="glass-panel p-8 text-center text-sm text-gray-500">Nenhuma carga encontrada</div>
            )}
            {filtered.map((delivery: any) => {
              const status = statusConfig[delivery.status] || { label: delivery.status, color: "text-gray-400" };
              return (
                <motion.div key={delivery.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-panel p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{delivery.description || delivery.origin?.split(",")[0] || "Carga"}</p>
                        <span className="text-xs text-gray-500">#{delivery.id?.slice(0,8)}</span>
                      </div>
                      {delivery.weight && <p className="text-xs text-gray-400 mt-0.5">{delivery.weight} kg</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {delivery.origin} → {delivery.destination}</div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-card-border">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" /> {new Date(delivery.createdAt).toLocaleDateString("pt-BR")}
                      {delivery.budgetMin && <><span className="text-gray-600">|</span>R$ {delivery.budgetMin} - R$ {delivery.budgetMax}</>}
                    </div>
                    {delivery.status === "open" && (
                      <span className="text-xs text-gray-500">{delivery.bidCount || 0} propostas</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
