"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, User, Search, MapPin, Home, Briefcase, Plane, Heart,
  ChevronRight, Star, Clock, ArrowRight, DollarSign, Bike, Car,
  Sparkles, Shield, Package, PawPrint, VenusAndMars, Truck, Navigation, Loader2,
  Camera, X, Video,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";
import { usePassengerData } from "@/lib/hooks/use-passenger-data";

interface Service {
  id: string; name: string; icon: typeof Car; color: string; priceRange: string; eta: string;
}

const services: Service[] = [
  { id: "moto", name: "TXD Moto", icon: Bike, color: "#FF6B35", priceRange: "R$ 5 - R$ 15", eta: "2 min" },
  { id: "pop", name: "TXD Pop", icon: Car, color: "#3ECB8E", priceRange: "R$ 8 - R$ 25", eta: "3 min" },
  { id: "comfort", name: "TXD Comfort", icon: Sparkles, color: "#8B5CF6", priceRange: "R$ 15 - R$ 40", eta: "5 min" },
  { id: "black", name: "TXD Black", icon: Shield, color: "#1a1a2e", priceRange: "R$ 25 - R$ 60", eta: "7 min" },
  { id: "entrega", name: "TXD Entrega", icon: Package, color: "#F59E0B", priceRange: "R$ 10 - R$ 30", eta: "4 min" },
  { id: "pet", name: "TXD Pet", icon: PawPrint, color: "#EC4899", priceRange: "R$ 12 - R$ 35", eta: "6 min" },
  { id: "mulher", name: "TXD Mulher", icon: VenusAndMars, color: "#D946EF", priceRange: "R$ 15 - R$ 38", eta: "5 min" },
  { id: "carga", name: "TXD Carga", icon: Truck, color: "#06B6D4", priceRange: "R$ 20 - R$ 80", eta: "10 min" },
];

