"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, TrendingUp, Tag, Phone, Mail, MapPin, Filter, ChevronDown, MessageSquare, Plus, X } from "lucide-react";
import Link from "next/link";

const MOCK_CLIENTS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: ["Ana Oliveira", "Carlos Santos", "Maria Silva", "João Pereira", "Julia Costa", "Pedro Almeida"][i % 6],
  phone: "(11) 9" + String(90000 + i * 1234).substring(0, 4) + "-" + String(1000 + i * 321).substring(0, 4),
  orders: Math.floor(Math.random() * 50) + 1,
  totalSpent: Math.random() * 5000 + 100,
  lastOrder: i === 0 ? "Hoje" : i === 1 ? "Ontem" : `${i} dias atrás`,
  tags: i % 2 === 0 ? ["VIP", "Recorrente"] : ["Novo"],
  rating: (4 + Math.random()).toFixed(1),
  favoriteCategory: ["Pizza", "Marmitex", "Doces", "Açaí", "Sushi", "Hambúrguer"][i % 6],
  preferredDriver: i % 2 === 0 ? "Carlos" : null,
}));

export default function CompanyClientsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const filtered = MOCK_CLIENTS.filter(c => {
    if (filter === "vip") return c.tags.includes("VIP");
    if (filter === "new") return c.tags.includes("Novo");
    if (filter === "inactive") return c.lastOrder.includes("dias") && parseInt(c.lastOrder) > 15;
    return true;
  }).filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Clientes</h1>
          <p className="text-sm text-gray-400">CRM completo com {MOCK_CLIENTS.length} clientes</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-background border border-card-border rounded-xl p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: "all", label: "Todos" },
            { key: "vip", label: "VIP ⭐", count: MOCK_CLIENTS.filter(c => c.tags.includes("VIP")).length },
            { key: "new", label: "Novos", count: MOCK_CLIENTS.filter(c => c.tags.includes("Novo")).length },
            { key: "inactive", label: "Inativos", count: MOCK_CLIENTS.filter(c => c.lastOrder.includes("dias") && parseInt(c.lastOrder) > 15).length },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === f.key ? "bg-primary text-background" : "bg-card-bg text-gray-400 hover:text-white"
              }`}>
              {f.label} {f.count !== undefined && `(${f.count})`}
            </button>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => (
            <motion.div key={client.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-panel p-4 cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => setSelectedClient(client)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{client.name}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-gray-400">{client.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {client.tags.map(tag => (
                    <span key={tag} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      tag === "VIP" ? "bg-yellow-400/20 text-yellow-400" : "bg-blue-400/20 text-blue-400"
                    }`}>{tag}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-background rounded-xl p-2">
                <div>
                  <p className="font-bold text-primary">{client.orders}</p>
                  <p className="text-gray-500">Pedidos</p>
                </div>
                <div>
                  <p className="font-bold text-primary">R$ {client.totalSpent.toFixed(0)}</p>
                  <p className="text-gray-500">Gasto</p>
                </div>
                <div>
                  <p className="text-gray-300 text-[10px]">{client.lastOrder}</p>
                  <p className="text-gray-500">Último</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedClient && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60"
              onClick={() => setSelectedClient(null)}>
              <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                className="w-full max-w-lg max-h-[80vh] overflow-y-auto glass-panel rounded-t-2xl md:rounded-2xl p-6 m-4"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xl">
                      {selectedClient.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">{selectedClient.name}</h2>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span>{selectedClient.rating}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedClient(null)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-background border border-card-border rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-primary">{selectedClient.orders}</p>
                    <p className="text-[10px] text-gray-500">Pedidos</p>
                  </div>
                  <div className="bg-background border border-card-border rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-primary">R$ {selectedClient.totalSpent.toFixed(0)}</p>
                    <p className="text-[10px] text-gray-500">Gasto total</p>
                  </div>
                  <div className="bg-background border border-card-border rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-primary">R$ {(selectedClient.totalSpent / selectedClient.orders).toFixed(0)}</p>
                    <p className="text-[10px] text-gray-500">Ticket médio</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400"><Phone className="w-4 h-4" /> {selectedClient.phone}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-400"><TrendingUp className="w-4 h-4" /> Categoria favorita: {selectedClient.favoriteCategory}</div>
                  {selectedClient.preferredDriver && (
                    <div className="flex items-center gap-2 text-sm text-gray-400"><Star className="w-4 h-4" /> Motorista preferido: {selectedClient.preferredDriver}</div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedClient.tags.map((tag: string) => (
                    <span key={tag} className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                      <Tag className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                  <button className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-card-bg text-gray-400 hover:text-white transition-colors">
                    <Plus className="w-3 h-3" /> Adicionar tag
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <button className="w-full py-3 bg-primary text-background font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-hover transition-all">
                    <MessageSquare className="w-4 h-4" /> Disparar campanha
                  </button>
                  <Link href="/dashboard/company/campaigns" className="w-full py-3 bg-card-bg border border-card-border rounded-xl text-sm text-center hover:bg-[#2a2a2a] transition-colors">
                    Ver histórico de pedidos
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
