"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";

const NAV_CONFIG: Record<string, { label: string; icon: string; href: string }[]> = {
  passenger: [
    { label: "Início", icon: "🏠", href: "/dashboard/passenger" },
    { label: "Explorar", icon: "🌍", href: "/dashboard/passenger/explore" },
    { label: "Pedidos", icon: "📦", href: "/dashboard/passenger/orders" },
    { label: "Carteira", icon: "💰", href: "/dashboard/passenger/wallet" },
  ],
  driver: [
    { label: "Início", icon: "🏠", href: "/dashboard/driver" },
    { label: "Corrida", icon: "🚗", href: "/dashboard/driver/active-trip" },
    { label: "Ganhos", icon: "📊", href: "/dashboard/driver/earnings" },
    { label: "Carteira", icon: "💰", href: "/dashboard/driver/wallet" },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string>("passenger");

  useEffect(() => {
    const seg = pathname.split("/")[2];
    if (seg === "passenger" || seg === "driver") setRole(seg);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const navItems = NAV_CONFIG[role] || NAV_CONFIG.passenger;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <main className="pb-20 min-h-[100dvh]">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel rounded-none border-t border-card-border px-2 py-1"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.label} href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-colors ${
                  active ? "text-primary" : "text-gray-500"
                }`}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-gray-500">
            <span className="text-xl">🚪</span>
            <span className="text-[10px] font-medium">Sair</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
