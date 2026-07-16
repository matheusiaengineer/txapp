"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Eye,
  UserCheck, UserX, Mail, Phone, Calendar, Shield, MapPin,
  Car, CreditCard, X, Download, ArrowUpDown, MoreHorizontal,
  CheckCircle, XCircle, Clock, Star, Route
} from "lucide-react";

const mockUsers = Array.from({ length: 50 }, (_, i) => ({
  id: `USR-${String(i + 1).padStart(4, "0")}`,
  name: [
    "Ana Beatriz Santos", "Carlos Eduardo Lima", "Diana Ferreira Costa", "Eduardo Almeida Neto",
    "Fernanda Oliveira Souza", "Gabriel Torres Mendes", "Helena Martins Rocha", "Igor Barbosa Dias",
    "Julia Campos Teixeira", "Kevin Araújo Silva", "Larissa Nunes Pereira", "Marcelo Vieira Gomes",
    "Nathalia Ribeiro Carvalho", "Otávio Cardoso Freitas", "Patrícia Moreira Lopes",
    "Rafael Augusto Pinto", "Sabrina Castro Alves", "Thiago Henrique Barros",
    "Vanessa Duarte Monteiro", "William Santos Neves",
  ][i % 20],
  email: [
    "ana.santos@email.com", "carlos.lima@email.com", "diana.ferreira@email.com",
    "eduardo.neto@email.com", "fernanda.souza@email.com", "gabriel.mendes@email.com",
    "helena.rocha@email.com", "igor.dias@email.com", "julia.campos@email.com",
    "kevin.silva@email.com", "larissa.pereira@email.com", "marcelo.gomes@email.com",
    "nathalia.carvalho@email.com", "otavio.freitas@email.com", "patricia.lopes@email.com",
    "rafael.pinto@email.com", "sabrina.alves@email.com", "thiago.barros@email.com",
    "vanessa.monteiro@email.com", "william.neves@email.com",
  ][i % 20],
  phone: `(21) 9${String(8000 + i).padStart(4, "0")}-${String(i * 23).padStart(4, "0").slice(0, 4)}`,
  role: i < 5 ? "admin" : i < 15 ? "driver" : "passenger",
  status: ["active", "active", "active", "blocked", "pending", "active", "active", "inactive"][i % 8],
  joinDate: new Date(2026, 0, 1 + i).toLocaleDateString("pt-BR"),
  avatar: null,
  document: `***.${String(i).padStart(3, "0")}.***-${String(i * 7).slice(0, 2)}`,
  totalTrips: Math.floor(Math.random() * 500),
  totalSpent: Math.floor(Math.random() * 15000) / 100,
  rating: (3.5 + Math.random() * 1.5).toFixed(1),
}));

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminUsers() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const perPage = 10;

  useEffect(() => setMounted(true), []);

  const filtered = mockUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">

        <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Gerenciar Usuários</h1>
            <p className="text-white/40 text-sm mt-1">{filtered.length} usuários encontrados</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-all">
              <Download className="w-4 h-4" /> Exportar
            </button>
          </div>
        </motion.div>

        <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nome ou email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 placeholder-white/20 outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>
          <select
            value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/60 outline-none focus:border-white/[0.12] transition-colors appearance-none cursor-pointer"
          >
            <option value="all">Todos os perfis</option>
            <option value="passenger">Passageiros</option>
            <option value="driver">Motoristas</option>
            <option value="admin">Administradores</option>
          </select>
          <select
            value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/60 outline-none focus:border-white/[0.12] transition-colors appearance-none cursor-pointer"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="blocked">Bloqueado</option>
            <option value="pending">Pendente</option>
          </select>
        </motion.div>

        <motion.div variants={item} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-white/30 text-xs uppercase">
                  <th className="text-left py-3.5 px-4 font-medium">Usuário</th>
                  <th className="text-left py-3.5 px-4 font-medium">Contato</th>
                  <th className="text-left py-3.5 px-4 font-medium">Perfil</th>
                  <th className="text-left py-3.5 px-4 font-medium">Status</th>
                  <th className="text-left py-3.5 px-4 font-medium">Entrada</th>
                  <th className="text-right py-3.5 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold shrink-0">
                          {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-[10px] text-white/30">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-white/50">
                          <Mail className="w-3 h-3" /> {user.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                          <Phone className="w-3 h-3" /> {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                        user.role === "admin" ? "bg-purple-500/10 text-purple-400" :
                        user.role === "driver" ? "bg-emerald-500/10 text-emerald-400" :
                        "bg-blue-500/10 text-blue-400"
                      }`}>
                        {user.role === "admin" ? "Admin" : user.role === "driver" ? "Motorista" : "Passageiro"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center gap-1.5 text-xs ${
                        user.status === "active" ? "text-emerald-400" :
                        user.status === "inactive" ? "text-white/30" :
                        user.status === "blocked" ? "text-rose-400" : "text-amber-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.status === "active" ? "bg-emerald-400" :
                          user.status === "inactive" ? "bg-white/20" :
                          user.status === "blocked" ? "bg-rose-400" : "bg-amber-400"
                        }`} />
                        {user.status === "active" ? "Ativo" : user.status === "inactive" ? "Inativo" : user.status === "blocked" ? "Bloqueado" : "Pendente"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/40 text-xs">{user.joinDate}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/70"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-white/[0.06]">
            <p className="text-xs text-white/30">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors disabled:opacity-30 text-white/40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p) => (
                <button
                  key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    p === page ? "bg-white/[0.08] text-white" : "text-white/30 hover:bg-white/[0.04] hover:text-white/60"
                  }`}
                >{p}</button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors disabled:opacity-30 text-white/40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

      </motion.div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUser(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0d0d14] backdrop-blur-2xl p-6"
            >
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/70"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-lg font-bold">
                  {selectedUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedUser.name}</h2>
                  <p className="text-sm text-white/40">{selectedUser.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                  <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Informações</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-white/20" />
                      <span className="text-white/70">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-white/20" />
                      <span className="text-white/70">{selectedUser.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-white/20" />
                      <span className="text-white/70">Entrou em {selectedUser.joinDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-white/20" />
                      <span className="text-white/70">{selectedUser.document}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                  <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Atividade</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Route className="w-3.5 h-3.5 text-white/20" />
                        <span className="text-white/70">Total de Viagens</span>
                      </div>
                      <span className="font-semibold">{selectedUser.totalTrips}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-white/20" />
                        <span className="text-white/70">Total Gasto</span>
                      </div>
                      <span className="font-semibold">R$ {selectedUser.totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-white/20" />
                        <span className="text-white/70">Avaliação</span>
                      </div>
                      <span className="font-semibold">
                        {selectedUser.role === "driver" ? selectedUser.rating : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedUser.status === "blocked" ? (
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm">
                    <UserCheck className="w-4 h-4" /> Desbloquear
                  </button>
                ) : (
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors text-sm">
                    <UserX className="w-4 h-4" /> Bloquear
                  </button>
                )}
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60 hover:text-white/80 transition-colors text-sm">
                  <Eye className="w-4 h-4" /> Ver Histórico
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
