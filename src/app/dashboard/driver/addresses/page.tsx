"use client";

import { useState, useEffect, useCallback } from "react";
import { SkeletonList } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Plus, Pencil, Trash2, Star, Clock, X, Save, Navigation,
  Home, Briefcase, Fuel, Warehouse, Bike, Car,
} from "lucide-react";

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  icon: typeof Home | typeof Briefcase | typeof MapPin | typeof Star | typeof Fuel | typeof Warehouse | typeof Bike;
  color: string;
  isFavorite: boolean;
}

const iconMap: Record<string, any> = { home: Home, work: Briefcase, other: MapPin };

function pickIcon(type: string): any {
  return iconMap[type] || MapPin;
}

function pickColor(type: string): string {
  const colors: Record<string, string> = { home: "#3ECB8E", work: "#8B5CF6", other: "#F59E0B" };
  return colors[type] || "#3ECB8E";
}

export default function DriverAddressesPage() {
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPlace, setNewPlace] = useState({ name: "", address: "" });

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        setPlaces((data || []).map((a: any) => ({
          id: a.id,
          name: a.type === "home" ? "Casa" : a.type === "work" ? "Trabalho" : a.full_address.split(",")[0],
          address: a.full_address,
          icon: pickIcon(a.type),
          color: pickColor(a.type),
          isFavorite: a.type === "home",
        })));
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      setPlaces(places.filter((p) => p.id !== id));
    } catch {}
  };

  const handleAddPlace = async () => {
    if (!newPlace.address.trim()) return;
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_address: newPlace.address, type: "other" }),
      });
      if (res.ok) {
        const data = await res.json();
        const place: SavedPlace = {
          id: data.id,
          name: newPlace.name || data.full_address.split(",")[0],
          address: data.full_address,
          icon: MapPin,
          color: "#3ECB8E",
          isFavorite: false,
        };
        setPlaces([place, ...places]);
        setNewPlace({ name: "", address: "" });
        setShowAddForm(false);
      }
    } catch {}
  };

  const handleUpdate = async (id: string, name: string, address: string) => {
    try {
      await fetch(`/api/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_address: address }),
      });
      setPlaces(places.map(p => p.id === id ? { ...p, name, address } : p));
      setEditingId(null);
    } catch {}
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {loading ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SkeletonList count={4} />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Meus endereços</h1>
              <p className="text-sm text-gray-400 mt-1">Pontos de parada e endereços frequentes</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddForm(true)} className="glass-panel p-3 rounded-full">
              <Plus className="w-5 h-5 text-primary" />
            </motion.button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Lugares salvos ({places.length})</h2>
              <AnimatePresence mode="popLayout">
                {places.map((place) => {
                  const Icon = place.icon;
                  const isEditing = editingId === place.id;
                  return (
                    <motion.div key={place.id} layout initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95, x: -20 }} className="glass-panel p-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input type="text" defaultValue={place.name} placeholder="Nome do local"
                            className="w-full bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50" id={`edit-name-${place.id}`} />
                          <input type="text" defaultValue={place.address} placeholder="Endereço"
                            className="w-full bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50" id={`edit-addr-${place.id}`} />
                          <div className="flex gap-2">
                            <motion.button whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                const nameInput = document.getElementById(`edit-name-${place.id}`) as HTMLInputElement;
                                const addrInput = document.getElementById(`edit-addr-${place.id}`) as HTMLInputElement;
                                handleUpdate(place.id, nameInput?.value || place.name, addrInput?.value || place.address);
                              }}
                              className="flex-1 bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all hover:scale-[0.98]">
                              <Save className="w-4 h-4 inline mr-1" /> Salvar
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEditingId(null)}
                              className="bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-4 rounded-xl transition-all">Cancelar</motion.button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${place.color}20` }}>
                            <Icon className="w-5 h-5" style={{ color: place.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">{place.name}</p>
                              {place.isFavorite && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{place.address}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditingId(place.id)}
                              className="p-2 hover:bg-white/10 rounded-xl transition-all">
                              <Pencil className="w-4 h-4 text-gray-400" />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(place.id)}
                              className="p-2 hover:bg-white/10 rounded-xl transition-all">
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {places.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-10 text-center">
                  <MapPin className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Nenhum endereço salvo ainda</p>
                  <p className="text-xs text-gray-600 mt-1">Adicione seus pontos de parada frequentes</p>
                </motion.div>
              )}
            </div>

            <div className="space-y-6">
              <AnimatePresence>
                {showAddForm && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-panel p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Adicionar endereço</h3>
                      <button onClick={() => setShowAddForm(false)} className="p-1.5 hover:bg-white/10 rounded-xl transition-all">
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input type="text" placeholder="Nome (ex: Casa, Posto, Central)" value={newPlace.name}
                        onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors" />
                      <input type="text" placeholder="Endereço" value={newPlace.address}
                        onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors" />
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddPlace}
                        className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all hover:scale-[0.98]">
                        Salvar endereço
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="glass-panel p-5">
                <h3 className="font-semibold mb-3">Dicas para motoristas</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Salve pontos de encontro e regiões de alta demanda</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    <span>Favoritos aparecem como sugestão rápida nas corridas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Fuel className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    <span>Adicione postos de gasolina e pontos de apoio</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
