"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  ArrowRight, Car, MapPin, Package, Shield, Truck, Search, Star,
  Globe, Smartphone, CheckCircle, Lock, Menu, X, Bike, Building2,
  Clock, CreditCard, Heart, Users, Zap, Briefcase, TrendingUp,
  DollarSign, Navigation, Phone, MessageCircle, QrCode, Rocket,
  ChevronRight, Eye, EyeOff, Loader2, Bell, Wallet, History,
  AlertTriangle, Camera, Download, Map, PawPrint, Crosshair,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signIn, signUp, getDashboardRoute, type Role } from "@/lib/auth/auth-service";
import { CountUp } from "@/components/ui/count-up";
import { AnimatedSection, StaggerSection, StaggerItem } from "@/components/ui/animated-section";
import { RippleButton } from "@/components/ui/ripple-button";
import { LiveIndicator } from "@/components/ui/live-indicator";

const ParticlesBackground = dynamic(() => import("@/components/ui/particles-background").then(m => m.ParticlesBackground), { ssr: false });
const Vehicle3D = dynamic(() => import("@/components/ui/vehicle-3d").then(m => m.Vehicle3D), { ssr: false });

const TxdMap = dynamic(() => import("@/components/txd/txd-map"), { ssr: false });

const easing = [0.16, 1, 0.3, 1] as const;

function SectionHeader({ badge, title, desc }: { badge: string; title: string; desc?: string }) {
  return (
    <div className="text-center mb-10 md:mb-16">
      <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-medium border border-primary/20 mb-3 md:mb-4">{badge}</span>
      <h2 className="text-2xl md:text-5xl font-bold tracking-tight mb-3 md:mb-4">{title}</h2>
      {desc && <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-lg px-4">{desc}</p>}
    </div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: easing }} className={className}>
      {children}
    </motion.div>
  );
}

const NAV_LINKS = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Categorias", href: "#categorias" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "App", href: "#app" },
  { label: "Segurança", href: "#seguranca" },
  { label: "Planos", href: "#planos" },
];

const CATEGORIES = [
  { icon: Car, name: "Carro", price: "R$ 25", color: "#3ECB8E", desc: "Corridas rápidas" },
  { icon: Bike, name: "Moto", price: "R$ 15", color: "#60a5fa", desc: "Entregas e corridas" },
  { icon: Package, name: "Entregas", price: "R$ 10", color: "#f59e0b", desc: "Pequenos pacotes" },
  { icon: Heart, name: "Farmácia", price: "R$ 8", color: "#ef4444", desc: "Remédios e saúde" },
  { icon: Zap, name: "Alimentação", price: "R$ 9", color: "#a78bfa", desc: "Comida e bebidas" },
  { icon: ShoppingCart, name: "Mercado", price: "R$ 12", color: "#34d399", desc: "Compras do dia" },
  { icon: FileText, name: "Documentos", price: "R$ 12", color: "#f472b6", desc: "Envio de docs" },
  { icon: Package, name: "Encomendas", price: "R$ 14", color: "#38bdf8", desc: "Pacotes maiores" },
  { icon: Truck, name: "Frete", price: "Orçamento", color: "#fb923c", desc: "Cargas e volumes" },
  { icon: Briefcase, name: "Mudanças", price: "Orçamento", color: "#e879f9", desc: "Móveis e objetos" },
  { icon: Building2, name: "Materiais", price: "Orçamento", color: "#fbbf24", desc: "Construção" },
  { icon: Car, name: "Van", price: "Orçamento", color: "#6ee7b7", desc: "Grupos e cargas" },
  { icon: Globe, name: "Viagens", price: "Orçamento", color: "#67e8f9", desc: "Entre cidades" },
  { icon: Truck, name: "Cargas", price: "Orçamento", color: "#fdba74", desc: "Pesadas" },
  { icon: Building2, name: "Empresarial", price: "Sob consulta", color: "#a78bfa", desc: "B2B" },
];

