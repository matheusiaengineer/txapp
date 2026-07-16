"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Clock, Wallet, Heart, User, HeadphonesIcon,
  Settings, LogOut, Bell, ChevronDown, Building2, Truck,
  Package, TrendingUp, Users, Briefcase, Map,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

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
    { label: "Carteira", icon: Wallet, href: "/dashboard/passenger/wallet" },
    { label: "Favoritos", icon: Heart, href: "/dashboard/passenger/favorites" },
    { label: "Comunidade", icon: Users, href: "/social" },
    { label: "Perfil", icon: User, href: "#" },
    { label: "Suporte", icon: HeadphonesIcon, href: "#" },
    { label: "Configurações", icon: Settings, href: "#" },
  ],
  driver: [
    { label: "Início", icon: Home, href: "/dashboard/driver" },
    { label: "Ganhos", icon: Wallet, href: "/dashboard/driver/earnings" },
    { label: "Viagens", icon: Clock, href: "/dashboard/driver/trips" },
    { label: "Mapa", icon: Map, href: "/dashboard/driver/map" },
    { label: "Comunidade", icon: Users, href: "/social" },
    { label: "Perfil", icon: User, href: "#" },
    { label: "Suporte", icon: HeadphonesIcon, href: "#" },
    { label: "Configurações", icon: Settings, href: "#" },
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
    { label: "Fretes", icon: Truck, href: "/dashboard/transporter/freights" },
    { label: "Entregas", icon: Package, href: "/dashboard/transporter/deliveries" },
    { label: "Ganhos", icon: Wallet, href: "/dashboard/transporter/earnings" },
    { label: "Rotas", icon: Map, href: "/dashboard/transporter/routes" },
    { label: "Comunidade", icon: Users, href: "/social" },
    { label: "Perfil", icon: User, href: "#" },
    { label: "Configurações", icon: Settings, href: "#" },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>("passenger");

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
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {currentRole === "passenger" ? "Ana Oliveira" :
               currentRole === "driver" ? "Carlos Silva" :
               currentRole === "company" ? "Empresa XYZ" :
               "Transportador ABC"}
            </p>
            <p className="text-xs text-gray-400">
              {roleNames[currentRole] || "Usuário"}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                    active
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-gray-400 hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary text-background text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-card-border">
          <div className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-foreground cursor-pointer transition-colors">
            <Bell className="w-5 h-5" />
            <span className="text-sm">Notificações</span>
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>
          </div>
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sair</span>
          </motion.button>
        </div>
      </aside>

      <main className="flex-1 md:ml-72 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel rounded-none border-t border-card-border px-1 py-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 4).map((item) => {
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
    </div>
  );
}
