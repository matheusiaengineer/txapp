"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, Car, CircleDot, CalendarDays, DollarSign, ShieldCheck,
  TrendingUp, UserPlus, Eye, CheckCircle, XCircle, Search,
  MapPin, Clock, ChevronRight, Activity, CreditCard, Settings
} from "lucide-react";

const stats = [
  { label: "Total Usuários", value: "24.582", icon: Users, color: "from-blue-500/20 to-blue-600/10", iconColor: "text-blue-400", change: "+12%", changePositive: true },
  { label: "Motoristas Ativos", value: "3.847", icon: Car, color: "from-emerald-500/20 to-emerald-600/10", iconColor: "text-emerald-400", change: "+8%", changePositive: true },
  { label: "Online Agora", value: "1.203", icon: CircleDot, color: "from-green-500/20 to-green-600/10", iconColor: "text-green-400", change: "+5%", changePositive: true },
  { label: "Viagens Hoje", value: "8.421", icon: CalendarDays, color: "from-violet-500/20 to-violet-600/10", iconColor: "text-violet-400", change: "+18%", changePositive: true },
  { label: "Receita Hoje", value: "R$ 142.580", icon: DollarSign, color: "from-amber-500/20 to-amber-600/10", iconColor: "text-amber-400", change: "+22%", changePositive: true },
  { label: "Verificações Pendentes", value: "47", icon: ShieldCheck, color: "from-rose-500/20 to-rose-600/10", iconColor: "text-rose-400", change: "-3", changePositive: false },
];

const revenueData = [
  { day: "Seg", value: 32000 }, { day: "Ter", value: 28000 }, { day: "Qua", value: 35000 },
  { day: "Qui", value: 30000 }, { day: "Sex", value: 42000 }, { day: "Sáb", value: 48000 },
  { day: "Dom", value: 38000 },
];

const growthData = [
  { month: "Jan", users: 18000, drivers: 2800 },
  { month: "Fev", users: 19500, drivers: 2950 },
  { month: "Mar", users: 20500, drivers: 3100 },
  { month: "Abr", users: 21800, drivers: 3300 },
  { month: "Mai", users: 23000, drivers: 3550 },
  { month: "Jun", users: 24582, drivers: 3847 },
];

const recentTrips = [
  { id: "T-1001", passenger: "Ana Silva", driver: "Carlos Oliveira", route: "Centro → Ipanema", amount: "R$ 32,50", status: "Concluída" },
  { id: "T-1002", passenger: "Bruno Santos", driver: "Maria Souza", route: "Copacabana → Barra", amount: "R$ 58,00", status: "Em andamento" },
  { id: "T-1003", passenger: "Carla Mendes", driver: "João Pereira", route: "Tijuca → Botafogo", amount: "R$ 25,00", status: "Concluída" },
  { id: "T-1004", passenger: "Daniel Costa", driver: "Fernanda Lima", route: "Leblon → Gávea", amount: "R$ 18,00", status: "Cancelada" },
  { id: "T-1005", passenger: "Eduardo Alves", driver: "Rafael Gomes", route: "Santa Teresa → Lapa", amount: "R$ 15,00", status: "Concluída" },
];

const pendingVerifications = [
  { id: "V-001", name: "Fernando Dias", document: "CPF: 123.456.789-00", date: "13/07/2026", status: "pending" },
  { id: "V-002", name: "Gabriela Rocha", document: "CNH: 98765432100", date: "13/07/2026", status: "pending" },
  { id: "V-003", name: "Humberto Neto", document: "RG: 55.678.901-2", date: "12/07/2026", status: "pending" },
  { id: "V-004", name: "Isabela Torres", document: "Passaporte: PT123456", date: "12/07/2026", status: "pending" },
];

const activeTripsMap = [
  { id: "T-1002", passenger: "Bruno Santos", driver: "Maria Souza", origin: "Copacabana", destination: "Barra", eta: "18 min" },
  { id: "T-1006", passenger: "Júlia Campos", driver: "Thiago Martins", origin: "Centro", destination: "Niterói", eta: "32 min" },
  { id: "T-1007", passenger: "Lucas Ferreira", driver: "Patrícia Almeida", origin: "Recreio", destination: "Barra", eta: "12 min" },
];

