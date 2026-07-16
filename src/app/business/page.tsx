"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Truck, Users, BarChart3, FileText, CreditCard, MapPin,
  Plus, UserPlus, Search, MoreHorizontal, Phone, Mail, CheckCircle,
  XCircle, AlertCircle, ArrowRight, TrendingUp, Download, Settings,
  CircleDollarSign, CalendarDays, Package, Layers, Gauge,
} from "lucide-react";

type Tab = "fleet" | "drivers" | "shipments" | "analytics" | "invoices" | "departments";

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  status: "active" | "maintenance" | "inactive";
  driver: string;
  lastService: string;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "online" | "offline" | "busy";
  vehicle: string;
  rating: number;
  earnings: number;
}

interface Shipment {
  id: string;
  origin: string;
  destination: string;
  status: "pending" | "in_transit" | "delivered" | "cancelled";
  value: number;
  driver: string;
  eta: string;
}

const mockVehicles: Vehicle[] = [
  { id: "v1", plate: "ABC-1234", model: "Fiat Toro 2024", year: 2024, status: "active", driver: "Carlos Silva", lastService: "2026-06-15" },
  { id: "v2", plate: "DEF-5678", model: "VW Delivery Express", year: 2023, status: "maintenance", driver: "—", lastService: "2026-07-01" },
  { id: "v3", plate: "GHI-9012", model: "Mercedes Sprinter", year: 2024, status: "active", driver: "Ana Costa", lastService: "2026-06-20" },
  { id: "v4", plate: "JKL-3456", model: "Fiat Fiorino", year: 2022, status: "active", driver: "Pedro Santos", lastService: "2026-05-30" },
  { id: "v5", plate: "MNO-7890", model: "Ford Transit", year: 2023, status: "inactive", driver: "—", lastService: "2026-04-10" },
];

const mockDrivers: Driver[] = [
  { id: "d1", name: "Carlos Silva", email: "carlos@email.com", phone: "(11) 99999-0001", status: "online", vehicle: "ABC-1234", rating: 4.8, earnings: 12500 },
  { id: "d2", name: "Ana Costa", email: "ana@email.com", phone: "(11) 99999-0002", status: "busy", vehicle: "GHI-9012", rating: 4.9, earnings: 15200 },
  { id: "d3", name: "Pedro Santos", email: "pedro@email.com", phone: "(11) 99999-0003", status: "offline", vehicle: "JKL-3456", rating: 4.6, earnings: 8900 },
  { id: "d4", name: "Maria Oliveira", email: "maria@email.com", phone: "(11) 99999-0004", status: "online", vehicle: "—", rating: 4.7, earnings: 10500 },
];

const mockShipments: Shipment[] = [
  { id: "s1", origin: "São Paulo, SP", destination: "Campinas, SP", status: "in_transit", value: 4500, driver: "Carlos Silva", eta: "14:30" },
  { id: "s2", origin: "Rio de Janeiro, RJ", destination: "Belo Horizonte, MG", status: "pending", value: 8200, driver: "Ana Costa", eta: "18:45" },
  { id: "s3", origin: "Curitiba, PR", destination: "São Paulo, SP", status: "delivered", value: 3200, driver: "Pedro Santos", eta: "—" },
  { id: "s4", origin: "Brasília, DF", destination: "Goiânia, GO", status: "cancelled", value: 2100, driver: "Maria Oliveira", eta: "—" },
  { id: "s5", origin: "São Paulo, SP", destination: "Santos, SP", status: "in_transit", value: 1800, driver: "Carlos Silva", eta: "11:00" },
];

const statusColors: Record<string, string> = {
  active: "text-success bg-success/10",
  maintenance: "text-warning bg-warning/10",
  inactive: "text-gray-500 bg-gray-500/10",
  online: "text-success bg-success/10",
  offline: "text-gray-500 bg-gray-500/10",
  busy: "text-warning bg-warning/10",
  pending: "text-warning bg-warning/10",
  in_transit: "text-info bg-info/10",
  delivered: "text-success bg-success/10",
  cancelled: "text-error bg-error/10",
};

