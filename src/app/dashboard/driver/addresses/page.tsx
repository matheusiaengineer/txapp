"use client";

import { useState, useEffect } from "react";
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

interface RecentDest {
  id: string;
  name: string;
  address: string;
}

const savedPlaces: SavedPlace[] = [
  { id: "1", name: "Casa", address: "Rua das Flores, 123 - Jardim Paulista", icon: Home, color: "#3ECB8E", isFavorite: true },
  { id: "2", name: "Ponto Estratégico", address: "Av. Paulista, 1000 - Bela Vista", icon: MapPin, color: "#8B5CF6", isFavorite: true },
  { id: "3", name: "Posto de Gasolina", address: "Av. Rebouças, 500 - Pinheiros", icon: Fuel, color: "#F59E0B", isFavorite: false },
  { id: "4", name: "Central de Cargas", address: "Rua dos Transportes, 200 - Barra Funda", icon: Warehouse, color: "#06B6D4", isFavorite: true },
];

const recentDestinations: RecentDest[] = [
  { id: "1", name: "Shopping Morumbi", address: "Av. Roque Petroni Júnior, 1089" },
  { id: "2", name: "Aeroporto GRU", address: "Rod. Hélio Smidt, s/n - Guarulhos" },
  { id: "3", name: "Parque Ibirapuera", address: "Av. Pedro Álvares Cabral, s/n" },
  { id: "4", name: "Restaurante Famiglia", address: "Rua Oscar Freire, 800" },
  { id: "5", name: "Hospital Albert Einstein", address: "Av. Albert Einstein, 627" },
];

export default function DriverAddressesPage() {
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<SavedPlace[]>(savedPlaces);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPlace, setNewPlace] = useState({ name: "", address: "" });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = (id: string) => {
    setPlaces(places.filter((p) => p.id !== id));
  };

  const handleAddPlace = () => {
    if (!newPlace.name.trim() || !newPlace.address.trim()) return;
    const place: SavedPlace = {
      id: Date.now().toString(),
      name: newPlace.name,
      address: newPlace.address,
      icon: MapPin,
      color: "#3ECB8E",
      isFavorite: false,
    };
    setPlaces([...places, place]);
    setNewPlace({ name: "", address: "" });
    setShowAddForm(false);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {loading ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SkeletonList count={4} />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Meus endereços</h1>
              <p className="text-sm text-gray-400 mt-1">Pontos de parada e endereços frequentes</p>
            </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            className="glass-panel p-3 rounded-full"
          >
            <Plus className="w-5 h-5 text-primary" />
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Saved Places */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Lugares salvos ({places.length})
            </h2>
            <AnimatePresence mode="popLayout">
              {places.map((place) => {
                const Icon = place.icon;
                const isEditing = editingId === place.id;

                return (
                  <motion.div
                    key={place.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                    className="glass-panel p-4"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          defaultValue={place.name}
                          placeholder="Nome do local"
                          className="w-full bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50"
                        />
                        <input
                          type="text"
                          defaultValue={place.address}
                          placeholder="Endereço"
                          className="w-full bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50"
                        />
                        <div className="flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setEditingId(null)}
                            className="flex-1 bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all hover:scale-[0.98]"
                          >
                            <Save className="w-4 h-4 inline mr-1" /> Salvar
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setEditingId(null)}
                            className="bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-4 rounded-xl transition-all"
                          >
                            Cancelar
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${place.color}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: place.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{place.name}</p>
                            {place.isFavorite && (
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{place.address}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingId(place.id)}
                            className="p-2 hover:bg-white/10 rounded-xl transition-all"
                          >
                            <Pencil className="w-4 h-4 text-gray-400" />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(place.id)}
                            className="p-2 hover:bg-white/10 rounded-xl transition-all"
                          >
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-10 text-center"
              >
                <MapPin className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Nenhum endereço salvo ainda</p>
                <p className="text-xs text-gray-600 mt-1">
                  Adicione seus pontos de parada frequentes
                </p>
              </motion.div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Add Place Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-panel p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Adicionar endereço</h3>
                    <button onClick={() => setShowAddForm(false)} className="p-1.5 hover:bg-white/10 rounded-xl transition-all">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nome (ex: Casa, Posto, Central)"
                      value={newPlace.name}
                      onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                      className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Endereço"
                      value={newPlace.address}
                      onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                      className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddPlace}
                      className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all hover:scale-[0.98]"
                    >
                      Salvar endereço
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent Destinations */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Destinos recentes
              </h2>
              <div className="space-y-1">
                {recentDestinations.map((dest) => (
                  <motion.div
                    key={dest.id}
                    whileHover={{ x: 4 }}
                    className="glass-panel p-3 flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{dest.name}</p>
                      <p className="text-xs text-gray-500 truncate">{dest.address}</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 hover:bg-white/10 rounded-xl transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-gray-500" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick tips for drivers/motoboys */}
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

