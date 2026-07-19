"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "./auth-context";

const NAV_LINKS = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Categorias", href: "#categorias" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "App", href: "#app" },
  { label: "Segurança", href: "#seguranca" },
  { label: "Planos", href: "#planos" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openAuth } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 bg-transparent" id="navbar">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3ECB8E] to-[#2da874] flex items-center justify-center shadow-lg shadow-primary/20">
            <Icon name="car" size={20} className="text-black" />
          </div>
          <span className="font-bold text-xl"><span className="text-white">TX</span><span className="txd-gradient-text">DAPP</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} className="text-sm text-gray-400 hover:text-white transition font-medium">{l.label}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => openAuth("login")} className="text-sm font-medium text-gray-300 hover:text-white transition px-4 py-2">Entrar</button>
          <button onClick={() => openAuth("register")} className="bg-primary hover:bg-primary-hover text-black text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:scale-95 txd-green-glow-sm">Criar conta</button>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5">
          {menuOpen ? <Icon name="x" size={20} /> : <Icon name="menu" size={20} />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-[#11151c]/90 mx-4 rounded-2xl overflow-hidden border border-white/10" style={{ backdropFilter: "blur(16px)" }}>
          <div className="p-4 space-y-2">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition text-sm">{l.label}</a>
            ))}
            <hr className="border-white/5 my-2" />
            <button onClick={() => { setMenuOpen(false); openAuth("login"); }} className="w-full py-3 text-center text-sm text-gray-300 hover:text-white">Entrar</button>
            <button onClick={() => { setMenuOpen(false); openAuth("register"); }} className="w-full py-3 text-center text-sm font-bold bg-primary text-black rounded-xl hover:bg-primary-hover transition">Criar conta</button>
          </div>
        </div>
      )}
    </nav>
  );
}
