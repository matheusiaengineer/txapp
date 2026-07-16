"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Car, TrendingUp, DollarSign, MapPin, CheckCircle, XCircle, AlertTriangle, Search, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminSecretPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const ADMIN_CODE = "TXD2026";

  const handleAuth = () => {
    if (code === ADMIN_CODE) {
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 max-w-sm w-full text-center space-y-4">
          <Shield className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Acesso Restrito</h1>
          <p className="text-sm text-gray-400">Digite o código de administrador</p>
          <input type="password" value={code} onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAuth()}
            placeholder="Código secreto"
            className="w-full bg-background border border-card-border rounded-xl p-3 text-white text-center text-lg tracking-widest focus:border-primary focus:outline-none transition-colors" />
          {error && <p className="text-red-400 text-xs">Código incorreto</p>}
          <button onClick={handleAuth}
            className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl transition-all">
            Acessar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AdminDashboard />
  );
}

function AdminDashboard() {
  const [stats] = useState({
    gmv: 84732.50,
    activeDrivers: 23,
    activeCities: 7,
    pendingKYC: 12,
    totalUsers: 4582,
    revenue: 12709.88,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Painel Admin</h1>
            </div>
            <p className="text-sm text-gray-400">GMV: R$ {stats.gmv.toLocaleString("pt-BR")}</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary">AO VIVO</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "GMV Total", value: `R$ ${stats.gmv.toLocaleString("pt-BR")}`, icon: DollarSign, color: "text-primary" },
            { label: "Motoristas Online", value: stats.activeDrivers, icon: Car, color: "text-blue-400" },
            { label: "Cidades Ativas", value: stats.activeCities, icon: MapPin, color: "text-purple-400" },
            { label: "Usuários", value: stats.totalUsers, icon: Users, color: "text-yellow-400" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${s.color}`} />
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            );
          })}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KYC Queue */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Fila de Aprovação KYC</h2>
              <span className="text-xs bg-yellow-400/15 text-yellow-400 px-2 py-0.5 rounded-full">{stats.pendingKYC} pendentes</span>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between bg-background rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {String.fromCharCode(64 + i)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Motorista {i}</p>
                      <p className="text-[10px] text-gray-500">CNH + Selfie enviados há 2h</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 bg-primary/10 rounded-lg hover:bg-primary/20"><CheckCircle className="w-4 h-4 text-primary" /></button>
                    <button className="p-1.5 bg-red-500/10 rounded-lg hover:bg-red-500/20"><XCircle className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by city */}
          <div className="glass-panel p-5">
            <h2 className="font-semibold mb-4">Receita por Cidade</h2>
            <div className="space-y-3">
              {[
                { city: "São Paulo", revenue: 45230.00, percent: 53 },
                { city: "Rio de Janeiro", revenue: 21340.00, percent: 25 },
                { city: "Belo Horizonte", revenue: 10980.00, percent: 13 },
                { city: "Curitiba", revenue: 4190.00, percent: 5 },
                { city: "Demais", revenue: 2992.50, percent: 4 },
              ].map(c => (
                <div key={c.city}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{c.city}</span>
                    <span className="font-semibold text-primary">R$ {c.revenue.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${c.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
          <h2 className="font-semibold mb-4">Suspender Usuário</h2>
          <div className="flex gap-3">
            <input type="text" placeholder="Email ou ID do usuário"
              className="flex-1 bg-background border border-card-border rounded-xl p-3 text-white text-sm focus:border-primary focus:outline-none transition-colors" />
            <button className="bg-red-500/20 text-red-400 font-bold px-6 py-3 rounded-xl hover:bg-red-500/30 transition-all text-sm">
              Suspender
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
          <h2 className="font-semibold mb-4">Configurar Preços por Cidade</h2>
          <div className="space-y-3">
            {["São Paulo", "Rio de Janeiro", "Belo Horizonte"].map(city => (
              <div key={city} className="flex items-center justify-between bg-background rounded-xl p-3">
                <span className="text-sm font-medium">{city}</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-gray-400">
                    Base: <input type="number" defaultValue="5.00" className="w-16 bg-card-bg border border-card-border rounded-lg p-1 text-white text-center" />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-400">
                    Km: <input type="number" defaultValue="1.50" className="w-16 bg-card-bg border border-card-border rounded-lg p-1 text-white text-center" />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-400">
                    Min: <input type="number" defaultValue="0.50" className="w-16 bg-card-bg border border-card-border rounded-lg p-1 text-white text-center" />
                  </label>
                  <button className="text-xs text-primary hover:underline">Salvar</button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="text-center text-[10px] text-gray-600 pt-4 border-t border-card-border">
          Painel Administrativo Secreto · Acesso restrito
        </div>
      </div>
    </div>
  );
}
