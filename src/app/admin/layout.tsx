"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Car, Building2, Route, Package,
  CreditCard, Percent, Gift, FileText, Languages, HeadphonesIcon,
  ShieldAlert, Settings, ChevronLeft, ChevronRight, Menu, X,
  LogOut, Bell, Search, ChevronDown
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", color: "from-blue-500/20 to-blue-600/10", iconColor: "text-blue-400" },
  { label: "Usuários", icon: Users, href: "/admin/users", color: "from-emerald-500/20 to-emerald-600/10", iconColor: "text-emerald-400" },
  { label: "Motoristas", icon: Car, href: "/admin/drivers", color: "from-violet-500/20 to-violet-600/10", iconColor: "text-violet-400" },
  { label: "Empresas", icon: Building2, href: "/admin/companies", color: "from-amber-500/20 to-amber-600/10", iconColor: "text-amber-400" },
  { label: "Viagens", icon: Route, href: "/admin/trips", color: "from-cyan-500/20 to-cyan-600/10", iconColor: "text-cyan-400" },
  { label: "Frete", icon: Package, href: "/admin/freight", color: "from-orange-500/20 to-orange-600/10", iconColor: "text-orange-400" },
  { label: "Pagamentos", icon: CreditCard, href: "/admin/payments", color: "from-green-500/20 to-green-600/10", iconColor: "text-green-400" },
  { label: "Comissão", icon: Percent, href: "/admin/commission", color: "from-pink-500/20 to-pink-600/10", iconColor: "text-pink-400" },
  { label: "Promoções", icon: Gift, href: "/admin/promotions", color: "from-rose-500/20 to-rose-600/10", iconColor: "text-rose-400" },
  { label: "Conteúdo", icon: FileText, href: "/admin/content", color: "from-indigo-500/20 to-indigo-600/10", iconColor: "text-indigo-400" },
  { label: "Traduções", icon: Languages, href: "/admin/translations", color: "from-teal-500/20 to-teal-600/10", iconColor: "text-teal-400" },
  { label: "Suporte", icon: HeadphonesIcon, href: "/admin/support", color: "from-sky-500/20 to-sky-600/10", iconColor: "text-sky-400" },
  { label: "Fraude", icon: ShieldAlert, href: "/admin/fraud", color: "from-red-500/20 to-red-600/10", iconColor: "text-red-400" },
  { label: "Configurações", icon: Settings, href: "/admin/settings", color: "from-gray-500/20 to-gray-600/10", iconColor: "text-gray-400" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="flex h-screen overflow-hidden">

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        <motion.aside
          animate={{ width: collapsed ? 72 : 256 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="hidden lg:flex flex-col h-screen bg-[#0d0d14] border-r border-white/[0.06] relative z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold">T</div>
                <span className="font-semibold text-sm">TXD Admin</span>
              </motion.div>
            )}
            {collapsed && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold mx-auto">T</div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/70"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/[0.06]">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group ${
                      active
                        ? "bg-white/[0.08] text-white"
                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.color} opacity-50`}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon className={`w-4 h-4 relative z-10 ${active ? item.iconColor : ""}`} />
                    {!collapsed && (
                      <span className="text-sm font-medium relative z-10 truncate">{item.label}</span>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/[0.06]">
            <div className={`flex items-center gap-3 p-2 rounded-xl ${collapsed ? "justify-center" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-xs font-bold shrink-0">
                AD
              </div>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium truncate">Admin</p>
                  <p className="text-[10px] text-white/30 truncate">Super Admin</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.aside>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 shrink-0 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="w-64 pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 placeholder-white/20 outline-none focus:border-white/[0.1] transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors relative">
                <Bell className="w-4 h-4 text-white/40" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              </button>
              <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-[10px] font-bold">
                  AD
                </div>
                <span className="text-sm hidden sm:block">Admin</span>
                <ChevronDown className="w-3 h-3 text-white/30" />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 w-72 bg-[#0d0d14] border-r border-white/[0.06] z-50 lg:hidden overflow-y-auto"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold">T</div>
                <span className="font-semibold text-sm">TXD Admin</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>
            <nav className="p-2 space-y-0.5">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      active ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                    }`}>
                      <item.icon className={`w-4 h-4 ${active ? item.iconColor : ""}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