const quickActions = [
  { label: "Nova Promoção", icon: CreditCard, color: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" },
  { label: "Verificar Documentos", icon: Eye, color: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" },
  { label: "Configurar Taxas", icon: Settings, color: "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20" },
  { label: "Exportar Relatório", icon: Activity, color: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">

        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Painel Administrativo</h1>
            <p className="text-white/40 text-sm mt-1">Gerencie sua plataforma TXD</p>
          </div>
          <div className="flex gap-2">
            {["overview", "analytics"].map((tab) => (
              <button key={tab} onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedTab === tab ? "bg-white/10 text-white border border-white/10" : "text-white/40 hover:text-white/70"}`}>
                {tab === "overview" ? "Visão Geral" : "Analytics"}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <motion.div key={stat.label} whileHover={{ y: -4 }} className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 group">
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${stat.color}`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  <span className={`text-xs font-medium ${stat.changePositive ? "text-emerald-400" : "text-rose-400"}`}>{stat.change}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={item} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Receita Semanal</h3>
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex items-end gap-2 h-40">
              {revenueData.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex flex-col items-center">
                    <span className="text-[10px] text-white/30 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.value.toLocaleString()}
                    </span>
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: `${(d.value / 48000) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-amber-500/40 to-amber-400/20 hover:from-amber-500/60 transition-all"
                      style={{ height: `${(d.value / 48000) * 140}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/30">{d.day}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Crescimento de Usuários</h3>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="space-y-3">
              {growthData.map((d, i) => (
                <div key={d.month} className="flex items-center gap-4">
                  <span className="text-xs text-white/30 w-8">{d.month}</span>
                  <div className="flex-1 space-y-1">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${(d.users / 25000) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500/40 to-blue-400/20"
                    />
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${(d.drivers / 4000) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 + 0.1 }}
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500/40 to-emerald-400/20"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/60">{d.users.toLocaleString()}</p>
                    <p className="text-[10px] text-white/20">{d.drivers} motoristas</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={item} className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Viagens Recentes</h3>
              <button className="text-xs text-white/40 hover:text-white/70 transition-colors">Ver todas</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/40 text-xs uppercase">
                    <th className="text-left py-3 font-medium">ID</th>
                    <th className="text-left py-3 font-medium">Passageiro</th>
                    <th className="text-left py-3 font-medium">Motorista</th>
                    <th className="text-left py-3 font-medium">Rota</th>
                    <th className="text-right py-3 font-medium">Valor</th>
                    <th className="text-right py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.map((trip) => (
                    <tr key={trip.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-white/60">{trip.id}</td>
                      <td className="py-3">{trip.passenger}</td>
                      <td className="py-3 text-white/70">{trip.driver}</td>
                      <td className="py-3 text-white/60">{trip.route}</td>
                      <td className="py-3 text-right font-medium">{trip.amount}</td>
                      <td className="py-3 text-right">
                        <span className={`text-xs px-2 py-1 rounded-lg ${
                          trip.status === "Concluída" ? "bg-emerald-500/10 text-emerald-400" :
                          trip.status === "Em andamento" ? "bg-blue-500/10 text-blue-400" :
                          "bg-rose-500/10 text-rose-400"
                        }`}>{trip.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Verificações Pendentes</h3>
              <ShieldCheck className="w-4 h-4 text-rose-400" />
            </div>
            <div className="space-y-3">
              {pendingVerifications.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                  <div>
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-white/40">{v.document}</p>
                    <p className="text-[10px] text-white/20">{v.date}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={item} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mapa de Viagens Ativas</h3>
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <div className="relative h-48 rounded-xl bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-sm text-white/60">{activeTripsMap.length} viagens ativas</p>
                </div>
              </div>
              {activeTripsMap.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="absolute w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50"
                  style={{ left: `${20 + i * 25}%`, top: `${30 + (i % 3) * 20}%` }}
                />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {activeTripsMap.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-white/30" />
                    <div>
                      <p className="text-sm">{trip.passenger} <span className="text-white/40">→</span> {trip.destination}</p>
                      <p className="text-[10px] text-white/30">{trip.driver}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Clock className="w-3 h-3" />
                    {trip.eta}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ações Rápidas</h3>
              <ChevronRight className="w-4 h-4 text-white/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] transition-all ${action.color}`}
                >
                  <action.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}
