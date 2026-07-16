"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Languages, Search, Save, Download, Upload, CheckCircle,
  XCircle, ChevronDown, Globe, Edit, FileText, Plus, RefreshCw
} from "lucide-react";

const languages = [
  { code: "pt-BR", name: "Português (Brasil)" },
  { code: "en", name: "English (US)" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "ja", name: "日本語" },
  { code: "zh", name: "中文" },
];

const initialTranslations: Record<string, Record<string, string>> = {
  "pt-BR": {
    "app.name": "TXD",
    "app.tagline": "Sua corrida, sua escolha",
    "auth.login.title": "Entrar",
    "auth.login.email": "Email",
    "auth.login.password": "Senha",
    "auth.login.forgot": "Esqueceu a senha?",
    "auth.login.button": "Entrar",
    "auth.register.title": "Criar Conta",
    "auth.register.name": "Nome completo",
    "auth.register.phone": "Telefone",
    "auth.register.document": "CPF",
    "auth.register.button": "Cadastrar",
    "home.title": "Para onde vamos?",
    "home.destination": "Digite seu destino",
    "home.recent": "Destinos recentes",
    "ride.request": "Solicitar corrida",
    "ride.searching": "Buscando motorista...",
    "ride.accepted": "Motorista a caminho",
    "ride.arriving": "Motorista chegando",
    "ride.in_progress": "Em viagem",
    "ride.completed": "Viagem concluída",
    "ride.cancelled": "Viagem cancelada",
    "ride.cancel": "Cancelar corrida",
    "payment.method": "Forma de pagamento",
    "payment.card": "Cartao de credito",
    "payment.cash": "Dinheiro",
    "payment.wallet": "Carteira TXD",
    "payment.pix": "PIX",
    "profile.title": "Meu Perfil",
    "profile.payments": "Pagamentos",
    "profile.history": "Historico",
    "profile.settings": "Configuracoes",
    "profile.support": "Suporte",
    "common.save": "Salvar",
    "common.cancel": "Cancelar",
    "common.delete": "Excluir",
    "common.edit": "Editar",
    "common.loading": "Carregando...",
    "common.error": "Erro",
    "common.success": "Sucesso",
    "common.confirm": "Confirmar",
    "common.search": "Pesquisar",
    "common.filter": "Filtrar",
    "common.no_results": "Nenhum resultado encontrado",
  },
  "en": {
    "app.name": "TXD",
    "app.tagline": "Your ride, your choice",
    "auth.login.title": "Sign In",
    "auth.login.email": "Email",
    "auth.login.password": "Password",
    "auth.login.forgot": "Forgot password?",
    "auth.login.button": "Sign In",
    "auth.register.title": "Create Account",
    "auth.register.name": "Full name",
    "auth.register.phone": "Phone",
    "auth.register.document": "ID Document",
    "auth.register.button": "Register",
    "home.title": "Where to?",
    "home.destination": "Enter your destination",
    "home.recent": "Recent destinations",
    "ride.request": "Request a ride",
    "ride.searching": "Searching for driver...",
    "ride.accepted": "Driver on the way",
    "ride.arriving": "Driver arriving",
    "ride.in_progress": "On trip",
    "ride.completed": "Trip completed",
    "ride.cancelled": "Trip cancelled",
    "ride.cancel": "Cancel ride",
    "payment.method": "Payment method",
    "payment.card": "Credit card",
    "payment.cash": "Cash",
    "payment.wallet": "TXD Wallet",
    "payment.pix": "PIX",
    "profile.title": "My Profile",
    "profile.payments": "Payments",
    "profile.history": "History",
    "profile.settings": "Settings",
    "profile.support": "Support",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.confirm": "Confirm",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.no_results": "No results found",
  },
  "es": {
    "app.name": "TXD",
    "app.tagline": "Tu viaje, tu eleccion",
    "auth.login.title": "Iniciar Sesion",
    "auth.login.email": "Correo",
    "auth.login.password": "Contrasena",
    "auth.login.forgot": "Olvidaste tu contrasena?",
    "auth.login.button": "Entrar",
    "auth.register.title": "Crear Cuenta",
    "auth.register.name": "Nombre completo",
    "auth.register.phone": "Telefono",
    "auth.register.document": "Documento",
    "auth.register.button": "Registrarse",
    "home.title": "A donde vamos?",
    "home.destination": "Ingresa tu destino",
    "home.recent": "Destinos recientes",
    "ride.request": "Solicitar viaje",
    "ride.searching": "Buscando conductor...",
    "ride.accepted": "Conductor en camino",
    "ride.arriving": "Conductor llegando",
    "ride.in_progress": "En viaje",
    "ride.completed": "Viaje completado",
    "ride.cancelled": "Viaje cancelado",
    "ride.cancel": "Cancelar viaje",
    "payment.method": "Metodo de pago",
    "payment.card": "Tarjeta de credito",
    "payment.cash": "Efectivo",
    "payment.wallet": "Billetera TXD",
    "payment.pix": "PIX",
    "profile.title": "Mi Perfil",
    "profile.payments": "Pagos",
    "profile.history": "Historial",
    "profile.settings": "Configuracion",
    "profile.support": "Soporte",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.success": "Exito",
    "common.confirm": "Confirmar",
    "common.search": "Buscar",
    "common.filter": "Filtrar",
    "common.no_results": "Sin resultados",
  },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminTranslations() {
  const [mounted, setMounted] = useState(false);
  const [selectedLang, setSelectedLang] = useState("pt-BR");
  const [searchKey, setSearchKey] = useState("");
  const [translations, setTranslations] = useState(initialTranslations);
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => setMounted(true), []);

  const currentTranslations = translations[selectedLang] || {};
  const filteredKeys = Object.keys(currentTranslations).filter((key) =>
    key.toLowerCase().includes(searchKey.toLowerCase()) ||
    currentTranslations[key].toLowerCase().includes(searchKey.toLowerCase())
  );

  const updateTranslation = (key: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [selectedLang]: { ...prev[selectedLang], [key]: value },
    }));
  };

  const handleSave = (key: string) => {
    setSaved((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 1500);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(translations[selectedLang], null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "translations-{selectedLang}.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        setTranslations((prev) => ({
          ...prev,
          [selectedLang]: { ...prev[selectedLang], ...data },
        }));
      } catch {}
    };
    input.click();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">

        <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Editor de Traducoes</h1>
            <p className="text-white/40 text-sm mt-1">{languages.length} idiomas - {Object.keys(currentTranslations).length} chaves</p>
          </div>
          <div className="flex gap-2">
            <button onClick={importJSON}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60 hover:text-white/80 transition-colors text-sm"
            >
              <Upload className="w-4 h-4" /> Importar
            </button>
            <button onClick={exportJSON}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60 hover:text-white/80 transition-colors text-sm"
            >
              <Download className="w-4 h-4" /> Exportar
            </button>
          </div>
        </motion.div>

        <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text" value={searchKey} onChange={(e) => setSearchKey(e.target.value)}
              placeholder="Buscar chave ou valor..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 placeholder-white/20 outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
            <select
              value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)}
              className="pl-9 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 outline-none focus:border-white/[0.12] transition-colors appearance-none cursor-pointer min-w-[200px]"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
          </div>
        </motion.div>

        <motion.div variants={item} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-3">
            <div className="grid grid-cols-[1fr,2fr,auto] gap-4 text-xs text-white/30 uppercase font-medium">
              <span>Chave</span>
              <span>Valor ({languages.find(l => l.code === selectedLang)?.name})</span>
              <span className="w-20 text-right">Acao</span>
            </div>
          </div>

          <div className="divide-y divide-white/[0.03] max-h-[500px] overflow-y-auto">
            {filteredKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/20">
                <Languages className="w-12 h-12 mb-3" />
                <p className="text-sm">Nenhuma chave encontrada</p>
              </div>
            ) : (
              filteredKeys.map((key) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-[1fr,2fr,auto] gap-4 items-center px-5 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div>
                    <p className="text-xs font-mono text-white/60 truncate" title={key}>{key}</p>
                    <p className="text-[10px] text-white/20 mt-0.5">pt-BR: {initialTranslations["pt-BR"]?.[key] || "—"}</p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={currentTranslations[key] || ""}
                      onChange={(e) => updateTranslation(key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 outline-none focus:border-white/[0.12] transition-colors"
                    />
                    {saved[key] && (
                      <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave(key)}
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