export default function BusinessPage() {
  const [activeTab, setActiveTab] = useState<Tab>("fleet");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "fleet", label: "Frota", icon: <Truck className="w-4 h-4" /> },
    { key: "drivers", label: "Motoristas", icon: <Users className="w-4 h-4" /> },
    { key: "shipments", label: "Entregas", icon: <Package className="w-4 h-4" /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "invoices", label: "Faturas", icon: <FileText className="w-4 h-4" /> },
    { key: "departments", label: "Departamentos", icon: <Layers className="w-4 h-4" /> },
  ];

  const monthlyData = [
    { month: "Jan", value: 12500 }, { month: "Fev", value: 18200 },
    { month: "Mar", value: 15800 }, { month: "Abr", value: 22100 },
    { month: "Mai", value: 19500 }, { month: "Jun", value: 25400 },
  ];

  const maxValue = Math.max(...monthlyData.map(d => d.value));

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Empresas</h1>
              <p className="text-sm text-gray-400">Painel corporativo TXD</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-card-bg transition-colors">
              <Download className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-2 rounded-xl hover:bg-card-bg transition-colors">
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-4 scrollbar-none"
        >
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-background"
                  : "bg-card-bg text-gray-400 hover:text-white border border-card-border"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "fleet" && <FleetTab searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
            {activeTab === "drivers" && <DriversTab searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
            {activeTab === "shipments" && <ShipmentsTab />}
            {activeTab === "analytics" && <AnalyticsTab monthlyData={monthlyData} maxValue={maxValue} />}
            {activeTab === "invoices" && <InvoicesTab />}
            {activeTab === "departments" && <DepartmentsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function SearchBar({ query, setQuery, placeholder = "Buscar..." }: { query: string; setQuery: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-card-bg border border-card-border rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/50 transition-colors"
      />
    </div>
  );
}

function FleetTab({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (v: string) => void }) {
  const filtered = mockVehicles.filter(v =>
    v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <SearchBar query={searchQuery} setQuery={setSearchQuery} placeholder="Buscar por placa ou modelo..." />
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background text-sm font-bold py-2 px-4 rounded-xl transition-all hover:scale-95">
          <Plus className="w-4 h-4" />
          Adicionar veículo
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left p-4 text-gray-500 font-medium">Placa</th>
                <th className="text-left p-4 text-gray-500 font-medium">Modelo</th>
                <th className="text-left p-4 text-gray-500 font-medium">Status</th>
                <th className="text-left p-4 text-gray-500 font-medium">Motorista</th>
                <th className="text-left p-4 text-gray-500 font-medium">Última revisão</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="border-b border-card-border/50 hover:bg-card-bg/30 transition-colors">
                  <td className="p-4 font-medium text-white">{v.plate}</td>
                  <td className="p-4 text-gray-400">{v.model}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[v.status]}`}>
                      {v.status === "active" && <CheckCircle className="w-3 h-3" />}
                      {v.status === "maintenance" && <AlertCircle className="w-3 h-3" />}
                      {v.status === "inactive" && <XCircle className="w-3 h-3" />}
                      {v.status === "active" ? "Ativo" : v.status === "maintenance" ? "Manutenção" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{v.driver}</td>
                  <td className="p-4 text-gray-400">{v.lastService}</td>
                  <td className="p-4">
                    <button className="p-1.5 rounded-lg hover:bg-card-border/50 transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DriversTab({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (v: string) => void }) {
  const filtered = mockDrivers.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <SearchBar query={searchQuery} setQuery={setSearchQuery} placeholder="Buscar motoristas..." />
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background text-sm font-bold py-2 px-4 rounded-xl transition-all hover:scale-95">
          <UserPlus className="w-4 h-4" />
          Convidar motorista
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(d => (
          <motion.div
            key={d.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {d.name.charAt(0)}
                </div>
                <div>
                  <span className="font-medium text-white text-sm">{d.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusColors[d.status]}`}>
                      {d.status === "online" ? "Online" : d.status === "busy" ? "Em corrida" : "Offline"}
                    </span>
                    <span className="text-[10px] text-gray-500">★ {d.rating}</span>
                  </div>
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-card-border/50 transition-colors">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-1.5 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3" /> {d.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" /> {d.phone}
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-3 h-3" /> {d.vehicle || "Sem veículo"}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-card-border flex items-center justify-between">
              <span className="text-xs text-gray-500">Ganhos no mês</span>
              <span className="text-sm font-bold text-primary">R$ {d.earnings.toLocaleString("pt-BR")}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ShipmentsTab() {
  return (
    <div className="space-y-3">
      {mockShipments.map(s => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white">#{s.id.toUpperCase()}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[s.status]}`}>
                {s.status === "in_transit" ? "Em trânsito" : s.status === "pending" ? "Pendente" : s.status === "delivered" ? "Entregue" : "Cancelado"}
              </span>
            </div>
            <span className="text-sm font-bold text-primary">R$ {s.value.toLocaleString("pt-BR")}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-400 mb-2">
            <MapPin className="w-3 h-3 mt-0.5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div>{s.origin}</div>
              <div className="text-gray-500">→ {s.destination}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Motorista: {s.driver}</span>
            {s.eta !== "—" && <span>ETA: {s.eta}</span>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AnalyticsTab({ monthlyData, maxValue }: { monthlyData: { month: string; value: number }[]; maxValue: number }) {
  const total = monthlyData.reduce((acc, d) => acc + d.value, 0);
  const avg = Math.round(total / monthlyData.length);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <CircleDollarSign className="w-4 h-4 text-primary" />
            Total (6 meses)
          </div>
          <span className="text-2xl font-bold text-white">R$ {total.toLocaleString("pt-BR")}</span>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
            Média mensal
          </div>
          <span className="text-2xl font-bold text-white">R$ {avg.toLocaleString("pt-BR")}</span>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <CalendarDays className="w-4 h-4 text-info" />
            Projeção anual
          </div>
          <span className="text-2xl font-bold text-white">R$ {(avg * 12).toLocaleString("pt-BR")}</span>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-sm font-bold text-white mb-4">Gastos mensais</h3>
        <div className="flex items-end gap-3 h-48">
          {monthlyData.map(d => {
            const height = (d.value / maxValue) * 100;
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] text-gray-500">R${(d.value / 1000).toFixed(1)}k</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="w-full max-w-[40px] bg-primary rounded-t-lg relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary/50 rounded-t-lg" />
                </motion.div>
                <span className="text-[10px] text-gray-500">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InvoicesTab() {
  const invoices = [
    { id: "INV-001", date: "01/07/2026", value: 12500, status: "paid", description: "Corridas corporativas - Junho" },
    { id: "INV-002", date: "01/06/2026", value: 9800, status: "paid", description: "Entregas comerciais - Maio" },
    { id: "INV-003", date: "01/05/2026", value: 15200, status: "paid", description: "Fretes - Abril" },
    { id: "INV-004", date: "01/04/2026", value: 7400, status: "pending", description: "Corridas executivas - Março" },
  ];

  return (
    <div className="space-y-3">
      {invoices.map(inv => (
        <div key={inv.id} className="glass-panel p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-sm font-medium text-white">{inv.id}</span>
              <p className="text-xs text-gray-400">{inv.description}</p>
              <span className="text-[10px] text-gray-500">{inv.date}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-sm font-bold text-white">R$ {inv.value.toLocaleString("pt-BR")}</span>
              <div className={`text-[10px] font-medium ${inv.status === "paid" ? "text-success" : "text-warning"}`}>
                {inv.status === "paid" ? "Pago" : "Pendente"}
              </div>
            </div>
            <button className="p-2 rounded-lg hover:bg-card-border/50 transition-colors">
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function DepartmentsTab() {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const departments = [
    { id: "dept1", name: "Vendas", budget: 45000, spent: 32000, members: 12, color: "#3ECB8E" },
    { id: "dept2", name: "Logística", budget: 120000, spent: 85000, members: 8, color: "#8B5CF6" },
    { id: "dept3", name: "Marketing", budget: 35000, spent: 28000, members: 6, color: "#3B82F6" },
    { id: "dept4", name: "Operações", budget: 80000, spent: 45000, members: 15, color: "#F59E0B" },
    { id: "dept5", name: "Financeiro", budget: 30000, spent: 15000, members: 5, color: "#EC4899" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {departments.map(dept => {
        const pct = Math.round((dept.spent / dept.budget) * 100);
        return (
          <motion.div
            key={dept.id}
            whileHover={{ scale: 1.02 }}
            className="glass-panel p-4 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                <span className="text-sm font-medium text-white">{dept.name}</span>
              </div>
              <span className="text-xs text-gray-500">{dept.members} membros</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">R$ {dept.spent.toLocaleString("pt-BR")}</span>
              <span className="text-gray-500">de R$ {dept.budget.toLocaleString("pt-BR")}</span>
            </div>
            <div className="w-full h-2 bg-card-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: dept.color }}
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">{pct}% utilizado</span>
          </motion.div>
        );
      })}
    </div>
  );
}
