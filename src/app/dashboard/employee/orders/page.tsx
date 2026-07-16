"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Package, User, MapPin, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EmployeeOrdersPage() {
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    client: "", address: "", items: "", notes: "",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link href="/dashboard/employee" className="p-2 bg-card-bg border border-card-border rounded-full hover:bg-[#2a2a2a] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold">Pedidos</h1>
        </motion.div>

        {!showNewOrder ? (
          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowNewOrder(true)}
            className="w-full glass-panel p-6 text-center hover:border-primary/30 transition-all cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <Plus className="w-7 h-7 text-primary" />
            </div>
            <p className="font-bold text-lg">Criar Novo Pedido</p>
            <p className="text-sm text-gray-400 mt-1">Registre um pedido para entrega</p>
          </motion.button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 space-y-4">
            <h2 className="font-bold text-lg">Novo Pedido</h2>
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Cliente</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={newOrder.client} onChange={e => setNewOrder(p => ({ ...p, client: e.target.value }))}
                    placeholder="Nome do cliente"
                    className="w-full bg-background border border-card-border rounded-lg p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Endereço de entrega</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={newOrder.address} onChange={e => setNewOrder(p => ({ ...p, address: e.target.value }))}
                    placeholder="Rua, número, bairro"
                    className="w-full bg-background border border-card-border rounded-lg p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Itens do pedido</label>
                <div className="relative">
                  <Package className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <textarea value={newOrder.items} onChange={e => setNewOrder(p => ({ ...p, items: e.target.value }))}
                    placeholder="Descreva os itens"
                    className="w-full bg-background border border-card-border rounded-lg p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors min-h-[80px] resize-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Observações</label>
                <textarea value={newOrder.notes} onChange={e => setNewOrder(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Ex: tocar interfone, deixar com porteiro"
                  className="w-full bg-background border border-card-border rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors min-h-[60px] resize-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNewOrder(false)}
                className="flex-1 py-3 bg-card-bg border border-card-border rounded-xl text-sm hover:bg-[#2a2a2a] transition-colors">
                Cancelar
              </button>
              <button onClick={() => { setShowNewOrder(false); setNewOrder({ client: "", address: "", items: "", notes: "" }); }}
                className="flex-1 bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl transition-all hover:scale-[0.98]">
                Criar Pedido
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          <h2 className="font-semibold">Meus pedidos recentes</h2>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Cliente #{i}</p>
                <p className="text-xs text-gray-500">Rua Exemplo, 123 · 2 itens</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">Entregue</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
