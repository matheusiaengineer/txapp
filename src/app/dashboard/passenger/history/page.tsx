"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SkeletonList } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, MapPin, User, Star, RotateCcw, ChevronDown, ChevronUp,
  Navigation, Calendar, DollarSign, ThumbsUp, X, Check, Search, AlertTriangle, ArrowRight,
} from "lucide-react";

type FilterType = "all" | "active" | "completed" | "cancelled";

interface TripDetail {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: string;
  status: "active" | "completed" | "cancelled";
  driverName: string;
  driverRating: number;
  driverImage: string;
  estimatedTime: string;
  distance: string;
}

const trips: TripDetail[] = [
  {
    id: "1",
    from: "Av. Paulista, 1000",
    to: "Shopping Morumbi",
    date: "12 jul 2026",
    time: "14:30",
    price: "R$ 24,90",
    status: "completed",
    driverName: "Ricardo M.",
    driverRating: 4.9,
    driverImage: "RM",
    estimatedTime: "18 min",
    distance: "8,2 km",
  },
  {
    id: "2",
    from: "Rua das Flores, 123",
    to: "Aeroporto Internacional GRU",
    date: "10 jul 2026",
    time: "08:15",
    price: "R$ 89,50",
    status: "completed",
    driverName: "Camila S.",
    driverRating: 5.0,
    driverImage: "CS",
    estimatedTime: "35 min",
    distance: "28 km",
  },
  {
    id: "3",
    from: "Av. Faria Lima, 2000",
    to: "Restaurante Famiglia",
    date: "08 jul 2026",
    time: "20:00",
    price: "R$ 18,30",
    status: "cancelled",
    driverName: "——",
    driverRating: 0,
    driverImage: "—",
    estimatedTime: "12 min",
    distance: "5,1 km",
  },
  {
    id: "4",
    from: "Academia BodyFit",
    to: "Rua das Flores, 123",
    date: "06 jul 2026",
    time: "19:45",
    price: "R$ 14,20",
    status: "completed",
    driverName: "Thiago L.",
    driverRating: 4.8,
    driverImage: "TL",
    estimatedTime: "10 min",
    distance: "4,3 km",
  },
  {
    id: "5",
    from: "Casa",
    to: "Parque Ibirapuera",
    date: "04 jul 2026",
    time: "07:00",
    price: "R$ 12,50",
    status: "completed",
    driverName: "Juliana F.",
    driverRating: 4.7,
    driverImage: "JF",
    estimatedTime: "8 min",
    distance: "3,8 km",
  },
  {
    id: "6",
    from: "Shopping Eldorado",
    to: "Casa",
    date: "13 jul 2026",
    time: "Em andamento",
    price: "R$ 16,80",
    status: "active",
    driverName: "Marcos A.",
    driverRating: 4.9,
    driverImage: "MA",
    estimatedTime: "14 min",
    distance: "6,5 km",
  },
];

const filters: { key: FilterType; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "active", label: "Ativas" },
  { key: "completed", label: "Completas" },
  { key: "cancelled", label: "Canceladas" },
];

