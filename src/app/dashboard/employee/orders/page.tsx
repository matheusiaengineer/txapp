"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Package, MapPin, Loader2, Check, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function EmployeeOrdersPage() {
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newOrder, setNewOrder] = useState({
    origin_address: "", dest_address: "", description: "", weight_kg: "", vehicle_type: "carro",
  });

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/employee/orders");
      if (res.ok) setOrders(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCreate = async () => {
    if (!newOrder.origin_address.trim() || !newOrder.dest_address.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/employee/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newOrder, weight_kg: newOrder.weight_kg ? parseFloat(newOrder.weight_kg) : null }),
      });
      if (res.ok) {
        setShowNewOrder(false);
        setNewOrder({ origin_address: "", dest_address: "", description: "", weight_kg: "", vehicle_type: "carro" });
        fetchOrders();
      }
    } catch {} finally { setSaving(false); }
  };

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link href="/dashboard/employee" className="p-2 bg-background border border-card-border rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold">Cargas</h1>
        </motion.div>

        {!showNewOrder ? (
          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowNewOrder(true)}
            className="w-full glass-panel p-6 text-center hover:border-primary/30 transition-all cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <Plus className="w-7 h-7 text-primary" />
            </div>
            <p className="font-bold text-lg">Criar Nova Carga</p>
            <p className="text-sm text-gray-400 mt-1">Registre uma carga para transporte</p>
          </motion.button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Nova Carga</h2>
              <button onClick={() => setShowNewOrder(false)} className="text-sm text-gray-400 hover:text-white">Cancelar</button>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Endereço de coleta *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={newOrder.origin_address} onChange={e => setNewOrder(p => ({ ...p, origin_address: e.target.value }))}
                    placeholder="Rua, número, bairro"
                    className="w-full bg-background border border-card-border rounded-xl p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Endereço de entrega *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={newOrder.dest_address} onChange={e => setNewOrder(p => ({ ...p, dest_address: e.target.value }))}
                    placeholder="Rua, número, bairro"
                    className="w-full bg-background border border-card-border rounded-xl p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Descrição da carga</label>
                <div className="relative">
                  <Package className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <textarea value={newOrder.description} onChange={e => setNewOrder(p => ({ ...p, description: e.target.value }))}
                    placeholder="Descreva a carga"
                    className="w-full bg-background border border-card-border rounded-xl p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors min-h-[80px] resize-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Peso (kg)</label>
                  <input type="number" value={newOrder.weight_kg} onChange={e => setNewOrder(p => ({ ...p, weight_kg: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-background border border-card-border rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Tipo de veículo</label>
                  <select value={newOrder.vehicle_type} onChange={e => setNewOrder(p => ({ ...p, vehicle_type: e.target.value }))}
                    className="w-full bg-background border border-card-border rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors">
                    <option value="carro">Carro</option>
                    <option value="moto">Moto</option>
                    <option value="van">Van</option>
                    <option value="caminhonete">Caminhonete</option>
                    <option value="caminhao">Caminhão</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNewOrder(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm">Cancelar</button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl transition-all hover:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Criar Carga
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          <h2 className="font-semibold">Minhas cargas recentes</h2>
          {loading ? (
            Array.from({length:3}).map((_,i) => (
              <div key={i} className="glass-panel p-4 animate-pulse"><div className="h-4 bg-white/10 rounded w-3/4 mb-2" /><div className="h-3 bg-white/5 rounded w-1/2" /></div>
            ))
          ) : orders.length === 0 ? (
            <div className="glass-panel p-8 text-center text-sm text-gray-500">Nenhuma carga registrada</div>
          ) : orders.map((order: any) => {
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
        </div>
      </div>
    </div>
  );
}
