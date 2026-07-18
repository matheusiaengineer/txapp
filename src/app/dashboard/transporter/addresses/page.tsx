"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Plus, Pencil, Trash2, Star, Clock, X, Save, Navigation,
  Home, Warehouse, Building2, Fuel, Scale, Truck,
} from "lucide-react";

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  icon: typeof Home | typeof Warehouse | typeof Building2 | typeof MapPin | typeof Star | typeof Fuel;
  color: string;
  isFavorite: boolean;
}

interface RecentDest {
  id: string;
  name: string;
  address: string;
}

const savedPlaces: SavedPlace[] = [
  { id: "1", name: "Base Operacional", address: "Rod. Anhanguera, km 25 - Perus", icon: Warehouse, color: "#3ECB8E", isFavorite: true },
  { id: "2", name: "Terminal de Cargas", address: "Av. dos Bandeirantes, 5000 - Vila Olímpia", icon: Building2, color: "#8B5CF6", isFavorite: true },
  { id: "3", name: "Posto Diesel", address: "Rod. Castelo Branco, km 15", icon: Fuel, color: "#F59E0B", isFavorite: false },
  { id: "4", name: "Almoxarifado Central", address: "Rua do Porto, 300 - Santo Amaro", icon: Warehouse, color: "#06B6D4", isFavorite: true },
];

const recentDestinations: RecentDest[] = [
  { id: "1", name: "Distribuidora ABC", address: "Av. Marginal Tietê, 2000" },
  { id: "2", name: "Porto Seco SP", address: "Rod. Dutra, km 230 - Guarulhos" },
  { id: "3", name: "Ceagesp", address: "Av. Dr. Gastão Vidigal, 1000 - Vila Leopoldina" },
  { id: "4", name: "Indústria MetalTech", address: "Av. Interlagos, 5000" },
  { id: "5", name: "Atacadão Zona Sul", address: "Av. Washington Luís, 500" },
];

export default function TransporterAddressesPage() {
  const [places, setPlaces] = useState<SavedPlace[]>(savedPlaces);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPlace, setNewPlace] = useState({ name: "", address: "" });

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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Pontos de carga</h1>
            <p className="text-sm text-gray-400 mt-1">Endereços de coleta, entrega e base</p>
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
              Endereços salvos ({places.length})
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
                            className="flex-1 bg-primary text-background text-sm font-semibold py-2 rounded-xl"
                          >
                            <Save className="w-4 h-4 inline mr-1" /> Salvar
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-foreground"
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
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4 text-gray-400" />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(place.id)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
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
                  Adicione seus pontos de carga e descarga
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
                    <button onClick={() => setShowAddForm(false)}>
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nome (ex: Galpão, Porto, Cliente)"
                      value={newPlace.name}
                      onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                      className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Endereço completo"
                      value={newPlace.address}
                      onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                      className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddPlace}
                      className="w-full bg-primary text-background font-semibold py-3 rounded-xl text-sm"
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
                      className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-gray-500" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick tips for transporters */}
            <div className="glass-panel p-5">
              <h3 className="font-semibold mb-3">Dicas para transportadores</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Salve terminais e clientes frequentes para agilizar fretes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                  <span>Favoritos aparecem como sugestão ao criar novo frete</span>
                </li>
                <li className="flex items-start gap-2">
                  <Scale className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <span>Adicione balanças e postos de pesagem no trajeto</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
