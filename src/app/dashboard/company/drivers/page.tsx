"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, UserCheck, UserX, Star, Phone, Link, Copy, Check, Loader2 } from "lucide-react";

export default function CompanyDriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/company/drivers").then(r => r.ok ? r.json() : []).then(d => { setDrivers(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    const link = `${window.location.origin}/auth/signup?role=driver`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Motoristas</h1>
            <p className="text-sm text-gray-400">{drivers.length} cadastrados</p>
          </div>
          <button onClick={() => setShowInvite(!showInvite)}
            className="bg-primary hover:bg-primary-hover text-background text-xs font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[0.98] flex items-center gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </motion.div>

        {showInvite && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 space-y-3">
            <h3 className="font-semibold text-sm">Convidar motorista</h3>
            <p className="text-xs text-gray-400">Compartilhe o link abaixo para o motorista se cadastrar como seu colaborador:</p>
            <div className="flex items-center gap-2 bg-background border border-card-border rounded-xl p-2">
              <Link className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
              <span className="text-xs text-gray-300 flex-1 truncate">{typeof window !== "undefined" ? `${window.location.origin}/auth/signup?role=driver` : ""}</span>
              <button onClick={handleCopy} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-2">{Array.from({length:4}).map((_,i) => (
            <div key={i} className="glass-panel p-4 animate-pulse"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-white/10" /><div><div className="h-4 bg-white/10 rounded w-32 mb-1" /><div className="h-3 bg-white/5 rounded w-24" /></div></div></div>
          ))}</div>
        ) : (
          <div className="space-y-2">
            {drivers.map((driver: any) => (
              <motion.div key={driver.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-panel p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                    {driver.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{driver.name}</p>
                      {driver.current_live_status === "ONLINE" && <UserCheck className="w-3.5 h-3.5 text-primary" />}
                      {driver.current_live_status && !["ONLINE","AVAILABLE"].includes(driver.current_live_status) && <UserX className="w-3.5 h-3.5 text-gray-500" />}
                      {driver.status === "pending" && <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      {driver.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{driver.phone}</span>}
                      {driver.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{driver.rating}</span>}
                      <span>{driver.total_trips || 0} corridas</span>
                    </div>
                    {driver.vehicle && (
                      <p className="text-xs text-gray-500 mt-0.5">{driver.vehicle.brand} {driver.vehicle.model} • {driver.vehicle.license_plate}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    driver.current_live_status === "ONLINE" || driver.current_live_status === "AVAILABLE" ? "bg-primary/15 text-primary" :
                    driver.status === "pending" ? "bg-yellow-400/15 text-yellow-400" :
                    "bg-gray-400/15 text-gray-400"
                  }`}>
                    {driver.current_live_status === "ONLINE" || driver.current_live_status === "AVAILABLE" ? "Online" :
                     driver.status === "pending" ? "Pendente" : driver.current_live_status || "Offline"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
          <h3 className="font-semibold text-sm mb-3">Atividade dos motoristas</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-background rounded-xl p-3">
              <p className="text-xl font-bold text-primary">{drivers.filter((d: any) => d.current_live_status === "ONLINE" || d.current_live_status === "AVAILABLE").length}</p>
              <p className="text-xs text-gray-500">Online agora</p>
            </div>
            <div className="bg-background rounded-xl p-3">
              <p className="text-xl font-bold text-primary">{drivers.reduce((s: number, d: any) => s + (d.total_trips || 0), 0)}</p>
              <p className="text-xs text-gray-500">Total corridas</p>
            </div>
            <div className="bg-background rounded-xl p-3">
              <p className="text-xl font-bold text-primary">{drivers.length}</p>
              <p className="text-xs text-gray-500">Motoristas</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
