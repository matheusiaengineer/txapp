"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Clock, Wallet, Heart, User, HeadphonesIcon,
  Settings, LogOut, Bell, ChevronDown, Building2, Truck,
  Package, TrendingUp, Users, Briefcase, Map, MapPin, Car,
  Shield, Gift, Award, Camera, X, DollarSign,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useUser } from "@/lib/hooks/use-user";
import { notificationService } from "@/lib/notification/notification-service";

interface NavItem {
  label: string;
  icon: typeof Home;
  href: string;
  badge?: number;
}

const roleNav: Record<string, NavItem[]> = {
  passenger: [
    { label: "Início", icon: Home, href: "/dashboard/passenger" },
    { label: "Histórico", icon: Clock, href: "/dashboard/passenger/history" },
    { label: "Carteira", icon: Wallet, href: "/dashboard/passenger/wallet", badge: 0 },
    { label: "Favoritos", icon: Heart, href: "/dashboard/passenger/favorites" },
    { label: "Indique e Ganhe R$ 10", icon: Gift, href: "/social" },
    { label: "Perfil", icon: User, href: "/dashboard/verificacao" },
    { label: "Ajuda e Segurança", icon: Shield, href: "/support" },
    { label: "___divider___", icon: Home, href: "#" },
    { label: "Configurações", icon: Settings, href: "/settings" },
  ],
  driver: [
    { label: "Início", icon: Home, href: "/dashboard/driver" },
    { label: "Ganhos", icon: Wallet, href: "/dashboard/driver/earnings" },
    { label: "Viagens", icon: Clock, href: "/dashboard/driver/trips" },
    { label: "Mapa", icon: Map, href: "/dashboard/driver/map" },
    { label: "Endereços", icon: MapPin, href: "/dashboard/driver/addresses" },
    { label: "Comunidade", icon: Users, href: "/social" },
    { label: "Perfil", icon: User, href: "/dashboard/driver/kyc" },
    { label: "Suporte", icon: HeadphonesIcon, href: "/support" },
    { label: "Configurações", icon: Settings, href: "/settings" },
  ],
  company: [
    { label: "Dashboard", icon: Home, href: "/dashboard/company" },
    { label: "Entregas", icon: Package, href: "/dashboard/company/deliveries" },
    { label: "Motoristas", icon: Users, href: "/dashboard/company/drivers" },
    { label: "Clientes", icon: Heart, href: "/dashboard/company/clients" },
    { label: "Campanhas", icon: TrendingUp, href: "/dashboard/company/campaigns" },
    { label: "Financeiro", icon: Wallet, href: "/dashboard/company/finance" },
    { label: "Comunidade", icon: Users, href: "/social" },
    { label: "Configurações", icon: Settings, href: "#" },
  ],
  transporter: [
    { label: "Início", icon: Home, href: "/dashboard/transporter" },
    { label: "Cargas", icon: Truck, href: "/freight/loads" },
    { label: "Fretes", icon: Package, href: "/freight" },
    { label: "Endereços", icon: MapPin, href: "/dashboard/transporter/addresses" },
    { label: "Comunidade", icon: Users, href: "/social" },
    { label: "Suporte", icon: HeadphonesIcon, href: "/support" },
    { label: "Perfil", icon: User, href: "/dashboard/verificacao" },
    { label: "Configurações", icon: Settings, href: "/settings" },
  ],
  employee: [
    { label: "Início", icon: Home, href: "/dashboard/employee" },
    { label: "Pedidos", icon: Package, href: "/dashboard/employee/orders" },
    { label: "Comunidade", icon: Users, href: "/social" },
    { label: "Perfil", icon: User, href: "#" },
    { label: "Suporte", icon: HeadphonesIcon, href: "#" },
    { label: "Configurações", icon: Settings, href: "#" },
  ],
};

