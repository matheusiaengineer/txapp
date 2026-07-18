"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, UserCheck, UserX, Star, Phone, Mail, MoreHorizontal, Link, Copy, Check, Loader2 } from "lucide-react";
import { SkeletonList } from "@/components/ui/skeleton";

const MOCK_DRIVERS = [
  { id: 1, name: "Carlos Silva", phone: "(11) 99999-0001", status: "active", rating: 4.9, trips: 342, vehicle: "Honda CG 160" },
  { id: 2, name: "Ana Oliveira", phone: "(11) 99999-0002", status: "active", rating: 4.8, trips: 281, vehicle: "Fiat Uno" },
  { id: 3, name: "João Santos", phone: "(11) 99999-0003", status: "inactive", rating: 4.5, trips: 124, vehicle: "VW Gol" },
  { id: 4, name: "Maria Costa", phone: "(11) 99999-0004", status: "pending", rating: 0, trips: 0, vehicle: "Yamaha Factor" },
];

export default function CompanyDriversPage() {
  const [drivers] = useState(MOCK_DRIVERS);
  const [loading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteLink] = useState("txdapp.com/convite/EMPRESA123");

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
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

        <AnimatePresence>
          {showInvite && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-panel p-5 space-y-3">
              <h3 className="font-semibold text-sm">Convidar motorista</h3>
              <p className="text-xs text-gray-400">Compartilhe o link abaixo com o motorista para ele se cadastrar como seu colaborador:</p>
              <div className="flex items-center gap-2 bg-background border border-card-border rounded-xl p-2">
                <Link className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                <span className="text-xs text-gray-300 flex-1 truncate">{inviteLink}</span>
                <button onClick={handleCopy} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  { label: "Admin", desc: "Acesso total" },
                  { label: "Operador", desc: "Criar pedidos" },
                  { label: "Financeiro", desc: "Ver faturas" },
                ].map(p => (
                  <button key={p.label} className="p-3 rounded-xl bg-background border border-card-border hover:border-primary/30 transition-all">
                    <p className="font-semibold text-primary">{p.label}</p>
                    <p className="text-gray-500 mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
              <button className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all hover:scale-[0.98] text-xs">
                Gerar Link de Convite
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <SkeletonList count={4} />
        ) : (
          <div className="space-y-2">
            {drivers.map(driver => (
              <motion.div key={driver.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-panel p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{driver.name}</p>
                      {driver.status === "active" && <UserCheck className="w-3.5 h-3.5 text-primary" />}
                      {driver.status === "inactive" && <UserX className="w-3.5 h-3.5 text-gray-500" />}
                      {driver.status === "pending" && <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{driver.phone}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{driver.rating || "—"}</span>
                      <span>{driver.trips} corridas</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{driver.vehicle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    driver.status === "active" ? "bg-primary/15 text-primary" :
                    driver.status === "inactive" ? "bg-gray-400/15 text-gray-400" :
                    "bg-yellow-400/15 text-yellow-400"
                  }`}>{driver.status === "active" ? "Ativo" : driver.status === "inactive" ? "Inativo" : "Pendente"}</span>
                  <button className="p-1.5 hover:bg-white/5 rounded-xl"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
          <h3 className="font-semibold text-sm mb-3">Atividade dos motoristas</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-background rounded-xl p-3">
              <p className="text-xl font-bold text-primary">3</p>
              <p className="text-xs text-gray-500">Online agora</p>
            </div>
            <div className="bg-background rounded-xl p-3">
              <p className="text-xl font-bold text-primary">12</p>
              <p className="text-xs text-gray-500">Entregas hoje</p>
            </div>
            <div className="bg-background rounded-xl p-3">
              <p className="text-xl font-bold text-primary">R$ 847</p>
              <p className="text-xs text-gray-500">Gasto hoje</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
