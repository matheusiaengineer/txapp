"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Loader2, Home, Briefcase, Heart, Navigation } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

interface AddressModalProps {
  open: boolean;
  onClose: () => void;
  addressType?: string;
  userId: string;
  onSaved: () => void;
}

interface Suggestion {
  display: string;
  lat: number;
  lng: number;
}

export function AddressModal({ open, onClose, addressType, userId, onSaved }: AddressModalProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [type, setType] = useState(addressType || "home");
  const [label, setLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const typeIcons: Record<string, any> = { home: Home, work: Briefcase, favorite: Heart, other: MapPin };
  const TypeIcon = typeIcons[type] || MapPin;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSuggestions([]);
      setSelected(null);
      setLabel("");
      setType(addressType || "home");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, addressType]);

  async function searchAddress(q: string) {
    setQuery(q);
    if (q.length < 3) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=pt`,
        { headers: { "User-Agent": "TXDAPP/1.0" } }
      );
      const data = await res.json();
      setSuggestions(data.map((r: any) => ({
        display: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      })));
    } catch { setSuggestions([]); }
    setSearching(false);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("addresses").upsert({
        profile_id: userId,
        type,
        full_address: selected.display,
        lat: selected.lat,
        lng: selected.lng,
        label: label || undefined,
      }, { onConflict: "profile_id, type" });
      if (error) throw error;
      onSaved();
      onClose();
    } catch {}
    setSaving(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}>
          <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-background sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TypeIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Adicionar endereço</h2>
                    <p className="text-xs text-gray-500">{type === "home" ? "Casa" : type === "work" ? "Trabalho" : "Local"}</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {["home", "work", "favorite", "other"].map(t => {
                  const Icon = typeIcons[t];
                  const labels: Record<string, string> = { home: "Casa", work: "Trabalho", favorite: "Favorito", other: "Outro" };
                  return (
                    <button key={t} onClick={() => setType(t)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                        type === t ? "bg-primary text-background" : "bg-white/5 text-gray-400 hover:text-white"
                      }`}>
                      <Icon className="w-3.5 h-3.5" /> {labels[t]}
                    </button>
                  );
                })}
              </div>

              <div className="relative mb-3">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </div>
                <input ref={inputRef} value={query} onChange={e => searchAddress(e.target.value)}
                  placeholder="Digite o endereço..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition" />
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto mb-4">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { setSelected(s); setQuery(s.display); setSuggestions([]); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm flex items-start gap-3 transition ${
                      selected?.lat === s.lat ? "bg-primary/10 text-primary" : "text-gray-300 hover:bg-white/5"
                    }`}>
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                    <span className="line-clamp-2">{s.display}</span>
                  </button>
                ))}
                {query.length >= 3 && suggestions.length === 0 && !searching && (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhum endereço encontrado</p>
                )}
              </div>

              {selected && (
                <div className="mb-4">
                  <input value={label} onChange={e => setLabel(e.target.value)}
                    placeholder="Apelido (ex: Casa da vó)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition" />
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-3 rounded-xl transition text-sm">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={!selected || saving}
                  className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Salvar endereço
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
