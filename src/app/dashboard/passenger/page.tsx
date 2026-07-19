"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, User, Search, MapPin, Home, Briefcase, Plane, Heart,
  ChevronRight, Star, Clock, ArrowRight, DollarSign, Bike, Car,
  Sparkles, Shield, Package, PawPrint, VenusAndMars, Truck, Navigation, Loader2,
  Camera, X, Video, Wallet, Gift, Users, TrendingUp, Zap, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";
import { usePassengerData } from "@/lib/hooks/use-passenger-data";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { triggerHaptic } from "@/lib/haptics";
import SosButton from "@/components/safety/SosButton";
import { createClient } from "@/lib/supabase/browser";
import { PageLayout } from "@/components/ui/page-layout";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import dynamic from "next/dynamic";
const OpenStreetMap = dynamic(
  () => import("@/components/map/OpenStreetMap").then(m => m.OpenStreetMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#1a1a2e] rounded-2xl flex items-center justify-center text-gray-500 text-sm">Carregando mapa...</div> }
);

interface Service {
  id: string; name: string; icon: typeof Car; color: string; priceRange: string; eta: string; badge?: string; group: string;
}

const services: Service[] = [
  { id: "moto", name: "TXD Moto", icon: Bike, color: "#FF6B35", priceRange: "R$ 7,50", eta: "2 min", badge: "Chega Rápido", group: "passageiro" },
  { id: "pop", name: "TXD Pop", icon: Car, color: "#3ECB8E", priceRange: "R$ 12,50", eta: "3 min", badge: "Mais Pedido", group: "passageiro" },
  { id: "comfort", name: "TXD Comfort", icon: Sparkles, color: "#8B5CF6", priceRange: "R$ 25,00", eta: "5 min", group: "passageiro" },
  { id: "black", name: "TXD Black", icon: Shield, color: "#1a1a2e", priceRange: "R$ 42,00", eta: "7 min", group: "passageiro" },
  { id: "pet", name: "TXD Pet", icon: PawPrint, color: "#EC4899", priceRange: "R$ 18,00", eta: "6 min", group: "passageiro" },
  { id: "mulher", name: "TXD Mulher", icon: VenusAndMars, color: "#D946EF", priceRange: "R$ 20,00", eta: "5 min", badge: "🔒 Verificadas", group: "passageiro" },
  { id: "entrega", name: "TXD Entrega", icon: Package, color: "#F59E0B", priceRange: "R$ 15,00", eta: "4 min", group: "logistica" },
  { id: "carga", name: "TXD Carga", icon: Truck, color: "#06B6D4", priceRange: "R$ 55,00", eta: "10 min", group: "logistica" },
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
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(searchParams.get("new") === "true");

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
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { trips, addresses, stats, loading: dataLoading } = usePassengerData(user?.id);
  const [currentPromo, setCurrentPromo] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [depositStatus, setDepositStatus] = useState<{ balance: number; qualified: boolean; required: number } | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [nearbyDriversCount, setNearbyDriversCount] = useState<number | null>(null);
  const [placeholderText, setPlaceholderText] = useState("Para onde você vai?");
  const [notifOpen, setNotifOpen] = useState(false);
  const { latitude: userLat, longitude: userLng, loading: geoLoading, error: geoError, requestPermission } = useGeolocation({ watch: false });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  
  const placeholders = [
    "Para onde você vai?",
    "Que tal ir ao shopping?",
    "Buscar um TXD Moto?",
    "Precisa enviar uma encomenda?",
    "Indo para o aeroporto?",
  ];

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

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await createClient().from("wallets").select("balance").eq("profile_id", user.id).maybeSingle();
        if (data) setWalletBalance((data as any).balance);
      } catch {}
    })();
  }, [user?.id]);

  useEffect(() => {
    if (userLat && userLng && !mapCenter) {
      setMapCenter({ lat: userLat, lng: userLng });
    }
  }, [userLat, userLng, mapCenter]);

  useEffect(() => {
    async function fetchNearby() {
      try {
        const lat = userLat || "";
        const lng = userLng || "";
        const res = await fetch(`/api/location/nearby?radius=20&limit=20&lat=${lat}&lng=${lng}`);
        const data = await res.json();
        if (data.drivers) {
          setNearbyDrivers(data.drivers);
          setNearbyDriversCount(data.count);
        }
      } catch {}
    }
    fetchNearby();
    let channel: any;
    try {
      const supabase = createClient();
      channel = supabase
        .channel("nearby-drivers")
        .on("postgres_changes",
          { event: "*", schema: "public", table: "driver_heartbeats", filter: "status=neq.OFFLINE" },
          () => fetchNearby()
        )
        .subscribe();
    } catch {}
    const interval = setInterval(fetchNearby, 7000);
    return () => {
      clearInterval(interval);
      if (channel) channel.unsubscribe();
    };
  }, [userLat, userLng]);

  const nextPromo = useCallback(() => setCurrentPromo(p => (p + 1) % promos.length), []);

  useEffect(() => {
    const timer = setInterval(nextPromo, 5000);
    return () => clearInterval(timer);
  }, [nextPromo]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderText(placeholders[Math.floor(Math.random() * placeholders.length)]);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Carregando sua conta...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sessão expirada</h2>
          <p className="text-sm text-gray-400 mb-6">Faça login novamente para acessar seu dashboard.</p>
          <Link href="/auth/login" className="inline-block bg-primary text-background font-bold px-6 py-3 rounded-xl">Entrar</Link>
        </div>
      </div>
    );
  }

  return (
    <PageLayout maxWidth="max-w-7xl">
      <ErrorBoundary>
      <SosButton />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Pedir corrida CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => router.push("/ride")}
          className="w-full mb-5 p-5 rounded-2xl bg-gradient-to-r from-primary to-[#2da874] text-black font-bold flex items-center justify-between group cursor-pointer shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-black/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Car className="w-8 h-8" />
            </div>
            <div className="text-left">
              <div className="text-lg sm:text-xl font-bold">Pedir corrida</div>
              <div className="text-sm opacity-80">Toque para solicitar</div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-black/15 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-5 h-5" />
          </div>
        </motion.button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {greeting}, <span className="text-primary">{user?.full_name?.split(" ")[0] || "Viajante"}</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">Para onde vamos hoje?</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative glass-panel p-3 rounded-full">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 glass-panel rounded-2xl overflow-hidden z-50 shadow-xl border border-card-border">
                    <div className="p-3 border-b border-card-border">
                      <p className="text-sm font-semibold text-white">Notificações</p>
                    </div>
                    {[{ title: "50% OFF na primeira corrida", desc: "Use o cupom TXDNEW", time: "agora" },
                      { title: "Motorista a caminho", desc: "Seu TXD Pop está chegando", time: "5 min" },
                      { title: "Ganhe pontos TXD", desc: "Acumule e troque por descontos", time: "1 h" },
                    ].map((n, i) => (
                      <button key={i} onClick={() => setNotifOpen(false)} className="w-full px-4 py-3 text-left hover:bg-white/5 transition flex items-start gap-3">
                        <Bell className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{n.title}</p>
                          <p className="text-xs text-gray-500">{n.desc}</p>
                        </div>
                        <span className="text-[10px] text-gray-600 shrink-0">{n.time}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
          </div>
        </motion.div>

        {/* Verification Banner */}
        <Suspense fallback={null}>
          {showVerificationBanner && <VerificationBanner onClose={() => setShowVerificationBanner(false)} />}
        </Suspense>

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 relative z-10">
          <Link href="/ride">
            <div 
              onClick={() => triggerHaptic("light")}
              className="glass-panel flex items-center gap-3 p-4 transition-all duration-300 hover:border-primary/50 cursor-pointer shadow-[0_4px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_30px_rgba(62,203,142,0.15)] group">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5 text-primary shrink-0" />
              </div>
              <div className="flex-1 overflow-hidden relative h-6">
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={placeholderText}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-gray-400 font-medium text-sm md:text-base absolute inset-0 flex items-center">
                    {placeholderText}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="bg-primary text-background text-xs font-bold px-5 py-2 rounded-full shrink-0 shadow-lg shadow-primary/20 group-hover:bg-primary-hover animate-pulse">
                Buscar
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Social proof — drivers nearby */}
        {nearbyDriversCount !== null && nearbyDriversCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <div className="flex items-center gap-2 text-xs text-primary/80 bg-primary/5 rounded-full px-4 py-2 border border-primary/10">
              <Users className="w-3.5 h-3.5" />
              <span><strong className="text-primary">{nearbyDriversCount} motoristas</strong> próximos de você agora</span>
              <TrendingUp className="w-3 h-3 ml-auto text-primary/60" />
            </div>
          </motion.div>
        )}

        {/* Deposit Status — Reward framing */}
        {depositStatus && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <Link href="/deposit">
              <div className={`rounded-2xl p-4 flex items-center gap-3 transition-all border ${
                depositStatus.qualified
                  ? "bg-primary/5 border-primary/20"
                  : "bg-gradient-to-r from-yellow-400/10 to-yellow-400/5 border-yellow-400/30"
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  depositStatus.qualified ? "bg-primary/10" : "bg-yellow-400/10"
                }`}>
                  {depositStatus.qualified ? <DollarSign className="w-5 h-5 text-primary" /> : <Gift className="w-5 h-5 text-yellow-400" />}
                </div>
                <div className="flex-1">
                  {depositStatus.qualified ? (
                    <>
                      <div className="font-semibold text-sm text-white">Cliente qualificado</div>
                      <div className="text-xs text-gray-400">Saldo: R$ {depositStatus.balance.toFixed(2)}</div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold text-sm text-yellow-400">Libere suas viagens!</div>
                      <div className="text-xs text-gray-400">Recarregue R$ {depositStatus.required} e ganhe 10% de bônus na 1ª corrida</div>
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
                <button key={action.label} className="glass-panel p-3 sm:p-4 flex flex-col items-center gap-1 hover:border-primary/30 transition-colors">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span className="text-[11px] sm:text-xs font-medium">{action.label}</span>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 text-center leading-tight truncate w-full">{action.address}</span>
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
              {(["passageiro", "logistica"] as const).map(group => {
                const groupServices = services.filter(s => s.group === group);
                return (
                  <div key={group} className="mb-4">
                    {group === "logistica" && (
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">Logística</h3>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {groupServices.map((service) => {
                        const Icon = service.icon;
                        return (
                          <button key={service.id} className="glass-panel p-3 sm:p-4 flex flex-col items-center gap-2 text-center group cursor-pointer hover:border-primary/30 transition-all relative overflow-hidden">
                            {service.badge && (
                              <span className={`absolute -top-1 -right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-xl ${
                                service.badge === "Mais Pedido" ? "bg-primary text-black" : service.badge === "Chega Rápido" ? "bg-[#FF6B35] text-white" : "bg-[#D946EF]/80 text-white"
                              }`}>
                                {service.badge}
                              </span>
                            )}
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-translate-y-1 shadow-lg"
                              style={{ backgroundColor: `${service.color}20`, boxShadow: `0 4px 20px ${service.color}15` }}>
                              <Icon className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: service.color }} />
                            </div>
                            <span className="text-xs sm:text-sm font-bold mt-1">{service.name}</span>
                            <span className="text-[10px] text-gray-500">{service.priceRange}</span>
                            <span className="text-[10px] text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10">{service.eta}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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

            {/* Map Preview — OpenStreetMap real */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 sm:p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  Motoristas próximos
                  {nearbyDriversCount !== null && (
                    <motion.span key={nearbyDriversCount} initial={{ scale: 1.3, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
                      className="ml-2 text-xs text-primary font-mono">({nearbyDriversCount})</motion.span>
                  )}
                </h3>
                <Link href="/ride" className="text-xs text-primary flex items-center gap-1">
                  Ver mapa completo <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <Link href="/ride">
                <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden cursor-pointer">
                  {geoLoading && !mapCenter ? (
                    <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center text-gray-400 text-sm">
                      Obtendo localização...
                    </div>
                  ) : (
                    <OpenStreetMap
                      center={mapCenter || undefined}
                      zoom={13}
                      drivers={nearbyDrivers.map(d => ({
                        id: d.driverId || d.id || Math.random().toString(),
                        lat: d.lat || d.latitude || -23.561,
                        lng: d.lng || d.longitude || -46.656,
                        label: d.name || d.driverId?.slice(0, 8) || "Motorista",
                        modality: d.modality || d.modalities?.[0] || "carro",
                      }))}
                      showUserLocation={!!(userLat && userLng)}
                      userLocation={userLat && userLng ? { lat: userLat, lng: userLng } : null}
                      interactive={false}
                      height="100%"
                    />
                  )}
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
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="glass-panel p-4 animate-pulse">
                        <div className="h-4 bg-white/5 rounded w-3/4 mb-3" />
                        <div className="h-3 bg-white/5 rounded w-1/2 mb-2" />
                        <div className="h-3 bg-white/5 rounded w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : trips.length === 0 ? (
                  <div className="glass-panel p-8 text-center bg-gradient-to-b from-primary/5 to-transparent border border-primary/10">
                    <Zap className="w-12 h-12 text-primary mx-auto mb-3" />
                    <p className="text-sm text-white font-bold">Solicite sua primeira corrida agora com 50% OFF!</p>
                    <p className="text-xs text-gray-500 mt-1">Use o cupom <strong className="text-primary">TXDNEW</strong> na primeira viagem</p>
                    <Link href="/ride" className="inline-block mt-4 bg-primary hover:bg-primary-hover text-background font-bold px-6 py-3 rounded-xl text-sm transition-all hover:scale-105">
                      Pedir TXD agora
                    </Link>
                  </div>
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
                  <p className="text-xs text-gray-500 mt-1">{stats.rating_count} avaliações ({stats.total_trips} viagens)</p>
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
                {walletBalance !== null && (
                  <div className="col-span-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
                    <Wallet className="w-4 h-4 text-primary mb-1" />
                    <p className="text-lg font-bold text-primary">R$ {walletBalance.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">Saldo da carteira</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
      </ErrorBoundary>
    </PageLayout>
  );
}
