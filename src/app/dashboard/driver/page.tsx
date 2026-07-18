"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Power, Wallet, TrendingUp, Navigation, Clock, ThumbsUp, Star,
  MapPin, DollarSign, Target, Gift, Bell, X, Check, Route, Car,
  Calendar, User, Zap, Loader2, Camera, Video, Bike, Package,
  Truck, Settings2, SlidersHorizontal, CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";
import { useDriverData } from "@/lib/hooks/use-driver-data";
import { triggerHaptic } from "@/lib/haptics";
import { RadarLoader } from "@/components/ui/radar-loader";
import SosButton from "@/components/safety/SosButton";
import GamificationBar from "@/components/driver/GamificationBar";
import BatterySaverMode from "@/components/map/BatterySaverMode";
import SwipeToAccept from "@/components/ride/SwipeToAccept";
import { PageLayout, PageHeader } from "@/components/ui/page-layout";

function DriverDashboardContent() {
  const { user, loading: userLoading } = useUser();
  const { profile, vehicle, trips, earnings, loading: dataLoading } = useDriverData(user?.id);
  const searchParams = useSearchParams();
  const [isOnline, setIsOnline] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<any>(null);
  const [requestTimer, setRequestTimer] = useState(15);
  const [qualifiedCount, setQualifiedCount] = useState(0);
  const [activePassengers, setActivePassengers] = useState(3);
  const [modalities, setModalities] = useState({
    mototaxi: true, motoboy: false, carro: true, entregas: false, fretes: false, mudanca: false,
  });
  const [showModalityConfig, setShowModalityConfig] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(searchParams.get("new") === "true");
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  })();

  useEffect(() => {
    async function fetchQualified() {
      try {
        const res = await fetch("/api/freight/qualified?service=carro");
        const data = await res.json();
        setQualifiedCount(data.qualifiedCount || 0);
      } catch {}
    }
    fetchQualified();
  }, []);

  useEffect(() => {
    function sendHeartbeat(status: string) {
      if (!user?.id || !navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const activeModalities = Object.entries(modalities)
            .filter(([, v]) => v)
            .map(([k]) => k);
          fetch("/api/location/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              driverId: user.id,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
              accuracy: pos.coords.accuracy,
              status,
              modalities: activeModalities,
            }),
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    }

    if (isOnline) {
      sendHeartbeat("ONLINE");
      heartbeatRef.current = setInterval(() => sendHeartbeat("ONLINE"), 3000);
    } else {
      sendHeartbeat("OFFLINE");
    }

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = undefined;
      }
    };
  }, [isOnline, user?.id, modalities]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <PageLayout>
      <SosButton driverId={user?.id} />
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader
            title={`${greeting}, ${user?.full_name?.split(" ")[0] || "Motorista"}`}
            subtitle={vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.license_plate}` : "Cadastre seu veículo"}
            action={
              <div className="flex items-center gap-3">
                <button className="relative glass-panel p-3 rounded-full">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">2</span>
                </button>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
              </div>
            }
          />
        </motion.div>

        {/* Verification Banner */}
        <AnimatePresence>
          {showVerificationBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="relative overflow-hidden"
            >
              <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 mb-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">Complete sua verificação</p>
                  <p className="text-xs text-gray-400 mt-0.5">Grave um vídeo de apresentação para aumentar a confiança dos clientes</p>
                  <div className="flex gap-2 mt-3">
                    <Link
                      href="/dashboard/driver/kyc"
                      className="bg-primary text-background text-xs font-bold px-4 py-1.5 rounded-full hover:bg-primary-hover transition-colors"
                    >
                      Fazer agora
                    </Link>
                    <button
                      onClick={() => setShowVerificationBanner(false)}
                      className="text-xs text-gray-500 hover:text-white px-3 py-1.5 transition-colors"
                    >
                      Agora não
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowVerificationBanner(false)}
                  className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra de Gamificação */}
        <GamificationBar tripsToday={trips.length} earningsToday={earnings.today} />

        {/* Online Toggle + Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-bold">{isOnline ? "Online" : "Offline"}</p>
              <p className="text-sm text-gray-400">{isOnline ? "Recebendo corridas e buscando passageiros" : "Toque para ativar"}</p>
            </div>
            <button onClick={() => { 
                triggerHaptic("medium");
                setIsOnline(!isOnline); 
              }}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isOnline ? "bg-primary text-background shadow-[0_0_30px_rgba(62,203,142,0.6)]" : "bg-red-500/20 text-red-400"}`}>
              {isOnline && <span className="absolute inset-0 rounded-full animate-ping bg-primary/40 opacity-75"></span>}
              <Power className={`w-7 h-7 relative z-10 ${isOnline ? "" : "opacity-50"}`} />
            </button>
          </div>
          {profile && (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs">
              <div className="bg-background border border-card-border rounded-xl p-1.5 sm:p-2">
                <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mx-auto mb-1" />
                <span className="font-bold text-[10px] sm:text-xs">{profile.acceptance_rate?.toFixed(0) || 100}%</span>
                <span className="text-gray-500 block text-[9px] sm:text-xs">Aceitação</span>
              </div>
              <div className="bg-background border border-card-border rounded-xl p-1.5 sm:p-2">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 mx-auto mb-1" />
                <span className="font-bold text-[10px] sm:text-xs">{profile.rating?.toFixed(1) || 5.0}</span>
                <span className="text-gray-500 block text-[9px] sm:text-xs">Avaliação</span>
              </div>
              <div className="bg-background border border-card-border rounded-xl p-1.5 sm:p-2">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mx-auto mb-1" />
                <span className="font-bold text-[10px] sm:text-xs">{profile.total_trips || 0}</span>
                <span className="text-gray-500 block text-[9px] sm:text-xs">Corridas</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Modalidades Multimodal */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Modalidades</h3>
            </div>
            <button onClick={() => setShowModalityConfig(!showModalityConfig)}
              className="text-xs text-primary flex items-center gap-1 hover:underline">
              <SlidersHorizontal className="w-3 h-3" /> Configurar
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "mototaxi", label: "Mototáxi", icon: Bike },
              { key: "motoboy", label: "Motoboy", icon: Package },
              { key: "carro", label: "Carro", icon: Car },
              { key: "entregas", label: "Entregas", icon: Package },
              { key: "fretes", label: "Fretes", icon: Truck },
              { key: "mudanca", label: "Mudança", icon: Truck },
            ].map(mod => {
              const Icon = mod.icon;
              const isActive = modalities[mod.key as keyof typeof modalities];
              return (
                <button key={mod.key} onClick={() => {
                  if (showModalityConfig) {
                    setModalities(prev => ({ ...prev, [mod.key]: !prev[mod.key as keyof typeof modalities] }));
                  }
                }}
                  className={`p-3 rounded-xl text-center transition-all ${
                    isActive
                      ? "bg-primary/15 border border-primary/30 text-primary"
                      : "bg-background border border-card-border text-gray-500 opacity-60"
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? "text-primary" : ""}`} />
                  <span className="text-[11px] sm:text-xs font-medium">{mod.label}</span>
                </button>
              );
            })}
          </div>
          {showModalityConfig && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t border-card-border">
              <p className="text-xs text-gray-400 mb-2">Toque nas modalidades para ativar/desativar</p>
              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Raio máximo de busca</span>
                  <select className="bg-background border border-card-border rounded-lg px-3 py-1.5 text-xs text-white">
                    <option>5 km</option>
                    <option>10 km</option>
                    <option>15 km</option>
                    <option>20 km</option>
                    <option>Ilimitado</option>
                  </select>
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Valor mínimo por corrida</span>
                  <select className="bg-background border border-card-border rounded-lg px-3 py-1.5 text-xs text-white">
                    <option>R$ 5</option>
                    <option>R$ 10</option>
                    <option>R$ 15</option>
                    <option>R$ 20</option>
                    <option>Sem mínimo</option>
                  </select>
                </label>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Qualified Clients */}
        {isOnline && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4 border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Clientes qualificados</p>
                  <p className="text-xs text-gray-500">Depósito mínimo garantido</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{qualifiedCount}</div>
                <div className="text-xs text-gray-500">na região</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="flex-1 bg-background rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min(100, (qualifiedCount / 10) * 100)}%` }} />
              </div>
              <span>{activePassengers} online agora</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Clientes que fizeram depósito mínimo aparecem como prioritários
            </p>
          </motion.div>
        )}

        {/* Simulated Ride Request */}
        {isOnline && !currentRequest && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-6">
            <div className="mb-6 transform scale-75">
              <RadarLoader />
            </div>
            <button onClick={() => {
              triggerHaptic("success");
              setCurrentRequest({
                id: "sim-" + Date.now(),
                pickup: "Av. Paulista, 1000",
                destination: "Shopping Morumbi",
                estimatedFare: 25.90,
                distance: "5,2 km",
                estimatedTime: "8 min",
                passengerName: "Ana O.",
                passengerRating: 4.9,
              });
              setRequestTimer(15);
              const timer = setInterval(() => {
                setRequestTimer(prev => {
                  if (prev <= 1) { clearInterval(timer); setCurrentRequest(null); return 0; }
                  return prev - 1;
                });
              }, 1000);
            }}
              className="w-full max-w-sm glass-panel p-5 text-center border border-primary/20 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <Navigation className="w-7 h-7 text-primary" />
              </div>
              <p className="font-bold text-lg mb-1">Simular nova corrida</p>
              <p className="text-sm text-gray-400">Toque aqui para forçar um chamado</p>
            </button>
          </motion.div>
        )}

        {/* Current Request - Swipe to Accept */}
        {currentRequest && (
          <SwipeToAccept
            pickup={currentRequest.pickup}
            destination={currentRequest.destination}
            estimatedFare={currentRequest.estimatedFare}
            distance={currentRequest.distance}
            estimatedTime={currentRequest.estimatedTime}
            passengerName={currentRequest.passengerName}
            passengerRating={currentRequest.passengerRating}
            timer={requestTimer}
            onAccept={() => setCurrentRequest(null)}
            onReject={() => setCurrentRequest(null)}
          />
        )}

        {/* Earnings cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          <div className="glass-panel p-4 text-center">
            <p className="text-[10px] text-gray-500 mb-1">Hoje</p>
            <p className="text-lg font-bold text-primary">R$ {earnings.today.toFixed(0)}</p>
          </div>
          <div className="glass-panel p-4 text-center">
            <p className="text-[10px] text-gray-500 mb-1">Semana</p>
            <p className="text-lg font-bold text-primary">R$ {earnings.week.toFixed(0)}</p>
          </div>
          <div className="glass-panel p-4 text-center">
            <p className="text-[10px] text-gray-500 mb-1">Mês</p>
            <p className="text-lg font-bold text-primary">R$ {earnings.month.toFixed(0)}</p>
          </div>
        </motion.div>

        {/* Recent Trips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Corridas recentes</h2>
            <Link href="/dashboard/driver/trips" className="text-xs text-primary flex items-center gap-1">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {dataLoading ? (
              <div className="glass-panel p-4 text-center text-gray-500 text-sm">Carregando...</div>
            ) : trips.length === 0 ? (
              <div className="glass-panel p-4 text-center text-gray-500 text-sm">Nenhuma corrida ainda</div>
            ) : trips.slice(0, 5).map((trip: any) => (
              <div key={trip.id} className="glass-panel p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Car className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[180px]">{trip.origin_address} → {trip.dest_address}</p>
                    <p className="text-xs text-gray-500">{new Date(trip.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <span className="font-bold text-primary">R$ {(trip.final_fare || trip.estimated_fare || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </motion.div>

          {/* Quick links */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/driver/earnings">
            <div className="glass-panel p-4 flex items-center gap-3 hover:border-primary/30 transition-all">
              <Wallet className="w-5 h-5 text-primary" />
              <div><p className="text-sm font-semibold">Ganhos</p><p className="text-xs text-gray-500">Histórico completo</p></div>
            </div>
          </Link>
          <div className="relative">
            <Link href="/dashboard/driver/map">
              <div className="glass-panel p-4 flex items-center gap-3 hover:border-primary/30 transition-all">
                <MapPin className="w-5 h-5 text-primary" />
                <div><p className="text-sm font-semibold">Mapa</p><p className="text-xs text-gray-500">Calor ao vivo</p></div>
              </div>
            </Link>
            <div className="absolute -top-2 -right-2">
              <BatterySaverMode />
            </div>
          </div>
          <Link href="/dashboard/driver/addresses">
            <div className="glass-panel p-4 flex items-center gap-3 hover:border-primary/30 transition-all">
              <Navigation className="w-5 h-5 text-primary" />
              <div><p className="text-sm font-semibold">Endereços</p><p className="text-xs text-gray-500">Locais salvos</p></div>
            </div>
          </Link>
          <Link href="/dashboard/driver/kyc">
            <div className="glass-panel p-4 flex items-center gap-3 hover:border-primary/30 transition-all">
              <User className="w-5 h-5 text-primary" />
              <div><p className="text-sm font-semibold">KYC</p><p className="text-xs text-gray-500">Verificação</p></div>
            </div>
          </Link>
          <div className="glass-panel p-4 flex items-center gap-3">
            <Target className="w-5 h-5 text-primary" />
            <div><p className="text-sm font-semibold">Metas</p><p className="text-xs text-gray-500">Bônus disponíveis</p></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={async () => {
            try {
              const res = await fetch("/api/stripe/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user?.id, email: user?.email, country: "BR" }),
              });
              const data = await res.json();
              if (data.onboardingUrl) window.location.href = data.onboardingUrl;
            } catch {}
          }}
            className="w-full glass-panel p-4 flex items-center gap-3 hover:border-primary/30 transition-all">
            <CreditCard className="w-5 h-5 text-primary" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">Receber pagamentos</p>
              <p className="text-xs text-gray-500">Conecte sua conta Stripe para receber</p>
            </div>
            <DollarSign className="w-4 h-4 text-primary" />
          </button>
        </motion.div>
    </PageLayout>
  );
}

export default function DriverDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
      <DriverDashboardContent />
    </Suspense>
  );
}