function humanizeDate(dateStr: string, time: string): string {
  const now = new Date();
  const parts = dateStr.split(" ");
  if (parts.length >= 3) {
    const day = parseInt(parts[0]);
    const month = parts[1];
    const months: Record<string, number> = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
    const d = new Date(parseInt(parts[2]), months[month.toLowerCase().slice(0, 3)] || 0, day);
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 1) return `Hoje, ${time}`;
    if (diff < 2) return `Ontem, ${time}`;
  }
  return `${dateStr} • ${time}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <span className="text-xs font-semibold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Check className="w-3 h-3" /> Completa
        </span>
      );
    case "cancelled":
      return (
        <span className="text-xs font-semibold text-red-400 bg-red-400/15 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <X className="w-3 h-3" /> Cancelada
        </span>
      );
    case "active":
      return (
        <span className="text-xs font-semibold text-yellow-400 bg-yellow-400/15 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" /> Em andamento
        </span>
      );
    default:
      return null;
  }
}

export default function TripHistory() {
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ratedTrips, setRatedTrips] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => { setTimeout(() => setLoading(false), 800); }, []);
  if (loading) return <div className="min-h-[100dvh] bg-background text-foreground p-4 sm:p-6 lg:p-8" style={{paddingBottom:"calc(1.5rem + env(safe-area-inset-bottom,0px))"}}><SkeletonList count={5} /></div>;

  const filteredTrips = trips
    .filter(t => activeFilter === "all" ? true : t.status === activeFilter)
    .filter(t => searchQuery === "" || t.from.toLowerCase().includes(searchQuery.toLowerCase()) || t.to.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, visibleCount);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Histórico de viagens</h1>
          <p className="text-sm text-gray-400 mt-1">Suas corridas recentes</p>
        </motion.div>

        {/* Search bar (#26) */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Buscar por rua, bairro..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full glass-panel py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/30 transition-all rounded-xl" />
        </div>

        {/* Filter Tabs (#17) */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          {filters.map((f) => (
            <motion.button key={f.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveFilter(f.key)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === f.key ? "bg-primary text-background" : "glass-panel text-gray-400 hover:text-foreground"
              }`}>
              {f.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Trip List */}
        <AnimatePresence mode="wait">
          {filteredTrips.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="glass-panel p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {searchQuery ? "Nenhum resultado" : activeFilter === "all" ? "Nenhuma viagem ainda" : "Nenhuma viagem encontrada"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {activeFilter === "active" ? "Você não tem viagens em andamento"
                  : activeFilter === "cancelled" ? "Nenhuma viagem cancelada"
                  : searchQuery ? "Tente outro termo de busca"
                  : "Solicite sua primeira corrida agora"}
              </p>
              {!searchQuery && (
                <a href="/ride" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-background font-bold px-6 py-3 rounded-xl text-sm transition-all">
                  Fazer primeira corrida <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </motion.div>
          ) : (
            <motion.div key={activeFilter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {filteredTrips.map((trip) => {
                const isExpanded = expandedId === trip.id;
                return (
                  <motion.div key={trip.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-panel overflow-hidden">
                    <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : trip.id)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            <span className="truncate">{trip.from}</span>
                          </div>
                          {/* Dotted line (#28) */}
                          <div className="flex items-center ml-[3px] my-0.5">
                            <div className="w-px h-3 border-l border-dotted border-gray-600" />
                          </div>
                          <div className="flex items-center gap-2 text-sm mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                            <span className="truncate">{trip.to}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          {getStatusBadge(trip.status)}
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {humanizeDate(trip.date, trip.time)}
                        </span>
                        <span className="font-semibold text-foreground">{trip.price}</span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }} className="overflow-hidden">
                          <div className="border-t border-card-border px-4 py-4 space-y-4">
                            <div className="h-28 rounded-2xl bg-[#0a0a0a] overflow-hidden relative">
                              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, #3ECB8E 0%, transparent 50%), radial-gradient(circle at 70% 60%, #3ECB8E 0%, transparent 40%)" }} />
                              <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(#2a2a2a 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex items-center gap-8">
                                  <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                    <span className="text-xs text-primary mt-1">Origem</span>
                                  </div>
                                  <div className="w-12 h-0.5 border-t border-dashed border-gray-600" />
                                  <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <span className="text-xs text-red-400 mt-1">Destino</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {trip.status !== "cancelled" && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">{trip.driverImage}</div>
                                  <div>
                                    <p className="text-sm font-semibold">{trip.driverName}</p>
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                      <span className="text-xs text-gray-400">{trip.driverRating}</span>
                                    </div>
                                  </div>
                                </div>
                                <button className="text-xs bg-primary/15 text-primary px-3 py-1.5 rounded-full font-medium hover:bg-primary/25 transition">Ver perfil</button>
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-background border border-card-border rounded-xl p-3 text-center">
                                <Navigation className="w-4 h-4 text-primary mx-auto mb-1" />
                                <p className="text-xs font-semibold">{trip.distance}</p>
                                <p className="text-xs text-gray-500">Distância</p>
                              </div>
                              <div className="bg-background border border-card-border rounded-xl p-3 text-center">
                                <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                                <p className="text-xs font-semibold">{trip.estimatedTime}</p>
                                <p className="text-xs text-gray-500">Tempo</p>
                              </div>
                              <div className="bg-background border border-card-border rounded-xl p-3 text-center">
                                <DollarSign className="w-4 h-4 text-primary mx-auto mb-1" />
                                <p className="text-xs font-semibold">{trip.price}</p>
                                <p className="text-xs text-gray-500">Valor</p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              {trip.status === "completed" && !ratedTrips.has(trip.id) && (
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                  onClick={(e) => { e.stopPropagation(); setRatedTrips(new Set(ratedTrips).add(trip.id)); }}
                                  className="flex-1 flex items-center justify-center gap-2 bg-primary/15 text-primary text-sm font-medium py-2.5 rounded-xl hover:bg-primary/25 transition-colors">
                                  <ThumbsUp className="w-4 h-4" /> Avaliar motorista
                                </motion.button>
                              )}
                              {trip.status === "completed" && ratedTrips.has(trip.id) && (
                                <div className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary/60 text-sm font-medium py-2.5 rounded-xl">
                                  <Star className="w-4 h-4" /> Avaliado
                                </div>
                              )}
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 flex items-center justify-center gap-2 glass-panel text-sm font-medium py-2.5 rounded-xl hover:border-primary/30 transition-colors">
                                <RotateCcw className="w-4 h-4" /> Repetir viagem
                              </motion.button>
                              <Link href={`/support?trip=${trip.id}`}
                                className="text-[10px] text-gray-500 hover:text-primary self-center transition-colors">
                                Tive um problema
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
              {/* Load more (#16 infinite scroll) */}
              {visibleCount < trips.filter(t => activeFilter === "all" ? true : t.status === activeFilter).length && (
                <button onClick={() => setVisibleCount(prev => prev + 10)}
                  className="w-full py-3 text-sm text-primary hover:text-primary-hover font-medium transition-colors">
                  Carregar mais...
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
