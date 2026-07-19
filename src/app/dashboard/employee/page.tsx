"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Clock, Check, AlertCircle, Loader2, User, Building } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";

export default function EmployeeDashboard() {
  const { user, loading: userLoading } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employee/orders").then(r => r.ok ? r.json() : []).then(d => { setOrders(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: "Aberta", color: "text-yellow-400 bg-yellow-400/15" },
    in_progress: { label: "Em andamento", color: "text-blue-400 bg-blue-400/15" },
    completed: { label: "Concluída", color: "text-primary bg-primary/15" },
    delivered: { label: "Entregue", color: "text-primary bg-primary/15" },
    cancelled: { label: "Cancelada", color: "text-red-400 bg-red-400/15" },
  };

  if (userLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold"><span className="text-primary">Meu Painel</span></h1>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
          </div>
          <p className="text-sm text-gray-400">Funcionário · {user?.full_name || "Carregando..."}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Cargas registradas</h2>
            <Link href="/dashboard/employee/orders" className="text-xs text-primary">Ver todas</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-background border border-card-border rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{orders.filter((o: any) => o.status === "open").length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Abertas</p>
            </div>
            <div className="bg-background border border-card-border rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{orders.filter((o: any) => o.status === "in_progress").length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Em andamento</p>
            </div>
            <div className="bg-background border border-card-border rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">{orders.filter((o: any) => o.status === "completed" || o.status === "delivered").length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Concluídas</p>
            </div>
          </div>

          <Link href="/dashboard/employee/orders">
            <div className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[0.98]">
              <Plus className="w-5 h-5" /> Nova Carga
            </div>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <h2 className="font-semibold">Últimas cargas</h2>
          {loading ? (
            Array.from({length:3}).map((_,i) => (
              <div key={i} className="glass-panel p-4 animate-pulse"><div className="h-4 bg-white/10 rounded w-3/4 mb-2" /><div className="h-3 bg-white/5 rounded w-1/2" /></div>
            ))
          ) : orders.length === 0 ? (
            <div className="glass-panel p-8 text-center text-sm text-gray-500">Nenhuma carga registrada ainda</div>
          ) : orders.slice(0,5).map((order: any) => {
            const status = statusConfig[order.status] || { label: order.status, color: "text-gray-400" };
            return (
              <div key={order.id} className="glass-panel p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    order.status === "completed" || order.status === "delivered" ? "bg-primary/10" :
                    order.status === "in_progress" ? "bg-blue-400/10" : "bg-yellow-400/10"
                  }`}>
                    {order.status === "completed" || order.status === "delivered" ? <Check className="w-5 h-5 text-primary" /> :
                     order.status === "in_progress" ? <Clock className="w-5 h-5 text-blue-400" /> :
                     <AlertCircle className="w-5 h-5 text-yellow-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{order.title || order.origin?.split(",")[0] || "Carga"}</p>
                    <p className="text-xs text-gray-500">{order.origin} → {order.destination}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                  <p className="text-[10px] text-gray-600 mt-1">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