function ShoppingCart(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>; }
function FileText(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authProfile, setAuthProfile] = useState<string>("passenger");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [benefitTab, setBenefitTab] = useState("passenger");
  const [appPreviewTab, setAppPreviewTab] = useState("passenger");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city: string } | null>(null);
  const [locating, setLocating] = useState(false);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setLocating(true);
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt`
            );
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Sua região";
            setUserLocation({ lat: latitude, lng: longitude, city });
          } catch {
            setUserLocation({ lat: latitude, lng: longitude, city: "Sua região" });
          }
          setLocating(false);
        },
        () => {},
        { timeout: 3000, enableHighAccuracy: false }
      );
    }
  }, []);

  const openAuth = (mode: "login" | "register", profile?: string) => {
    setAuthMode(mode);
    if (profile) setAuthProfile(profile);
    setAuthOpen(true);
  };

  const heroMk = [
    { id: "user", lat: -23.5505, lng: -46.6333, type: "user" as const, pulse: true },
    { id: "driver", lat: -23.545, lng: -46.635, type: "driver" as const, pulse: true, label: "Carlos M." },
    { id: "dest", lat: -23.558, lng: -46.64, type: "destination" as const, label: "Destino" },
    { id: "bike", lat: -23.548, lng: -46.628, type: "bike" as const },
    { id: "truck", lat: -23.553, lng: -46.642, type: "truck" as const },
  ];

  const benefits: Record<string, { icon: any; title: string; desc: string }[]> = {
    passenger: [
      { icon: Shield, title: "Segurança", desc: "Motoristas verificados e viagens monitoradas em tempo real" },
      { icon: Zap, title: "Rapidez", desc: "Motorista aceita em menos de 3 segundos" },
      { icon: DollarSign, title: "Preço competitivo", desc: "Taxas justas sem surpresas" },
      { icon: Navigation, title: "Rastreamento", desc: "Acompanhe cada curva da sua viagem" },
      { icon: CreditCard, title: "Pagamento digital", desc: "PIX, cartão e carteira digital" },
      { icon: HeadphonesIcon, title: "Suporte 24/7", desc: "Equipe pronta para ajudar" },
    ],
    driver: [
      { icon: TrendingUp, title: "Comissão transparente", desc: "Você sabe exatamente quanto ganha por corrida" },
      { icon: DollarSign, title: "Ganhos diários", desc: "Receba todo dia sem burocracia" },
      { icon: Zap, title: "Pagamentos rápidos", desc: "Saque via PIX 24 horas por dia" },
      { icon: Map, title: "Escolha das corridas", desc: "Aceite ou recuse sem penalidades" },
      { icon: Clock, title: "Histórico completo", desc: "Todos os ganhos e rotas registrados" },
      { icon: Wallet, title: "Carteira digital", desc: "Saldo disponível para saque imediato" },
    ],
    company: [
      { icon: Building2, title: "Painel administrativo", desc: "Gerencie entregas em tempo real" },
      { icon: Users, title: "Gestão de funcionários", desc: "Cadastre equipes e defina limites" },
      { icon: TrendingUp, title: "Relatórios", desc: "Métricas detalhadas de desempenho" },
      { icon: DollarSign, title: "Faturamento", desc: "Controle de custos por departamento" },
      { icon: Briefcase, title: "Contratos recorrentes", desc: "Fretes programados e parcerias" },
      { icon: Shield, title: "Compliance", desc: "Notas fiscais e conformidade LGPD" },
    ],
  };

  function HeadphonesIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>; }

  const liveDrivers = [
    { name: "Carlos M.", status: "Estou disponível no Centro", time: "agora", dist: "800m", emoji: "🚗", color: "#3ECB8E" },
    { name: "Marina S.", status: "Fazendo entregas até 22h", time: "2 min", dist: "1,2 km", emoji: "🛵", color: "#60a5fa" },
    { name: "Pedro R.", status: "Aceito fretes de até 500 kg", time: "5 min", dist: "2,5 km", emoji: "🚚", color: "#f59e0b" },
    { name: "Ana P.", status: "Entrega em Teófilo Otoni às 14h", time: "8 min", dist: "3 km", emoji: "📦", color: "#a78bfa" },
    { name: "João V.", status: "Disponível para viagens entre cidades", time: "12 min", dist: "4,5 km", emoji: "🚗", color: "#34d399" },
  ];

  return (
    <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden bg-[#0a0d12]">
      <ParticlesBackground />
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-[100] bg-[#11151c] backdrop-blur-2xl border border-primary/30 rounded-2xl px-6 py-4 shadow-2xl shadow-primary/10">
            <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-primary" /><span className="text-white font-medium">{toastMsg}</span></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {authOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setAuthOpen(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md txd-glass-strong rounded-3xl p-5 md:p-8 relative max-h-[90vh] overflow-y-auto">
                <button onClick={() => setAuthOpen(false)} className="absolute top-4 right-4 min-tap-target flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition"><X className="w-4 h-4" /></button>
                <div className="text-center mb-5">
                <span className="txd-gradient-text font-bold text-lg">TXDAPP</span>
                <p className="text-gray-400 text-xs md:text-sm mt-1">{authMode === "login" ? "Entre na sua conta" : "Crie sua conta grátis"}</p>
              </div>
              <div className="flex bg-black/40 rounded-xl p-1 mb-5">
                <button onClick={() => setAuthMode("login")} className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${authMode === "login" ? "bg-primary text-black" : "text-gray-400"}`}>Entrar</button>
                <button onClick={() => setAuthMode("register")} className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${authMode === "register" ? "bg-primary text-black" : "text-gray-400"}`}>Criar conta</button>
              </div>
              {authMode === "register" && (
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[ { id: "passenger", label: "Passageiro", icon: Car }, { id: "driver", label: "Motorista", icon: Bike }, { id: "company", label: "Empresa", icon: Building2 } ].map(p => (
                    <button key={p.id} onClick={() => setAuthProfile(p.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl border transition ${authProfile === p.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                      <p.icon className={`w-5 h-5 ${authProfile === p.id ? "text-primary" : "text-gray-400"}`} />
                      <span className={`text-xs font-medium ${authProfile === p.id ? "text-primary" : "text-gray-400"}`}>{p.label}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="space-y-3">
                {authMode === "register" && (
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Car className="w-4 h-4" /></div>
                    <input type="text" placeholder="Seu nome completo"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition touch-manipulation" />
                  </div>
                )}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></div>
                  <input type="email" placeholder="seu@email.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition" />
                </div>
                {authMode === "register" && (
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                    <input type="tel" placeholder="(33) 99999-9999"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition" />
                  </div>
                )}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Lock className="w-4 h-4" /></div>
                  <input type={showPassword ? "text" : "password"} placeholder="Sua senha" value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 min-tap-target flex items-center justify-center text-gray-500 hover:text-gray-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authMode === "login" && <button className="text-sm text-primary hover:underline min-tap-target flex items-center">Esqueci minha senha</button>}
              </div>
              <button onClick={async () => {
                setAuthLoading(true);
                if (authMode === "login") {
                  const res = await signIn(authEmail, authPassword);
                  setAuthLoading(false);
                  if (res.error) { showToast(res.error); return; }
                  setAuthOpen(false);
                  router.push(getDashboardRoute((res.role as Role) || "passenger"));
                } else {
                  const res = await signUp(authEmail, authPassword, authProfile as Role);
                  setAuthLoading(false);
                  if (res.error) { showToast(res.error); return; }
                  setAuthOpen(false);
                  router.push(getDashboardRoute(authProfile as Role) + "?new=true");
                }
              }}
                className="w-full mt-5 bg-primary hover:bg-primary-hover text-black font-bold py-4 rounded-xl transition-all hover:scale-[0.98] txd-green-glow-sm flex items-center justify-center gap-2">
                {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {authLoading ? "Carregando..." : authMode === "login" ? "Entrar" : "Criar conta gratuita"}
              </button>
              {authProfile === "driver" && authMode === "register" && (
                <p className="text-xs text-gray-500 text-center mt-4">Após o cadastro, envie CNH, documento do veículo e selfie para aprovação.</p>
              )}
              <p className="text-xs text-gray-600 text-center mt-4">Ao continuar, você aceita nossos Termos de Uso e Política de Privacidade.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-transparent transition-all duration-300" id="navbar">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3ECB8E] to-[#2da874] flex items-center justify-center shadow-lg shadow-primary/20"><Car className="w-5 h-5 text-black" /></div>
            <span className="font-bold text-xl"><span className="text-white">TX</span><span className="txd-gradient-text">DAPP</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => <a key={l.label} href={l.href} className="text-sm text-gray-400 hover:text-white transition font-medium">{l.label}</a>)}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => openAuth("login")} className="text-sm font-medium text-gray-300 hover:text-white transition px-4 py-2">Entrar</button>
            <button onClick={() => openAuth("register")} className="bg-primary hover:bg-primary-hover text-black text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:scale-95 txd-green-glow-sm">Criar conta</button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden txd-glass-strong mx-4 rounded-2xl overflow-hidden">
              <div className="p-4 space-y-2">
                {NAV_LINKS.map(l => <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition text-sm">{l.label}</a>)}
                <hr className="border-white/5 my-2" />
                <button onClick={() => { setMenuOpen(false); openAuth("login"); }} className="w-full py-3 text-center text-sm text-gray-300 hover:text-white">Entrar</button>
                <button onClick={() => { setMenuOpen(false); openAuth("register"); }} className="w-full py-3 text-center text-sm font-bold bg-primary text-black rounded-xl hover:bg-primary-hover transition">Criar conta</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-28 pb-16 px-6 txd-radial-glow">
        <div className="absolute inset-0 txd-grid-bg opacity-40" />
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easing }}>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-txd-pulse-glow" />
                <span className="text-primary text-sm font-medium">
                  {locating ? "Detectando sua localização..." :
                   userLocation ? `Beta aberto em ${userLocation.city}` :
                   "Plataforma em expansão · Beta aberto na sua região"}
                </span>
                {!userLocation && !locating && (
                  <button onClick={() => {
                    if ("geolocation" in navigator) {
                      setLocating(true);
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        const { latitude, longitude } = pos.coords;
                        try {
                          const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt`
                          );
                          const data = await res.json();
                          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Sua região";
                          setUserLocation({ lat: latitude, lng: longitude, city });
                        } catch { setUserLocation({ lat: latitude, lng: longitude, city: "Sua região" }); }
                        setLocating(false);
                      }, () => setLocating(false), { timeout: 3000, enableHighAccuracy: false });
                    }
                  }} className="text-xs text-gray-500 hover:text-white transition ml-1 flex items-center gap-1">
                    <Crosshair className="w-3 h-3" /> Detectar
                  </button>
                )}
              </div>
              <h1 className="text-[1.5rem] sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.15] mb-5">
                Mobilidade inteligente para{" "}
                <span className="txd-gradient-text txd-text-glow">todos</span>.
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-gray-400 mb-7 max-w-lg leading-relaxed">Solicite corridas, entregas e fretes em uma única plataforma. Rápido, seguro e sem burocracia.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: easing }}
              className="flex flex-wrap gap-3 mb-7">
              <button onClick={() => openAuth("register", "passenger")}
                className="bg-primary hover:bg-primary-hover text-black font-bold px-6 py-4 rounded-full transition-all hover:scale-95 txd-green-glow-sm flex items-center gap-2 text-sm md:text-base">
                <Car className="w-5 h-5" /> Solicitar corrida
              </button>
              <button onClick={() => openAuth("register", "driver")}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-6 py-4 rounded-full transition-all hover:scale-95 flex items-center gap-2 text-sm md:text-base">
                <Bike className="w-5 h-5" /> Seja motorista
              </button>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm">
              {[ { icon: Shield, text: "Motoristas verificados" }, { icon: Navigation, text: "Rastreamento" }, { icon: CreditCard, text: "Pagamento flexível" } ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 md:gap-2 text-gray-400"><item.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />{item.text}</div>
              ))}
              {userLocation && (
                <div className="flex items-center gap-1.5 text-gray-400"><Crosshair className="w-3.5 h-3.5 text-primary" />{userLocation.city}</div>
              )}
            </motion.div>
          </div>
          <div className="relative flex items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2, ease: easing }}
              className="relative">
              <div className="absolute -inset-10 bg-gradient-radial from-primary/30 via-primary/10 to-transparent blur-3xl opacity-40 animate-txd-float" />
              <div className="relative">
                <Vehicle3D />
              </div>
              <motion.div
                className="absolute -top-8 -right-8 w-28 h-28 rounded-full border border-primary/20 bg-black/40 backdrop-blur-xl flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="text-center">
                  <div className="txd-gradient-text text-xl font-bold">4.9★</div>
                  <div className="text-[8px] text-gray-500">Avaliação</div>
                </div>
              </motion.div>
              <motion.div
                className="absolute -bottom-6 -left-8 w-24 h-24 rounded-2xl border border-primary/20 bg-black/40 backdrop-blur-xl flex items-center justify-center"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="text-center">
                  <div className="text-primary font-bold text-lg">3s</div>
                  <div className="text-[8px] text-gray-500">aceite</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-12 md:mt-16 w-full relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
            {[ { icon: Car, label: "Passageiro", href: "#" }, { icon: Package, label: "Entregas", href: "#" }, { icon: Truck, label: "Fretes", href: "/freight/post" }, { icon: Building2, label: "Empresas", href: "#" } ].map((a, i) => (
              <button key={i} onClick={() => a.href && a.href !== "#" ? router.push(a.href) : openAuth("register", a.label.toLowerCase())}
                className="txd-card flex items-center gap-2 md:gap-3 p-3 md:p-4 hover:border-primary/30 group">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition"><a.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" /></div>
                <span className="text-xs md:text-sm font-medium text-gray-300">{a.label}</span>
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-600 ml-auto" />
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {[ { num: 2500, suffix: "+", label: "Motoristas" }, { num: 180000, suffix: "+", label: "Corridas" }, { num: 49, suffix: "", label: "Avaliação", decimals: 1, prefix: "" }, { num: 3, suffix: "s", label: "Aceite" } ].map((s, i) => (
              <div key={i} className="text-center p-3 md:p-4 txd-card border-white/5">
                <div className="txd-gradient-text text-xl md:text-3xl font-bold">
                  {s.label === "Avaliação" ? (
                    <><CountUp end={s.num} decimals={1} duration={2.5} />★</>
                  ) : (
                    <><CountUp end={s.num} duration={2.5} />{s.suffix}</>
                  )}
                </div>
                <div className="text-gray-500 text-xs md:text-sm mt-0.5 md:mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-16 md:py-24 px-4 md:px-6 relative">
        <AnimatedSection><SectionHeader badge="Como funciona" title="Tudo em 5 passos simples" desc="Do pedido à avaliação, tudo pensado para ser rápido e intuitivo." /></AnimatedSection>
        <div className="max-w-5xl mx-auto relative">
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <StaggerSection className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-6">
            {[ { step: "01", title: "Solicitar", desc: "Origem, destino, categoria. Veja o preço na hora.", color: "#3ECB8E" },
               { step: "02", title: "Motorista aceita", desc: "Em média 3 segundos para encontrar um motorista.", color: "#60a5fa" },
               { step: "03", title: "Acompanhar", desc: "Mapa ao vivo com ETA e compartilhamento.", color: "#f59e0b" },
               { step: "04", title: "Pagamento", desc: "PIX, cartão ou dinheiro. Comissão automática.", color: "#a78bfa" },
               { step: "05", title: "Avaliação", desc: "Critérios específicos para cada tipo de serviço.", color: "#f472b6" } ].map((s, i) => (
              <StaggerItem key={i}>
                <div className="txd-card p-4 md:p-6 text-center relative z-10 txd-card-hover transition-all">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-base md:text-lg font-bold mx-auto mb-3 md:mb-4" style={{ background: `${s.color}20`, color: s.color }}>{s.step}</div>
                  <h3 className="font-semibold text-sm md:text-lg mb-1 md:mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-xs md:text-sm">{s.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerSection>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section id="categorias" className="py-16 md:py-24 px-4 md:px-6 relative txd-radial-glow">
        <div className="absolute inset-0 txd-grid-bg opacity-20" />
        <AnimatedSection><SectionHeader badge="Categorias" title="15 categorias de serviço" desc="Do transporte de passageiros ao frete pesado, tudo num só lugar." /></AnimatedSection>
        <StaggerSection className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4" staggerDelay={0.03}>
          {CATEGORIES.map((cat, i) => (
            <StaggerItem key={i}>
              <div className="txd-card p-3 md:p-5 group cursor-pointer txd-card-hover transition-all">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2 md:mb-3 transition-transform group-hover:scale-110" style={{ background: `${cat.color}15` }}>
                  <cat.icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: cat.color }} />
                </div>
                <div className="font-semibold text-xs md:text-sm">{cat.name}</div>
                <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">{cat.desc}</div>
                <div className="text-primary text-[10px] md:text-xs font-bold mt-1 md:mt-2">{cat.price}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerSection>
        <p className="text-center text-gray-500 text-sm mt-8">+21 categorias · 19 moedas · 15 idiomas</p>
      </section>

      {/* BENEFICIOS */}
      <section id="beneficios" className="py-16 md:py-24 px-4 md:px-6">
        <AnimatedSection><SectionHeader badge="Benefícios" title="Vantagens para cada perfil" desc="Seja passageiro, motorista ou empresa — o TXDAPP foi feito para você." /></AnimatedSection>
        <div className="max-w-4xl mx-auto">
          <LayoutGroup>
            <div className="flex bg-white/5 rounded-2xl p-1.5 mb-10 max-w-md mx-auto">
              {[ { id: "passenger", label: "Passageiro" }, { id: "driver", label: "Motorista" }, { id: "company", label: "Empresa" } ].map(tab => (
                <button key={tab.id} onClick={() => setBenefitTab(tab.id)} className="relative flex-1 py-2.5 rounded-xl text-sm font-medium transition">
                  {benefitTab === tab.id && <motion.div layoutId="benefit-pill" className="absolute inset-0 bg-primary rounded-xl" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <span className={`relative z-10 ${benefitTab === tab.id ? "text-black" : "text-gray-400"}`}>{tab.label}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          <AnimatePresence mode="wait">
            <motion.div key={benefitTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {benefits[benefitTab].map((b, i) => (
                <div key={i} className="txd-card p-4 md:p-5 txd-card-hover transition-all">
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3 md:mb-4"><b.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" /></div>
                  <h3 className="font-semibold mb-1 text-sm">{b.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* APP PREVIEW */}
      <section id="app" className="py-16 md:py-24 px-4 md:px-6 relative txd-radial-glow">
        <div className="absolute inset-0 txd-grid-bg opacity-20" />
        <FadeIn><SectionHeader badge="App Preview" title="Conheça a plataforma" desc="Quatro dashboards completos dentro de um só aplicativo." /></FadeIn>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-4">
            {[ { id: "passenger", label: "Passageiro", icon: Car, desc: "Solicite corridas com poucos toques" },
               { id: "driver", label: "Motorista", icon: Bike, desc: "Gerencie seus ganhos e corridas" },
               { id: "company", label: "Empresa", icon: Building2, desc: "Painel de entregas empresariais" },
               { id: "delivery", label: "Entregas", icon: Package, desc: "Acompanhe entregas em tempo real" } ].map(tab => (
              <button key={tab.id} onClick={() => setAppPreviewTab(tab.id)}
                className={`w-full txd-card p-4 text-left flex items-center gap-4 transition ${appPreviewTab === tab.id ? "border-primary/40" : ""}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${appPreviewTab === tab.id ? "bg-primary text-black" : "bg-white/5 text-gray-400"}`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                <div className="flex-1"><div className="font-semibold text-sm">{tab.label}</div><div className="text-xs text-gray-500">{tab.desc}</div></div>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2 flex justify-center">
            <motion.div key={appPreviewTab} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
              className="relative w-[300px]">
              <div className="absolute -inset-4 bg-gradient-radial from-primary/30 to-transparent blur-2xl opacity-30" />
              <div className="relative txd-glass-strong rounded-[2.5rem] p-[2.5px] shadow-2xl">
                <div className="relative w-full aspect-[9/19] rounded-[2.3rem] overflow-hidden bg-gradient-to-b from-[#0a0d12] to-[#0e1218]">
                  <div className="absolute inset-0 txd-grid-bg opacity-20" />
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-20 flex items-center justify-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-800" />
                    <div className="w-16 h-1.5 rounded-full bg-gray-900" />
                  </div>
                  {/* Status Bar */}
                  <div className="absolute top-6 left-0 right-0 z-10 flex justify-between px-5 text-[10px] text-gray-400">
                    <span>9:41</span>
                    <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-primary" /> 5G</div>
                  </div>
                  {appPreviewTab === "passenger" && <PassengerDashboard />}
                  {appPreviewTab === "driver" && <DriverDashboard />}
                  {appPreviewTab === "company" && <CompanyDashboard />}
                  {appPreviewTab === "delivery" && <DeliveryDashboard />}
                  {/* Bottom Tab Bar */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-xl border-t border-white/5 px-4 py-2">
                    <div className="flex justify-around">
                      {[ { icon: Map, active: true }, { icon: Car, active: false }, { icon: Clock, active: false }, { icon: Wallet, active: false } ].map((tab, i) => (
                        <div key={i} className={`flex flex-col items-center gap-0.5 ${tab.active ? "text-primary" : "text-gray-600"}`}>
                          <tab.icon className="w-4 h-4" />
                          <span className="text-[8px]">{["Início","Corridas","Histórico","Carteira"][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEGURANÇA */}
      <section id="seguranca" className="py-16 md:py-24 px-4 md:px-6">
        <FadeIn><SectionHeader badge="Segurança" title="Trust & Safety Engine" desc="Sua segurança é nossa prioridade número um." /></FadeIn>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[ { icon: Shield, title: "Verificação de documentos", desc: "KYC completo com reconhecimento facial" },
             { icon: CheckCircle, title: "Motoristas aprovados", desc: "Fluxo de aprovação rigoroso" },
             { icon: Navigation, title: "Compartilhamento de viagem", desc: "Familiares acompanham sua rota" },
             { icon: AlertTriangle, title: "Botão de emergência", desc: "SOS com localização em tempo real" },
             { icon: Star, title: "Avaliações mútuas", desc: "Passageiros e motoristas se avaliam" },
             { icon: Lock, title: "RLS em todas as tabelas", desc: "Cada usuário vê apenas seus dados" },
             { icon: Camera, title: "Monitoramento de fraude", desc: "Detecção de GPS spoofing" },
             { icon: Bell, title: "Alertas em tempo real", desc: "Notificações de segurança instantâneas" },
             { icon: Clock, title: "Backups automáticos", desc: "Dados protegidos e replicados" },
             { icon: Lock, title: "JWT com expiração curta", desc: "Tokens de 15 minutos de validade" },
             { icon: Shield, title: "2FA para administradores", desc: "Autenticação de dois fatores" } ].map((s, i) => (
            <FadeIn key={i} delay={i * 0.03} className="txd-card p-4 md:p-5 flex items-start gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><s.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" /></div>
              <div><h3 className="font-semibold text-xs md:text-sm mb-0.5 md:mb-1">{s.title}</h3><p className="text-gray-400 text-[10px] md:text-xs">{s.desc}</p></div>
            </FadeIn>
          ))}
        </div>
        <div className="max-w-4xl mx-auto mt-8 txd-card p-6 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            {["LGPD", "GDPR", "CCPA", "ISO 27001 ready", "PCI-DSS"].map(b => (
              <span key={b} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* TXD LIVE */}
      <section className="py-16 md:py-24 px-4 md:px-6 relative txd-radial-glow">
        <div className="absolute inset-0 txd-grid-bg opacity-20" />
        <AnimatedSection><SectionHeader badge="TXD Live" title="Motoristas ao vivo" desc="Veja quem está disponível agora na sua região." /></AnimatedSection>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatedSection delay={0.1} className="relative h-[400px] txd-card overflow-hidden rounded-2xl">
            <TxdMap center={[-23.5505, -46.6333]} zoom={13}
              markers={[
                { id: "u", lat: -23.5505, lng: -46.6333, type: "user", pulse: true },
                { id: "c", lat: -23.545, lng: -46.635, type: "driver", pulse: true },
                { id: "m", lat: -23.548, lng: -46.628, type: "bike", pulse: true },
                { id: "p", lat: -23.553, lng: -46.642, type: "truck", pulse: true },
                { id: "a", lat: -23.542, lng: -46.638, type: "driver", pulse: true },
              ]}
              interactive={false} />
            <div className="absolute top-3 left-3 txd-glass-strong rounded-xl px-3 py-1.5">
              <LiveIndicator label="Motoristas online" interval={5000} />
            </div>
            <div className="absolute top-3 right-3 bg-black/40 rounded-xl px-3 py-1.5"><span className="text-xs text-gray-400">Raio: 5 km</span></div>
            <div className="absolute bottom-3 left-3 bg-black/40 rounded-xl px-3 py-1.5">
              <span className="text-xs text-gray-400"><LiveIndicator label="Corridas em andamento" interval={8000} /></span>
            </div>
          </AnimatedSection>
          <div className="space-y-3">
            {liveDrivers.map((d, i) => (
              <AnimatedSection key={i} delay={i * 0.05 + 0.1}>
                <div className="txd-card p-4 flex items-center gap-4 txd-card-hover transition-all">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: `${d.color}20` }}>{d.emoji}</div>
                  <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{d.name}</div><div className="text-xs text-gray-400 truncate">{d.status}</div></div>
                  <div className="text-right shrink-0"><div className="text-xs text-gray-300">{d.time}</div><div className="text-xs text-gray-500">{d.dist}</div></div>
                </div>
              </AnimatedSection>
            ))}
            <p className="text-center text-xs text-gray-500 mt-4">AO VIVO — status atualizados em tempo real</p>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-16 md:py-24 px-4 md:px-6">
        <FadeIn><SectionHeader badge="Preços" title="Planos para todos" desc="Do passageiro à grande empresa, temos o plano certo." /></FadeIn>
        <div className="max-w-5xl mx-auto mb-6 md:mb-8 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {[ { label: "Carro", price: "R$ 25" }, { label: "Moto", price: "R$ 15" }, { label: "Entrega", price: "R$ 10" }, { label: "Frete", price: "R$ 45" } ].map((p, i) => (
            <div key={i} className="txd-card p-3 md:p-4 text-center"><div className="text-[10px] md:text-xs text-gray-500">{p.label}</div><div className="txd-gradient-text font-bold text-sm md:text-lg">{p.price}</div><div className="text-[10px] md:text-xs text-gray-500">preço médio</div></div>
          ))}
        </div>
        <StaggerSection className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[ { name: "Passageiro", price: "Grátis", emoji: "🚗", features: ["Corridas ilimitadas", "Rastreamento ao vivo", "Pagamento digital", "Avaliação de motoristas", "Histórico completo", "Suporte 24/7"], popular: false },
             { name: "Motorista", price: "R$ 25 crédito", emoji: "🛵", features: ["Ganhos diários", "Saque PIX 24h", "KYC gratuito", "Carteira digital", "Negociação de valor", "Histórico de ganhos", "Suporte prioritário"], popular: true },
             { name: "Empresa", price: "Sob consulta", emoji: "🏢", features: ["Painel administrativo", "Funcionários ilimitados", "Centros de custo", "Relatórios", "NF automática", "Contratos recorrentes", "Suporte dedicado"], popular: false } ].map((plan, i) => (
            <StaggerItem key={i}>
              <div className={`txd-card p-6 md:p-8 text-center relative ${plan.popular ? "border-primary/40 txd-card-hover" : "txd-card-hover"} transition-all`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-xs font-bold px-4 py-1 rounded-full">Mais procurado</div>}
                <div className="text-3xl md:text-4xl mb-3 md:mb-4">{plan.emoji}</div>
                <div className="text-base md:text-lg font-bold">{plan.name}</div>
                <div className="txd-gradient-text text-xl md:text-2xl font-bold my-2 md:my-3">{plan.price}</div>
                <ul className="space-y-2 mb-5 md:mb-6 text-left">
                  {plan.features.map((f, j) => <li key={j} className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle className="w-4 h-4 text-primary shrink-0" />{f}</li>)}
                </ul>
                <RippleButton onClick={() => openAuth("register", plan.name.toLowerCase())}
                  className={`w-full py-3 rounded-xl font-bold text-sm ${plan.popular ? "bg-primary hover:bg-primary-hover text-black txd-green-glow-sm" : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"}`}>
                  {plan.name === "Empresa" ? "Falar conosco" : "Começar agora"}
                </RippleButton>
              </div>
            </StaggerItem>
          ))}
        </StaggerSection>
        <div className="max-w-md mx-auto mt-8 txd-card p-5 text-center">
          <Building2 className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-gray-300">Tudo configurável por cidade — preços, comissões e regras no banco de dados.</p>
        </div>
      </section>

      {/* DOWNLOAD */}
      <section className="py-16 md:py-24 px-4 md:px-6 relative txd-radial-glow">
        <div className="absolute inset-0 txd-grid-bg opacity-20" />
        <AnimatedSection>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">Download</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Baixe o TXDAPP</h2>
              <p className="text-gray-400 mb-6">Instale na tela inicial. Funciona como app nativo. 100% grátis. Menos de 1MB.</p>
              <div className="flex flex-wrap gap-3 mb-6">
                <button className="bg-black hover:bg-gray-900 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 transition hover:border-primary/30">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium"><span className="text-xs text-gray-500 block">Google Play</span>Instalar PWA</span>
                </button>
                <button className="bg-black hover:bg-gray-900 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 transition hover:border-primary/30">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium"><span className="text-xs text-gray-500 block">App Store</span>Em breve</span>
                </button>
                <button className="bg-black hover:bg-gray-900 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 transition hover:border-primary/30">
                  <Globe className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium"><span className="text-xs text-gray-500 block">Web App</span>Instalar PWA</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="txd-card p-4">
                  <p className="text-xs font-semibold mb-2 text-center">📱 Android (Chrome)</p>
                  <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Abra no <strong className="text-white">Chrome</strong></li>
                    <li>Toque em "Instalar" no banner</li>
                    <li>Pronto! Ícone na tela inicial</li>
                  </ol>
                </div>
                <div className="txd-card p-4">
                  <p className="text-xs font-semibold mb-2 text-center">🍎 iPhone (Safari)</p>
                  <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Abra no <strong className="text-white">Safari</strong></li>
                    <li>Toque em <strong className="text-white">Compartilhar</strong> (📤)</li>
                    <li><strong className="text-white">Adicionar à Tela de Início</strong></li>
                  </ol>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 txd-glass-strong rounded-2xl flex items-center justify-center border border-primary/20">
                  <QrCode className="w-10 h-10 text-primary" />
                </div>
                <div className="text-xs text-gray-500">
                  <p className="font-semibold text-gray-300 mb-1">Escaneie o QR Code</p>
                  <p>Para instalar direto no celular</p>
                </div>
              </div>
            </div>
            <div className="txd-card p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-4xl animate-txd-float">🚀</div>
              <h3 className="font-bold text-lg mb-4">App nativo sem instalação?</h3>
              <p className="text-sm text-gray-400 mb-4">O TXDAPP é um <strong className="text-white">PWA (Progressive Web App)</strong>:</p>
              <ul className="space-y-3 mb-6">
                {[ "Parece um app premium", "Carrega em &lt;1s (cold start)", "Funciona offline", "Mapa abre instantaneamente", "Notificações push nativas", "Solicitar corrida em &lt;30s", "60fps nas animações", "Ocupa &lt;1MB no celular" ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm"><CheckCircle className="w-4 h-4 text-primary shrink-0" />{item}</li>
                ))}
              </ul>
              <div className="flex gap-6 text-sm">
                <div><div className="txd-gradient-text font-bold">&lt;1s</div><div className="text-gray-500 text-xs">cold start</div></div>
                <div><div className="txd-gradient-text font-bold">60fps</div><div className="text-gray-500 text-xs">animações</div></div>
                <div><div className="txd-gradient-text font-bold">&lt;1MB</div><div className="text-gray-500 text-xs">tamanho</div></div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <AnimatedSection>
          <div className="max-w-4xl mx-auto txd-card p-8 md:p-16 text-center relative overflow-hidden border-primary/20"
            style={{ background: "linear-gradient(135deg, rgba(62,203,142,0.08), transparent)" }}>
            <div className="absolute inset-0 txd-grid-bg opacity-20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">Beta aberto na sua região</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Pronto para se mover com inteligência?</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">Milhares de pessoas já estão usando. Junte-se você também.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <RippleButton onClick={() => openAuth("register")} className="bg-primary hover:bg-primary-hover text-black font-bold px-8 py-3.5 rounded-full txd-green-glow-sm">Criar conta grátis</RippleButton>
                <RippleButton onClick={() => openAuth("login")} variant="outline" className="font-medium px-8 py-3.5 rounded-full">Já tenho conta</RippleButton>
              </div>
              <p className="text-xs text-gray-500 mt-4">Sem cartão de crédito · Cadastro em 30 segundos · Suporte humano 24/7</p>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4" onClick={() => {
                const t = localStorage.getItem("adminClicks") || "0";
                const n = parseInt(t) + 1;
                localStorage.setItem("adminClicks", n.toString());
                if (n >= 3) { localStorage.setItem("adminClicks", "0"); window.location.href = "/admin-secret"; }
                setTimeout(() => localStorage.setItem("adminClicks", "0"), 2000);
              }}><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3ECB8E] to-[#2da874] flex items-center justify-center"><Car className="w-4 h-4 text-black" /></div><span className="font-bold text-lg"><span className="text-white">TX</span><span className="txd-gradient-text">DAPP</span></span></div>
              <p className="text-gray-500 text-sm mb-4 max-w-xs">O Sistema Operacional Global de Mobilidade e Logística.</p>
              <div className="flex gap-2 mb-4">{["🇧🇷","🇺🇸","🇵🇹","🇲🇽"].map((f, i) => <span key={i} className="text-lg">{f}</span>)}</div>
              <div className="text-xs text-gray-600">4 países · 7 cidades · 19 moedas · 15 idiomas</div>
            </div>
            {[ { title: "Produto", links: ["Passageiros","Motoristas","Empresas","Entregas","Fretes"] },
               { title: "Empresa", links: ["Sobre","Blog","Carreiras","Parceiros","Contato"] },
               { title: "Recursos", links: ["Central de ajuda","Segurança","Desenvolvedores","API","Status"] },
               { title: "Legal", links: ["Privacidade","Termos","LGPD","Cookies","Compliance"] } ].map((col, i) => (
              <div key={i}><h4 className="font-bold text-sm text-white mb-4">{col.title}</h4><ul className="space-y-2">{col.links.map((l, j) => <li key={j} className="text-sm text-gray-500 hover:text-gray-300 cursor-pointer transition">{l}</li>)}</ul></div>
            ))}
          </div>
          <hr className="border-white/5 mb-6" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
            <span>© 2025 TXDAPP. Todos os direitos reservados.</span>
            <span>Sistemas operacionais · v0.1.0-beta</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* Dashboard components */
function PassengerDashboard() {
  return <div className="absolute inset-0 pt-12 pb-14 px-3 flex flex-col gap-2 z-10">
    <div className="txd-glass-strong rounded-xl p-2.5 flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1 flex-1"><div className="w-2 h-2 rounded-full bg-primary" /><input placeholder="Origem" className="bg-transparent outline-none text-white text-xs flex-1" /></div>
    </div>
    <div className="txd-glass-strong rounded-xl p-2.5 flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1 flex-1"><MapPin className="w-3 h-3 text-red-400" /><input placeholder="Destino" className="bg-transparent outline-none text-white text-xs flex-1" /></div>
    </div>
    <div className="flex-1 relative rounded-xl overflow-hidden">
      <TxdMap center={[-23.5505, -46.6333]} zoom={14}
        markers={[{ id:"p", lat:-23.5505, lng:-46.6333, type:"pickup" }, { id:"d", lat:-23.558, lng:-46.64, type:"destination" }]}
        route={{ from:{lat:-23.5505,lng:-46.6333}, to:{lat:-23.558,lng:-46.64} }} showRoute interactive={false} />
      <div className="absolute top-2 left-2 txd-glass-strong rounded-xl px-2 py-1"><span className="text-[10px]">8 min · 5,2 km</span></div>
    </div>
    <div className="flex gap-1.5">
      {[ { label:"Carro", price:"R$25", active:true }, { label:"Moto", price:"R$15", active:false }, { label:"Frete", price:"R$45", active:false } ].map((c, i) => (
        <button key={i} className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition ${c.active ? "bg-primary text-black" : "bg-white/5 text-gray-400"}`}>{c.label}<br />{c.price}</button>
      ))}
    </div>
    <button className="bg-primary hover:bg-primary-hover text-black text-xs font-bold py-2.5 rounded-xl transition txd-green-glow-sm">Confirmar corrida · R$ 25,00</button>
  </div>;
}

function DriverDashboard() {
  return <div className="absolute inset-0 pt-12 pb-14 px-3 flex flex-col gap-1.5 z-10 text-[10px]">
    <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-txd-pulse-glow" /><span className="font-semibold text-xs">Online</span></div><button className="text-red-400 border border-red-400/30 rounded-lg px-2 py-0.5 text-[10px]">Sair</button></div>
    <div className="bg-gradient-to-r from-primary to-[#2da874] rounded-xl p-3 text-black">
      <div className="font-bold text-sm">R$ 324,50</div>
      <div className="text-[10px] font-medium">hoje · 12 corridas · +18% vs ontem</div>
    </div>
    <div className="txd-card p-2.5 border-primary/20 flex-1">
      <div className="flex items-center gap-2 mb-1"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-[#2da874] flex items-center justify-center text-[10px]">🧑</div><div><span className="font-semibold text-xs">Marina S.</span><span className="text-yellow-400 ml-1">★4.9</span></div><div className="ml-auto txd-gradient-text font-bold text-xs">R$ 25</div></div>
      <div className="text-[10px] text-gray-400 mb-1">5,2 km · 8 min</div>
      <div className="flex gap-1 text-[9px]"><div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-primary" />Av. Paulista, 1000</div></div>
      <div className="flex gap-1 text-[9px] mb-2"><div className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5 text-red-400" />Shopping Center</div></div>
      <div className="flex gap-2"><button className="flex-1 py-1 rounded-lg bg-red-500/20 text-red-400 font-medium">Recusar</button><button className="flex-1 py-1 rounded-lg bg-primary text-black font-medium">Aceitar</button></div>
      <div className="text-center mt-1"><button className="text-primary text-[9px]">Negociar valor</button></div>
    </div>
    <div className="grid grid-cols-3 gap-1">
      {[ { label:"Semana", value:"R$ 1.8k" }, { label:"Avaliação", value:"4.9★" }, { label:"Tx. aceite", value:"82%" } ].map((s,i) => <div key={i} className="txd-card p-1.5 text-center"><div className="text-[10px] font-semibold">{s.value}</div><div className="text-[8px] text-gray-500">{s.label}</div></div>)}
    </div>
  </div>;
}

function CompanyDashboard() {
  return <div className="absolute inset-0 pt-12 pb-14 px-3 flex flex-col gap-1.5 z-10 text-[10px]">
    <div className="flex items-center justify-between"><span className="text-[9px] text-gray-400">Farmácia Santa Cruz</span><span className="text-[8px] text-gray-500">Bem-vinda, Ana</span></div>
    <button className="bg-primary text-black text-[10px] font-bold py-1.5 rounded-xl">+ Novo pedido</button>
    <div className="grid grid-cols-2 gap-1">
      {[ { label:"Hoje", value:"24" }, { label:"Em trânsito", value:"6" }, { label:"Concluídos", value:"18" }, { label:"No mês", value:"R$ 2.4k" } ].map((s,i) => <div key={i} className="txd-card p-1.5 text-center"><div className="text-xs font-bold">{s.value}</div><div className="text-[8px] text-gray-500">{s.label}</div></div>)}
    </div>
    <div className="flex-1 space-y-1 overflow-hidden">
      {[ { id:"#5821", status:"Em trânsito", color:"#3ECB8E", client:"João S.", address:"R. das Flores, 123", driver:"Carlos M." },
         { id:"#5820", status:"Aguardando", color:"#f59e0b", client:"Maria A.", address:"Av. Principal, 456", driver:"Buscando..." },
         { id:"#5819", status:"Entregue", color:"#60a5fa", client:"Pedro R.", address:"R. do Comércio, 789", driver:"Ana P." } ].map((o,i) => (
        <div key={i} className="txd-card p-1.5 flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-gray-500">{o.id}</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium" style={{background:`${o.color}20`,color:o.color}}>{o.status}</span>
          <div className="flex-1 min-w-0"><div className="text-[9px] truncate">{o.client}</div><div className="text-[8px] text-gray-500 truncate">{o.address}</div></div>
          <span className="text-[8px] text-gray-500 shrink-0">{o.driver}</span>
        </div>
      ))}
    </div>
  </div>;
}

function DeliveryDashboard() {
  return <div className="absolute inset-0 pt-12 pb-14 px-3 flex flex-col gap-1.5 z-10 text-[10px]">
    <div className="bg-gradient-to-r from-primary to-[#2da874] rounded-xl p-2.5 text-black">
      <div className="font-bold text-[11px]">Entrega em andamento</div>
      <div className="text-[9px] font-medium opacity-80">#5821 · Farmácia · 0,2 kg</div>
    </div>
    <div className="flex items-center gap-1 text-[8px]">
      {["Coletado","A caminho","Entregue"].map((s,i) => <div key={i} className={`flex-1 text-center py-0.5 rounded ${i<2 ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-500"}`}>{s}</div>)}
    </div>
    <div className="flex-1 relative rounded-xl overflow-hidden">
      <TxdMap center={[-23.5505, -46.6333]} zoom={14}
        markers={[{ id:"p", lat:-23.5505, lng:-46.6333, type:"pickup" }, { id:"d", lat:-23.555, lng:-46.638, type:"destination" }, { id:"b", lat:-23.552, lng:-46.636, type:"bike", pulse:true }]}
        route={{ from:{lat:-23.5505,lng:-46.6333}, to:{lat:-23.555,lng:-46.638} }} showRoute interactive={false} />
      <div className="absolute top-2 left-2 txd-glass-strong rounded-xl px-2 py-1"><span className="text-[10px]">Carlos · 3 min</span></div>
    </div>
    <div className="txd-card p-2 flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-sm">📦</div>
      <div className="flex-1"><div className="text-[9px] font-semibold">Entregue · #5820</div><div className="text-[8px] text-gray-500">GPS: -23.548, -46.632 · 14:32</div></div>
      <CheckCircle className="w-4 h-4 text-primary" />
    </div>
    <div className="flex gap-2"><button className="flex-1 py-1.5 rounded-xl bg-white/5 text-gray-300 text-[10px]">Ligar</button><button className="flex-1 py-1.5 rounded-xl bg-primary text-black font-medium text-[10px]">Mensagem</button></div>
  </div>;
}
