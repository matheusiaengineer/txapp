"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight, Eye,
  UserCheck, UserX, Mail, Phone, Calendar, Shield,
  CreditCard, X, Download, Loader2,
  CheckCircle, XCircle, Clock, Star, Route
} from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  language: string;
  country: string;
  status: string;
  joinDate: string;
  totalTrips: number;
  documentsCount: number;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, role: roleFilter, page: String(page), perPage: "10" });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, roleFilter]);
  useEffect(() => { setPage(1); }, [search]);

  const debouncedSearch = search;
  useEffect(() => {
    if (!debouncedSearch) return;
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [debouncedSearch]);

  function handleSearch(val: string) {
    setSearch(val);
  }

  const roleLabel: Record<string, string> = { admin: "Admin", driver: "Motorista", passenger: "Passageiro", company: "Empresa", transporter: "Transportador" };
  const statusLabel: Record<string, string> = { active: "Ativo", pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado" };
  const statusColor: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-400",
    pending: "text-amber-400 bg-amber-400",
    approved: "text-emerald-400 bg-emerald-400",
    rejected: "text-rose-400 bg-rose-400",
    inactive: "text-white/30 bg-white/20",
  };
  const roleColor: Record<string, string> = {
    admin: "bg-purple-500/10 text-purple-400",
    driver: "bg-emerald-500/10 text-emerald-400",
    passenger: "bg-blue-500/10 text-blue-400",
    company: "bg-amber-500/10 text-amber-400",
    transporter: "bg-violet-500/10 text-violet-400",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">

        <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Gerenciar Usuários</h1>
            <p className="text-white/40 text-sm mt-1">{total} usuários encontrados</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text" value={search} onChange={(e) => handleSearch(e.target.value)}
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
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : (
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
                  {users.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-white/30">Nenhum usuário encontrado</td></tr>
                  ) : (
                    users.map((user) => (
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
                              <p className="text-[10px] text-white/30">{user.id?.slice(0, 8)}</p>
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
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${roleColor[user.role] || "bg-white/[0.04] text-white/50"}`}>
                            {roleLabel[user.role] || user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`flex items-center gap-1.5 text-xs ${statusColor[user.status]?.split(" ")[0] || "text-white/50"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColor[user.status]?.split(" ")[1] || "bg-white/30"}`} />
                            {statusLabel[user.status] || user.status}
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
                    ))
                  )}
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
        )}

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
                  <p className="text-sm text-white/40">{selectedUser.id?.slice(0, 8)}</p>
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
                      <span className="text-white/70">{roleLabel[selectedUser.role] || selectedUser.role}</span>
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
                    {selectedUser.role === "driver" && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-white/20" />
                          <span className="text-white/70">Documentos</span>
                        </div>
                        <span className="font-semibold">{selectedUser.documentsCount}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-white/20" />
                        <span className="text-white/70">Status</span>
                      </div>
                      <span className={`font-semibold ${statusColor[selectedUser.status]?.split(" ")[0] || ""}`}>
                        {statusLabel[selectedUser.status] || selectedUser.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedUser.role === "driver" && (
                  selectedUser.status === "pending" ? (
                    <>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm">
                        <CheckCircle className="w-4 h-4" /> Aprovar
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors text-sm">
                        <XCircle className="w-4 h-4" /> Rejeitar
                      </button>
                    </>
                  ) : null
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
