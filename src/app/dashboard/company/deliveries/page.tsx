"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Clock, Check, AlertCircle, Search, Filter, MapPin, User, Phone } from "lucide-react";
import { SkeletonList } from "@/components/ui/skeleton";

const MOCK_DELIVERIES = [
  { id: "ENT-001", client: "João Silva", address: "Rua Augusta, 500", items: "2 pizzas", status: "pending", driver: null, createdAt: "10 min" },
  { id: "ENT-002", client: "Maria Souza", address: "Av. Paulista, 1000", items: "1 bolo, 3 refris", status: "in_transit", driver: "Carlos", createdAt: "25 min" },
  { id: "ENT-003", client: "Pedro Alves", address: "Rua Oscar Freire, 200", items: "5 marmitex", status: "completed", driver: "Ana", createdAt: "1h" },
  { id: "ENT-004", client: "Ana Costa", address: "Alameda Santos, 300", items: "10 doces", status: "cancelled", driver: null, createdAt: "2h" },
];

export default function CompanyDeliveriesPage() {
  const [tab, setTab] = useState<string>("active");
  const [loading] = useState(false);

  const filtered = MOCK_DELIVERIES.filter(d => {
    if (tab === "active") return d.status === "pending" || d.status === "in_transit";
    if (tab === "completed") return d.status === "completed";
    if (tab === "cancelled") return d.status === "cancelled";
    return true;
  });

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendente", color: "text-yellow-400 bg-yellow-400/15" },
    in_transit: { label: "Em trânsito", color: "text-blue-400 bg-blue-400/15" },
    completed: { label: "Entregue", color: "text-primary bg-primary/15" },
    cancelled: { label: "Cancelado", color: "text-red-400 bg-red-400/15" },
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Entregas</h1>
          <button className="bg-primary hover:bg-primary-hover text-background text-xs font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[0.98] flex items-center gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> Novo Pedido
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
          {["active", "completed", "cancelled", "all"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                tab === t ? "bg-primary text-background" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}>
              {t === "active" ? "Ativos" : t === "completed" ? "Concluídos" : t === "cancelled" ? "Cancelados" : "Todos"}
            </button>
          ))}
        </motion.div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Buscar entrega..."
            className="w-full bg-background border border-card-border rounded-xl p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors" />
        </div>

        {loading ? (
          <SkeletonList count={4} />
        ) : (
          <div className="space-y-2">
            {filtered.map(delivery => {
              const status = statusConfig[delivery.status] || { label: delivery.status, color: "text-gray-400" };
              return (
                <motion.div key={delivery.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-panel p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{delivery.client}</p>
                        <span className="text-xs text-gray-500">#{delivery.id}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{delivery.items}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" /> {delivery.address}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-card-border">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" /> {delivery.createdAt}
                      {delivery.driver && <><span className="text-gray-600">|</span><User className="w-3 h-3" /> {delivery.driver}</>}
                    </div>
                    {delivery.status === "pending" && (
                      <button className="text-xs text-primary hover:underline">Atribuir motorista</button>
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
