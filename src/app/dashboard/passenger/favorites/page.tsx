"use client";

import { useState, useEffect } from "react";
import { SkeletonList } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Home, Briefcase, MapPin, Plus, Pencil, Trash2,
  Star, Clock, X, Save, Navigation, Loader2, CheckCircle,
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

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formType, setFormType] = useState<"home" | "work" | "other">("other");
  const [formAddress, setFormAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      setAddresses(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, []);

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
    } catch {}
  };

  const openEdit = (addr: Address) => {
    setEditId(addr.id);
    setFormType(addr.type);
    setFormAddress(addr.full_address);
    setShowAddForm(true);
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

        {addresses.length === 0 && !showAddForm ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-16">
            <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-lg font-medium">Nenhum endereço salvo</p>
            <p className="text-gray-600 text-sm mt-1">Adicione sua casa, trabalho ou lugares frequentes</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr, i) => {
              const meta = TYPE_META[addr.type] || TYPE_META.other;
              return (
                <motion.div key={addr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-panel p-4 flex items-center gap-4 group hover:border-primary/20 transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${meta.color}15` }}>
                    <meta.icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white">{meta.label}</div>
                    <div className="text-xs text-gray-500 truncate">{addr.full_address}</div>
                    {addr.lat && addr.lng && (
                      <div className="text-[10px] text-gray-600 mt-0.5">Coordenadas salvas</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEdit(addr)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                      <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => handleDelete(addr.id)} className="w-8 h-8 rounded-lg bg-red-400/10 hover:bg-red-400/20 flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
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