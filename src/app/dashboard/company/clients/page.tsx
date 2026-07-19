"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, TrendingUp, Tag, Phone, Plus, X, Mail } from "lucide-react";

export default function CompanyClientsPage() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "", notes: "" });

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/company/clients");
      if (res.ok) setClients(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleAdd = async () => {
    if (!newClient.name.trim()) return;
    try {
      await fetch("/api/company/clients", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      setShowAdd(false);
      setNewClient({ name: "", phone: "", email: "", notes: "" });
      fetchClients();
    } catch {}
  };

  const filtered = clients.filter((c: any) => c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Clientes</h1>
            <p className="text-sm text-gray-400">{clients.length} clientes cadastrados</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="bg-primary hover:bg-primary-hover text-background text-xs font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[0.98] flex items-center gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-background border border-card-border rounded-xl p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors" />
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({length:6}).map((_,i) => (
              <div key={i} className="glass-panel p-4 animate-pulse"><div className="h-4 bg-white/10 rounded w-3/4 mb-3" /><div className="h-3 bg-white/5 rounded w-1/2" /></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((client: any) => (
              <motion.div key={client.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-panel p-4 cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => setSelectedClient(client)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                      {client.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{client.name}</p>
                      {client.total_orders > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-gray-400">{client.total_orders} pedidos</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(client.tags || []).map((tag: string) => (
                      <span key={tag} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        tag === "VIP" ? "bg-yellow-400/20 text-yellow-400" : "bg-blue-400/20 text-blue-400"
                      }`}>{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-background rounded-xl p-2">
                  <div>
                    <p className="font-bold text-primary">{client.total_orders || 0}</p>
                    <p className="text-gray-500">Pedidos</p>
                  </div>
                  <div>
                    <p className="font-bold text-primary">R$ {(client.total_spent || 0).toFixed(0)}</p>
                    <p className="text-gray-500">Gasto</p>
                  </div>
                  <div>
                    <p className="text-gray-300 text-xs">{client.last_order_at ? new Date(client.last_order_at).toLocaleDateString("pt-BR") : "—"}</p>
                    <p className="text-gray-500">Último</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60"
              onClick={() => setShowAdd(false)}>
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="w-full max-w-lg glass-panel rounded-t-2xl md:rounded-2xl p-6 m-4 space-y-4"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">Novo cliente</h2>
                  <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <input type="text" placeholder="Nome" value={newClient.name} onChange={e => setNewClient(p => ({...p, name: e.target.value}))}
                  className="w-full bg-background border border-card-border rounded-xl p-3 text-white outline-none focus:border-primary/50" />
                <input type="text" placeholder="Telefone" value={newClient.phone} onChange={e => setNewClient(p => ({...p, phone: e.target.value}))}
                  className="w-full bg-background border border-card-border rounded-xl p-3 text-white outline-none focus:border-primary/50" />
                <input type="email" placeholder="Email" value={newClient.email} onChange={e => setNewClient(p => ({...p, email: e.target.value}))}
                  className="w-full bg-background border border-card-border rounded-xl p-3 text-white outline-none focus:border-primary/50" />
                <textarea placeholder="Observações" value={newClient.notes} onChange={e => setNewClient(p => ({...p, notes: e.target.value}))}
                  className="w-full bg-background border border-card-border rounded-xl p-3 text-white outline-none focus:border-primary/50 min-h-[60px] resize-none" />
                <button onClick={handleAdd}
                  className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all hover:scale-[0.98]">Salvar</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                      {selectedClient.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">{selectedClient.name}</h2>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {selectedClient.total_orders > 0 && <><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /><span>{selectedClient.total_orders} pedidos</span></>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedClient(null)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-background border border-card-border rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-primary">{selectedClient.total_orders || 0}</p>
                    <p className="text-xs text-gray-500">Pedidos</p>
                  </div>
                  <div className="bg-background border border-card-border rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-primary">R$ {(selectedClient.total_spent || 0).toFixed(0)}</p>
                    <p className="text-xs text-gray-500">Gasto total</p>
                  </div>
                  <div className="bg-background border border-card-border rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-primary">R$ {selectedClient.total_orders ? (selectedClient.total_spent / selectedClient.total_orders).toFixed(0) : "0"}</p>
                    <p className="text-xs text-gray-500">Ticket médio</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {selectedClient.phone && <div className="flex items-center gap-2 text-sm text-gray-400"><Phone className="w-4 h-4" /> {selectedClient.phone}</div>}
                  {selectedClient.email && <div className="flex items-center gap-2 text-sm text-gray-400"><Mail className="w-4 h-4" /> {selectedClient.email}</div>}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(selectedClient.tags || []).map((tag: string) => (
                    <span key={tag} className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                      <Tag className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
