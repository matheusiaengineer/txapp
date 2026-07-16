"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Clock, Search, Filter, Shield,
  Camera, FileText, UserCheck, UserX, AlertTriangle,
  ChevronDown, X, ArrowLeft, ArrowRight, Percent
} from "lucide-react";

const mockVerifications = Array.from({ length: 24 }, (_, i) => ({
  id: `KYC-${String(i + 1).padStart(4, "0")}`,
  name: [
    "Ana Beatriz Santos", "Carlos Eduardo Lima", "Diana Ferreira Costa", "Eduardo Almeida Neto",
    "Fernanda Oliveira Souza", "Gabriel Torres Mendes", "Helena Martins Rocha", "Igor Barbosa Dias",
    "Julia Campos Teixeira", "Kevin Araújo Silva", "Larissa Nunes Pereira", "Marcelo Vieira Gomes",
    "Nathalia Ribeiro Carvalho", "Otávio Cardoso Freitas", "Patrícia Moreira Lopes",
    "Rafael Augusto Pinto", "Sabrina Castro Alves", "Thiago Henrique Barros",
    "Vanessa Duarte Monteiro", "William Santos Neves", "Roberta Campos Lima",
    "Fábio Oliveira Neto", "Cristiane Dias Santos", "André Luiz Pereira",
  ][i % 24],
  documentType: ["CNH", "RG", "CPF", "Passaporte"][i % 4],
  documentNumber: `${String(10000000000 + i * 1234).slice(0, 11)}`,
  status: ["pending", "pending", "pending", "approved", "rejected", "pending"][i % 6],
  submittedAt: new Date(2026, 6, 1 + i).toLocaleDateString("pt-BR"),
  reviewedAt: i % 6 === 3 ? "13/07/2026" : i % 6 === 4 ? "12/07/2026" : null,
  reason: i % 6 === 4 ? "Documento ilegível, favor enviar foto com melhor resolução" : null,
  progress: Math.min(100, 20 + i * 8),
}));

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function VerificationPanel() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof mockVerifications[0] | null>(null);

  useEffect(() => setMounted(true), []);

  const filtered = mockVerifications.filter((v) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.id.includes(search);
    const matchFilter = filter === "all" || v.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    pending: mockVerifications.filter((v) => v.status === "pending").length,
    approved: mockVerifications.filter((v) => v.status === "approved").length,
    rejected: mockVerifications.filter((v) => v.status === "rejected").length,
    total: mockVerifications.length,
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">

        <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Verificação KYC</h1>
            <p className="text-white/40 text-sm mt-1">{stats.pending} pendentes para revisão</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{stats.total}</p>
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-xs text-white/40 mt-1">Total de Solicitações</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-xs text-white/40 mt-1">Pendentes</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-emerald-400">{stats.approved}</p>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs text-white/40 mt-1">Aprovados</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-rose-400">{stats.rejected}</p>
              <XCircle className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-xs text-white/40 mt-1">Rejeitados</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou ID..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 placeholder-white/20 outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f ? "bg-white/[0.08] text-white border border-white/[0.1]" : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
              >
                {f === "all" ? "Todas" : f === "pending" ? "Pendentes" : f === "approved" ? "Aprovadas" : "Rejeitadas"}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="space-y-4">
          {filtered.map((v) => (
            <motion.div
              key={v.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 hover:border-white/[0.1] transition-all cursor-pointer"
              onClick={() => setSelected(v)}
            >
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold">
                        {v.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{v.name}</p>
                        <p className="text-xs text-white/40">{v.id}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium ${
                      v.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                      v.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                      "bg-rose-500/10 text-rose-400"
                    }`}>
                      {v.status === "pending" ? <Clock className="w-3 h-3" /> :
                       v.status === "approved" ? <CheckCircle className="w-3 h-3" /> :
                       <XCircle className="w-3 h-3" />}
                      {v.status === "pending" ? "Pendente" : v.status === "approved" ? "Aprovado" : "Rejeitado"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <FileText className="w-3 h-3" />
                      {v.documentType}: {v.documentNumber}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Clock className="w-3 h-3" />
                      Enviado: {v.submittedAt}
                    </div>
                  </div>

                  {v.reason && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {v.reason}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-24 h-16 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-white/[0.06] flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-400/50" />
                    </div>
                    <div className="w-24 h-16 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-white/[0.06] flex items-center justify-center">
                      <Camera className="w-6 h-6 text-purple-400/50" />
                    </div>
                  </div>
                  <p className="text-[10px] text-white/20">Documento × Selfie</p>
                </div>

                <div className="flex lg:flex-col items-center lg:items-stretch gap-2 lg:min-w-[140px]">
                  <div className="flex-1 flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${v.progress}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                      />
                    </div>
                    <span className="text-[10px] text-white/30 w-8 text-right">{v.progress}%</span>
                  </div>
                  {v.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors text-xs font-medium"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </motion.div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0d0d14] backdrop-blur-2xl p-6"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/70"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-lg font-bold">
                  {selected.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <p className="text-sm text-white/40">{selected.id}</p>
                </div>
                <div className="ml-auto">
                  <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium ${
                    selected.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                    selected.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-rose-500/10 text-rose-400"
                  }`}>
                    {selected.status === "pending" ? <Clock className="w-3 h-3" /> :
                     selected.status === "approved" ? <CheckCircle className="w-3 h-3" /> :
                     <XCircle className="w-3 h-3" />}
                    {selected.status === "pending" ? "Pendente" : selected.status === "approved" ? "Aprovado" : "Rejeitado"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Documento Enviado</h3>
                  <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-600/5 border border-white/[0.06] flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-blue-400/30 mx-auto mb-2" />
                      <p className="text-xs text-white/20">{selected.documentType} Preview</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-xs text-white/50">
                      <span className="text-white/30">Tipo:</span> {selected.documentType}<br />
                      <span className="text-white/30">Número:</span> {selected.documentNumber}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Selfie</h3>
                  <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-purple-500/5 to-purple-600/5 border border-white/[0.06] flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-purple-400/30 mx-auto mb-2" />
                      <p className="text-xs text-white/20">Selfie Preview</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <div className="flex items-center gap-2 text-xs text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Verifique se o rosto corresponde à foto do documento
                    </div>
                  </div>
                </div>
              </div>

              {selected.reason && (
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-rose-300">Motivo da Rejeição</p>
                      <p className="text-sm text-rose-200/70 mt-1">{selected.reason}</p>
                    </div>
                  </div>
                </div>
              )}

              {selected.status === "pending" && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-white/30 mb-2">Motivo (opcional para rejeição)</label>
                    <textarea
                      className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/60 placeholder-white/20 outline-none focus:border-white/[0.12] transition-colors resize-none h-20"
                      placeholder="Descreva o motivo da rejeição..."
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-medium">
                      <CheckCircle className="w-4 h-4" /> Aprovar
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors text-sm font-medium">
                      <XCircle className="w-4 h-4" /> Rejeitar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
