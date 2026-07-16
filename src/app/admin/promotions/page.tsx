"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift, Tag, Percent, Calendar, Plus, Edit, Trash2, Copy,
  CheckCircle, XCircle, Clock, Users, TrendingUp, DollarSign,
  Search, ChevronDown, X, BarChart3, Eye, ToggleLeft, ToggleRight
} from "lucide-react";

const mockPromotions = [
  { id: "PROMO-001", name: "Bem-vindo", code: "TXD10", type: "percentage", value: 10, maxUses: 1000, used: 342, expiry: "31/12/2026", active: true, category: "Todos" },
  { id: "PROMO-002", name: "Indique um Amigo", code: "INDICAR20", type: "fixed", value: 20, maxUses: 500, used: 127, expiry: "31/12/2026", active: true, category: "Corridas" },
  { id: "PROMO-003", name: "Frete Grátis", code: "FRETE20", type: "percentage", value: 100, maxUses: 200, used: 89, expiry: "30/09/2026", active: true, category: "Frete" },
  { id: "PROMO-004", name: "Off-Peak", code: "FORAHORA", type: "percentage", value: 15, maxUses: 2000, used: 1567, expiry: "31/10/2026", active: false, category: "Corridas" },
  { id: "PROMO-005", name: "VIP Black", code: "VIP2026", type: "fixed", value: 50, maxUses: 50, used: 23, expiry: "31/12/2026", active: true, category: "Black" },
];

const categories = ["Todas", "Corridas", "Frete", "Black", "Econômico", "VIP"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminPromotions() {
  const [mounted, setMounted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => setMounted(true), []);

  const filtered = mockPromotions.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search);
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const totalUses = mockPromotions.reduce((acc, p) => acc + p.used, 0);
  const avgRedemption = Math.round((totalUses / mockPromotions.reduce((acc, p) => acc + p.maxUses, 0)) * 100);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">

        <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Gerenciar Promoções</h1>
            <p className="text-white/40 text-sm mt-1">{mockPromotions.length} promoções cadastradas</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/20 text-rose-300 hover:from-rose-500/30 hover:to-pink-500/30 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Nova Promoção
          </motion.button>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{mockPromotions.filter(p => p.active).length}</p>
              <Gift className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-xs text-white/40 mt-1">Promoções Ativas</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{totalUses.toLocaleString()}</p>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-xs text-white/40 mt-1">Total de Usos</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{avgRedemption}%</p>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs text-white/40 mt-1">Taxa de Resgate</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">R$ 12.450</p>
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-xs text-white/40 mt-1">Descontos Concedidos</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar promoção ou código..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 placeholder-white/20 outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>
          <select
            value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/60 outline-none focus:border-white/[0.12] transition-colors appearance-none cursor-pointer"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </motion.div>

        <motion.div variants={item} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-white/30 text-xs uppercase">
                  <th className="text-left py-3.5 px-4 font-medium">Promoção</th>
                  <th className="text-left py-3.5 px-4 font-medium">Código</th>
                  <th className="text-left py-3.5 px-4 font-medium">Desconto</th>
                  <th className="text-left py-3.5 px-4 font-medium">Usos</th>
                  <th className="text-left py-3.5 px-4 font-medium">Expira</th>
                  <th className="text-left py-3.5 px-4 font-medium">Status</th>
                  <th className="text-right py-3.5 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((promo) => (
                  <motion.tr
                    key={promo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
                          <Tag className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                          <p className="font-medium">{promo.name}</p>
                          <p className="text-[10px] text-white/30">{promo.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-amber-300">
                        {promo.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1">
                        {promo.type === "percentage" ? <Percent className="w-3 h-3 text-emerald-400" /> : <DollarSign className="w-3 h-3 text-blue-400" />}
                        {promo.type === "percentage" ? `${promo.value}%` : `R$ ${promo.value},00`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                            style={{ width: `${(promo.used / promo.maxUses) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-white/40">{promo.used}/{promo.maxUses}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-white/40">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> {promo.expiry}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button className={`flex items-center gap-1.5 text-xs font-medium ${
                        promo.active ? "text-emerald-400" : "text-white/30"
                      }`}>
                        {promo.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {promo.active ? "Ativa" : "Inativa"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/70">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/70">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors text-rose-400/50 hover:text-rose-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0d0d14] backdrop-blur-2xl p-6"
            >
              <button
                onClick={() => setShowCreate(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/70"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Criar Nova Promoção</h2>
                  <p className="text-sm text-white/40">Configure os detalhes da campanha</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/30 mb-2">Nome da Promoção</label>
                    <input type="text" placeholder="Ex: Bem-vindo"
                      className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 placeholder-white/20 outline-none focus:border-white/[0.12] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/30 mb-2">Código do Cupom</label>
                    <input type="text" placeholder="Ex: TXD10"
                      className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 placeholder-white/20 outline-none focus:border-white/[0.12] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/30 mb-2">Tipo de Desconto</label>
                    <select className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/60 outline-none focus:border-white/[0.12] transition-colors appearance-none cursor-pointer">
                      <option>Porcentagem (%)</option>
                      <option>Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/30 mb-2">Valor do Desconto</label>
                    <input type="number" placeholder="10"
                      className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 placeholder-white/20 outline-none focus:border-white/[0.12] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/30 mb-2">Usos Máximos</label>
                    <input type="number" placeholder="1000"
                      className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 placeholder-white/20 outline-none focus:border-white/[0.12] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/30 mb-2">Data de Expiração</label>
                    <input type="date"
                      className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 outline-none focus:border-white/[0.12] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/30 mb-2">Categorias Aplicáveis</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.filter(c => c !== "Todas").map((cat) => (
                      <label key={cat} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-colors">
                        <input type="checkbox" className="rounded border-white/20 text-rose-500 focus:ring-rose-500/30 bg-white/[0.04]" />
                        <span className="text-xs text-white/60">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/30 mb-2">Agendar Campanha</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-white/20 mb-1">Início</label>
                      <input type="date"
                        className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 outline-none focus:border-white/[0.12] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/20 mb-1">Término</label>
                      <input type="date"
                        className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 outline-none focus:border-white/[0.12] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/20 text-rose-300 hover:from-rose-500/30 hover:to-pink-500/30 transition-all text-sm font-medium"
                  >
                    Criar Promoção
                  </motion.button>
                  <button onClick={() => setShowCreate(false)}
                    className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