const promos = [
  { id: "1", title: "50% OFF na primeira corrida", subtitle: "Use o cupom TXDNEW", color: "from-[#3ECB8E]/20 to-[#34b37d]/10" },
  { id: "2", title: "TXD Mulher: segurança em dobro", subtitle: "Motoristas verificadas 24h", color: "from-[#D946EF]/20 to-[#EC4899]/10" },
  { id: "3", title: "Ganhe pontos TXD", subtitle: "Acumule e troque por descontos", color: "from-[#8B5CF6]/20 to-[#6D28D9]/10" },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  REQUEST_CREATED: { label: "Buscando", color: "text-yellow-400 bg-yellow-400/15" },
  DRIVER_ACCEPTED: { label: "Aceita", color: "text-primary bg-primary/15" },
  IN_PROGRESS: { label: "Em andamento", color: "text-blue-400 bg-blue-400/15" },
  COMPLETED: { label: "Completa", color: "text-primary bg-primary/15" },
  CANCELLED: { label: "Cancelada", color: "text-red-400 bg-red-400/15" },
  PAYMENT_CONFIRMED: { label: "Paga", color: "text-primary bg-primary/15" },
};

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function VerificationBanner({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(useSearchParams().get("new") === "true");
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      className="relative overflow-hidden mb-4"
    >
      <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Video className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Complete seu cadastro</p>
          <p className="text-xs text-gray-400 mt-0.5">Faça a verificação facial para desbloquear todos os recursos</p>
          <div className="flex gap-2 mt-3">
            <Link
              href="/dashboard/verificacao"
              className="bg-primary text-background text-xs font-bold px-4 py-1.5 rounded-full hover:bg-primary-hover transition-colors"
            >
              Verificar agora
            </Link>
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-white px-3 py-1.5 transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
}

export default function PassengerDashboard() {
  const { user, loading: userLoading } = useUser();
  const { trips, addresses, stats, loading: dataLoading } = usePassengerData(user?.id);
  const [currentPromo, setCurrentPromo] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [depositStatus, setDepositStatus] = useState<{ balance: number; qualified: boolean; required: number } | null>(null);
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 6 ? "Boa madrugada" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  })();

  useEffect(() => {
    async function checkDeposit() {
      try {
        const res = await fetch("/api/freight/qualified?service=carro");
        const data = await res.json();
        setDepositStatus({ balance: data.balance || 0, qualified: data.qualified, required: data.requiredDeposit });
      } catch {}
    }
    checkDeposit();
  }, []);

  const nextPromo = useCallback(() => setCurrentPromo(p => (p + 1) % promos.length), []);

  useEffect(() => {
    const timer = setInterval(nextPromo, 5000);
    return () => clearInterval(timer);
  }, [nextPromo]);

  const quickActions = addresses.length ? addresses.slice(0, 4).map(a => ({
    label: a.type === "home" ? "Casa" : a.type === "work" ? "Trabalho" : "Endereço",
    icon: a.type === "home" ? Home : a.type === "work" ? Briefcase : MapPin,
    address: a.full_address,
  })) : [
    { label: "Casa", icon: Home, address: "Adicione seu endereço" },
    { label: "Trabalho", icon: Briefcase, address: "Adicione seu trabalho" },
    { label: "Aeroporto", icon: Plane, address: "GRU - Guarulhos" },
    { label: "Favoritos", icon: Heart, address: "Locais salvos" },
  ];

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {greeting}, <span className="text-primary">{user?.full_name?.split(" ")[0] || "Viajante"}</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">Para onde vamos hoje?</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative glass-panel p-3 rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          </div>
        </motion.div>

        {/* Verification Banner */}
        <Suspense fallback={null}>
          {showVerificationBanner && <VerificationBanner onClose={() => setShowVerificationBanner(false)} />}
        </Suspense>

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link href="/ride">
            <div className="glass-panel flex items-center gap-3 p-4 transition-colors hover:border-primary/30 cursor-pointer">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <span className="text-gray-500 text-sm flex-1">Para onde você vai?</span>
              <span className="bg-primary text-background text-xs font-bold px-4 py-1.5 rounded-full shrink-0">Ir</span>
            </div>
          </Link>
        </motion.div>

        {/* Deposit Status */}
        {depositStatus && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <Link href="/deposit">
              <div className={`rounded-2xl p-4 flex items-center gap-3 transition-all border ${
                depositStatus.qualified
                  ? "bg-primary/5 border-primary/20"
                  : "bg-yellow-400/5 border-yellow-400/30"
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  depositStatus.qualified ? "bg-primary/10" : "bg-yellow-400/10"
                }`}>
                  <DollarSign className={`w-5 h-5 ${depositStatus.qualified ? "text-primary" : "text-yellow-400"}`} />
                </div>
                <div className="flex-1">
                  {depositStatus.qualified ? (
                    <>
                      <div className="font-semibold text-sm text-white">Cliente qualificado</div>
                      <div className="text-xs text-gray-400">Saldo: R$ {depositStatus.balance.toFixed(2)}</div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold text-sm text-yellow-400">Depósito necessário</div>
                      <div className="text-xs text-gray-400">Deposite R$ {depositStatus.required} para usar o serviço</div>
                    </>
                  )}
                </div>
                <ChevronRight className={`w-4 h-4 ${depositStatus.qualified ? "text-primary" : "text-yellow-400"}`} />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.label} className="glass-panel p-3 sm:p-4 flex flex-col items-center gap-1.5 hover:border-primary/30 transition-colors">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span className="text-[10px] sm:text-xs font-medium">{action.label}</span>
                  <span className="text-[8px] sm:text-[10px] text-gray-500 text-center leading-tight hidden sm:block">{action.address}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Services */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-lg font-semibold mb-3">Escolha seu TXD</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {services.map((service) => {
                  const Icon = service.icon;
                  return (
                    <button key={service.id} className="glass-panel p-3 sm:p-4 flex flex-col items-center gap-2 text-center group cursor-pointer hover:border-primary/30 transition-all">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${service.color}20` }}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: service.color }} />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold">{service.name}</span>
                      <span className="text-[10px] text-gray-500">{service.priceRange}</span>
                      <span className="text-[9px] text-primary font-medium">{service.eta}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Promo */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div key={currentPromo} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}
                  className={`glass-panel p-5 sm:p-6 bg-gradient-to-r ${promos[currentPromo].color} relative overflow-hidden`}>
                  <div className="relative z-10">
                    <h3 className="text-lg sm:text-xl font-bold mb-1">{promos[currentPromo].title}</h3>
                    <p className="text-sm text-gray-400 mb-3">{promos[currentPromo].subtitle}</p>
                    <button className="bg-primary text-background text-xs font-bold px-4 py-2 rounded-full">Aproveitar</button>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-center gap-1.5 mt-3">
                {promos.map((_, i) => (
                  <button key={i} onClick={() => setCurrentPromo(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentPromo ? "bg-primary w-5" : "bg-gray-600"}`} />
                ))}
              </div>
            </motion.div>

            {/* Map Preview */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 sm:p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Motoristas próximos</h3>
                <Link href="/ride" className="text-xs text-primary flex items-center gap-1">
                  Ver mapa <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <Link href="/ride">
                <div className="relative h-40 sm:h-48 rounded-2xl overflow-hidden bg-[#0a0a0a] cursor-pointer">
                  <div className="absolute inset-0 opacity-30"
                    style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #3ECB8E 0%, transparent 50%), radial-gradient(circle at 80% 30%, #3ECB8E 0%, transparent 50%), radial-gradient(circle at 50% 70%, #3ECB8E 0%, transparent 50%)" }} />
                  <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(#2a2a2a 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                  {[{ top: "30%", left: "25%" }, { top: "45%", left: "55%" }, { top: "60%", left: "35%" }, { top: "25%", left: "70%" }, { top: "70%", left: "60%" }].map((pos, i) => (
                    <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.2 }}
                      className="absolute" style={{ top: pos.top, left: pos.left }}>
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                        <Navigation className="w-3 h-3 text-background" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Trips */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Viagens recentes</h2>
                <Link href="/dashboard/passenger/history" className="text-xs text-primary flex items-center gap-1">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {dataLoading ? (
                  <div className="glass-panel p-4 text-center text-gray-500 text-sm">Carregando...</div>
                ) : trips.length === 0 ? (
                  <div className="glass-panel p-4 text-center text-gray-500 text-sm">Nenhuma viagem ainda</div>
                ) : trips.slice(0, 4).map((trip) => {
                  const status = statusLabels[trip.status] || { label: trip.status, color: "text-gray-400 bg-gray-400/15" };
                  return (
                    <div key={trip.id} className="glass-panel p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            <span className="truncate">{trip.origin_address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm mt-1">
                            <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                            <span className="truncate">{trip.dest_address}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(trip.created_at)}</span>
                        <span className="font-semibold text-foreground">R$ {trip.estimated_fare?.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Rating */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 sm:p-6">
              <h3 className="font-semibold mb-3">Sua reputação</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">{stats.rating || "—"}</div>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= Math.round(stats.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stats.rating_count} avaliações</p>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 sm:p-6">
              <h3 className="font-semibold mb-3">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background border border-card-border rounded-xl p-3">
                  <Car className="w-4 h-4 text-primary mb-1" />
                  <p className="text-lg font-bold">{stats.total_trips}</p>
                  <p className="text-[10px] text-gray-500">Viagens</p>
                </div>
                <div className="bg-background border border-card-border rounded-xl p-3">
                  <DollarSign className="w-4 h-4 text-primary mb-1" />
                  <p className="text-lg font-bold">R$ {stats.total_spent.toFixed(0)}</p>
                  <p className="text-[10px] text-gray-500">Total gasto</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
