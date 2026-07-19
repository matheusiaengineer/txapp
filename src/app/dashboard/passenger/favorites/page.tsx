"use client";

import { useState, useEffect } from "react";
import { SkeletonList } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Home, Briefcase, MapPin, Plus, Pencil, Trash2,
  Star, Clock, X, Save, Navigation, Loader2, CheckCircle, Search,
} from "lucide-react";

interface Address {
  id: string;
  type: "home" | "work" | "other";
  full_address: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  home: { icon: Home, color: "#3ECB8E", label: "Casa" },
  work: { icon: Briefcase, color: "#8B5CF6", label: "Trabalho" },
  other: { icon: MapPin, color: "#F59E0B", label: "Outro" },
};

const TYPE_OPTIONS = [
  { id: "home" as const, label: "Casa", icon: Home, color: "#3ECB8E" },
  { id: "work" as const, label: "Trabalho", icon: Briefcase, color: "#8B5CF6" },
  { id: "other" as const, label: "Outro", icon: MapPin, color: "#F59E0B" },
];

const RECENT = [
  { address: "Rua Augusta, 1500 — Consolação", type: "other" },
  { address: "Av. Paulista, 1000 — Bela Vista", type: "work" },
];

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formType, setFormType] = useState<"home" | "work" | "other">("other");
  const [formAddress, setFormAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      setAddresses(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, []);

  const filtered = addresses.filter(a =>
    !search.trim() || a.full_address.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!formAddress.trim()) return;
    setSaving(true);
    try {
      const method = editId ? "PUT" : "POST";
      const url = editId ? `/api/addresses/${editId}` : "/api/addresses";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_address: formAddress, type: formType }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        setShowAddForm(false);
        setEditId(null);
        setFormAddress("");
        fetchAddresses();
      }
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      setAddresses(prev => prev.filter(a => a.id !== id));
      setDeleteConfirm(null);
    } catch {}
  };

  const openEdit = (addr: Address) => {
    setEditId(addr.id);
    setFormType(addr.type);
    setFormAddress(addr.full_address);
    setShowAddForm(true);
  };

  const handleShare = async (addr: Address) => {
    const text = `${addr.full_address}`;
    if (navigator.share) {
      await navigator.share({ title: "Meu endereço TXD", text });
    } else {
      await navigator.clipboard.writeText(text);
      setShareId(addr.id);
      setTimeout(() => setShareId(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground p-4 sm:p-6 lg:p-8" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom,0px))" }}>
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Meus lugares</h1>
            <p className="text-sm text-gray-400 mt-1">Endereços salvos</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setShowAddForm(true); setEditId(null); setFormType("other"); setFormAddress(""); }}
            className="glass-panel p-3 rounded-full">
            <Plus className="w-5 h-5 text-primary" />
          </motion.button>
        </motion.div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Buscar endereço salvo..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-background border border-card-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/30 transition" />
        </div>

        {/* Recent searches (#46) */}
        {!search && !showAddForm && addresses.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Usados recentemente</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {RECENT.map((r, i) => {
                const meta = TYPE_META[r.type] || TYPE_META.other;
                return (
                  <div key={i} className="glass-panel p-3 shrink-0 flex items-center gap-2 rounded-xl hover:border-primary/20 cursor-pointer transition">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-400 truncate max-w-[160px]">{r.address}</span>
                    <meta.icon className="w-3 h-3 shrink-0" style={{ color: meta.color }} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showAddForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="glass-panel p-5 mb-6 space-y-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white">{editId ? "Editar" : "Novo"} endereço</h2>
                <button onClick={() => { setShowAddForm(false); setEditId(null); }}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map(t => (
                  <button key={t.id} onClick={() => setFormType(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      formType === t.id ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                    }`}>
                    <t.icon className="w-3.5 h-3.5" style={{ color: t.color }} /> {t.label}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Digite o endereço..."
                value={formAddress} onChange={e => setFormAddress(e.target.value)}
                className="w-full bg-card-bg border border-card-border rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/50" />
              <div className="flex gap-2">
                <button onClick={() => { setShowAddForm(false); setEditId(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm font-medium hover:text-white transition">Cancelar</button>
                <button onClick={handleSave} disabled={saving || !formAddress.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-background text-sm font-bold hover:bg-primary-hover transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {editId ? "Salvar" : "Adicionar"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length === 0 && !showAddForm ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-16">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }} className="mb-4">
              <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-2" />
            </motion.div>
            <p className="text-gray-400 text-lg font-medium">
              {search ? "Nenhum resultado" : "Nenhum endereço salvo"}
            </p>
            <p className="text-gray-600 text-sm mt-1">
              {search ? "Tente outro termo de busca" : "Adicione sua casa, trabalho ou lugares frequentes"}
            </p>
            {!search && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setShowAddForm(true); }}
                className="mt-6 bg-primary text-background font-semibold px-6 py-3 rounded-xl text-sm">
                <Plus className="w-4 h-4 inline mr-1.5" />Adicionar endereço
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filtered.map((addr, i) => {
              const meta = TYPE_META[addr.type] || TYPE_META.other;
              const isDeleting = deleteConfirm === addr.id;
              const isSharing = shareId === addr.id;
              return (
                <motion.div key={addr.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-panel p-4 flex items-center gap-3 group hover:border-primary/20 transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${meta.color}15` }}>
                    <meta.icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white">{meta.label}</div>
                    <div className="text-xs text-gray-500 truncate">{addr.full_address}</div>
                  </div>
                  {isDeleting ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDeleteConfirm(null)} className="text-[10px] text-gray-400 hover:text-white px-2 py-1">Cancelar</button>
                      <button onClick={() => handleDelete(addr.id)} className="text-[10px] text-red-400 font-bold px-2 py-1">Excluir</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleShare(addr)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
                        title="Compartilhar">
                        {isSharing ? <CheckCircle className="w-3.5 h-3.5 text-primary" /> : <Navigation className="w-3.5 h-3.5 text-gray-400" />}
                      </button>
                      <button onClick={() => openEdit(addr)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      <button onClick={() => setDeleteConfirm(addr.id)} className="w-8 h-8 rounded-lg bg-red-400/10 hover:bg-red-400/20 flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}