const roleNames: Record<string, string> = {
  passenger: "Passageiro",
  driver: "Motorista",
  company: "Empresa",
  transporter: "Transportador",
  employee: "Funcionário",
  admin: "Admin",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>("passenger");
  const [notifCount, setNotifCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [walletBal, setWalletBal] = useState<number | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    notificationService.getUnreadCount().then(setNotifCount);
    const unsub = notificationService.subscribe(() => notificationService.getUnreadCount().then(setNotifCount));
    return unsub;
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("wallets").select("balance").eq("profile_id", user.id).maybeSingle();
        if (data) setWalletBal((data as any).balance);
      } catch {}
    })();
  }, [user?.id]);

  useEffect(() => {
    const seg = pathname.split("/")[2];
    if (seg && roleNav[seg]) {
      setCurrentRole(seg);
    }
  }, [pathname]);

  const navItems = roleNav[currentRole] || roleNav.passenger;

  const isActive = (href: string) => {
    if (href === "#") return false;
    if (roleNav[currentRole]?.slice(0, 4).some(n => n.href === href)) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 z-50 glass-panel rounded-none border-r border-card-border p-4">
        <div className="flex items-center gap-3 px-2 py-4 mb-4">
          <button onClick={() => setShowPhotoModal(true)} className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0 hover:ring-2 ring-primary/50 transition-all">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-primary" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-white">
              {user?.full_name || "Usuário"}
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-gray-400">
                {roleNames[currentRole] || "Usuário"}
              </p>
              <span className="px-1.5 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 text-[9px] font-bold border border-yellow-400/20">
                Nível Ouro
              </span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            if (item.label === "___divider___") {
              return <div key="divider" className="h-px bg-card-border my-2" />;
            }
            const active = isActive(item.href);
            const Icon = item.icon;
            const isReferral = item.label === "Indique e Ganhe R$ 10";
            return (
              <Link key={item.label} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors ${
                    active
                      ? "bg-primary/15 text-primary font-semibold"
                      : isReferral
                      ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/5"
                      : "text-gray-400 hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isReferral && !active ? "text-yellow-400" : ""}`} />
                  <span className={`text-sm ${isReferral && !active ? "font-medium" : ""}`}>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                      item.label === "Carteira" && walletBal !== null
                        ? "bg-primary/10 text-primary"
                        : "bg-primary text-background"
                    }`}>
                      {item.label === "Carteira" && walletBal !== null
                        ? `R$ ${walletBal.toFixed(0)}`
                        : item.badge > 0 ? (item.badge > 9 ? "9+" : item.badge) : ""}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-card-border">
          <Link href="/notifications" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-foreground cursor-pointer transition-colors">
            <Bell className="w-5 h-5" />
            <span className="text-sm">Notificações</span>
            {notifCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{notifCount > 9 ? "9+" : notifCount}</span>
            )}
          </Link>
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sair</span>
          </motion.button>
        </div>
      </aside>

      <main className="flex-1 md:ml-72 pb-20 md:pb-0 min-h-[100dvh]">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel rounded-none border-t border-card-border px-1 py-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 2).map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="flex-1">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center gap-0.5 py-3 rounded-xl transition-colors relative ${
                    active ? "text-primary" : "text-gray-400"
                  }`}
                >
                  {active && <motion.div layoutId="nav-active" className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
          {/* Central Corrida button */}
          <Link href="/ride" className="flex-1">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-0 py-1 rounded-xl relative"
            >
              <div className="w-12 h-12 -mt-4 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-background">
                <Car className="w-6 h-6 text-black" />
              </div>
              <span className="text-[11px] font-medium text-primary">Corrida</span>
            </motion.div>
          </Link>
          {navItems.slice(2, 4).map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="flex-1">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center gap-0.5 py-3 rounded-xl transition-colors relative ${
                    active ? "text-primary" : "text-gray-400"
                  }`}
                >
                  {active && <motion.div layoutId="nav-active" className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout churn barrier */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowLogoutModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="glass-panel rounded-3xl p-6 max-w-sm w-full space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <LogOut className="w-7 h-7 text-red-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">Tem certeza?</h3>
                <p className="text-sm text-gray-400 mt-1">Você não receberá alertas de descontos e promoções.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-card-bg border border-card-border hover:border-primary/30 text-gray-300 font-medium py-3 rounded-xl transition text-sm">
                  Continuar no app
                </button>
                <button onClick={() => { setShowLogoutModal(false); handleLogout(); }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-xl transition text-sm">
                  Sair
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo upload modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPhotoModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="glass-panel rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Foto de perfil</h3>
                <p className="text-sm text-gray-400 mt-1">Adicione uma foto para gerar confiança</p>
              </div>
              <label className="block w-full bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl transition text-sm cursor-pointer text-center">
                <Camera className="w-4 h-4 inline mr-2" />Escolher foto
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const supabase = createClient();
                    const { data: { user: u } } = await supabase.auth.getUser();
                    if (!u) return;
                    const ext = file.name.split(".").pop();
                    const path = `avatars/${u.id}.${ext}`;
                    await supabase.storage.from("profiles").upload(path, file, { upsert: true });
                    const { data: url } = supabase.storage.from("profiles").getPublicUrl(path);
                    await supabase.from("profiles").update({ avatar_url: url.publicUrl }).eq("id", u.id);
                    window.location.reload();
                  } catch {}
                  setShowPhotoModal(false);
                }} />
              </label>
              <button onClick={() => setShowPhotoModal(false)}
                className="w-full text-gray-400 hover:text-white py-2 text-sm transition">Cancelar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
