"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, BarChart3, MessageSquare, Smartphone, Mail, Target, Calendar } from "lucide-react";

const SEGMENTS = [
  { id: "inactive_30d", label: "Inativos 30 dias" },
  { id: "vip", label: "VIPs (top 10%)" },
  { id: "new", label: "Novos (1ª compra)" },
  { id: "birthday", label: "Aniversariantes" },
];

const CHANNELS = [
  { id: "sms", label: "SMS", icon: Smartphone, cost: "R$ 0,09/msg" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, cost: "R$ 0,05/msg" },
  { id: "email", label: "Email", icon: Mail, cost: "Grátis" },
];

export default function CompanyCampaignsPage() {
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [newCampaign, setNewCampaign] = useState({
    name: "", segment: "inactive_30d", channel: "whatsapp", template: "", coupon_code: "", scheduled_at: "",
  });

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/company/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/company/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCampaign),
      });
      if (res.ok) {
        setShowNew(false);
        setNewCampaign({ name: "", segment: "inactive_30d", channel: "whatsapp", template: "", coupon_code: "", scheduled_at: "" });
        fetchCampaigns();
      }
    } catch {}
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold">Remarketing</h1>
            <button onClick={() => setShowNew(true)}
              className="bg-primary hover:bg-primary-hover text-background text-xs font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[0.98] flex items-center gap-1 shrink-0">
              <Plus className="w-4 h-4" /> Nova Campanha
            </button>
          </div>
          <p className="text-sm text-gray-400">Crie campanhas para recuperar clientes</p>
        </motion.div>

        <AnimatePresence>
          {showNew && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Nova Campanha</h2>
                <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-xl transition-all text-sm">Cancelar</button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Nome da campanha</label>
                <input type="text" value={newCampaign.name} onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Recuperação inativos"
                  className="bg-background border border-card-border rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Segmento</label>
                <div className="grid grid-cols-2 gap-2">
                  {SEGMENTS.map(s => (
                    <button key={s.id} onClick={() => setNewCampaign(p => ({ ...p, segment: s.id }))}
                      className={`p-3 rounded-xl text-xs font-medium text-left transition-all ${
                        newCampaign.segment === s.id ? "bg-primary/15 border border-primary/30 text-primary" : "bg-background border border-card-border text-gray-400"
                      }`}>
                      <Target className="w-4 h-4 mb-1" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Canal</label>
                <div className="grid grid-cols-3 gap-2">
                  {CHANNELS.map(ch => {
                    const Icon = ch.icon;
                    return (
                      <button key={ch.id} onClick={() => setNewCampaign(p => ({ ...p, channel: ch.id }))}
                        className={`p-3 rounded-xl text-center transition-all ${
                          newCampaign.channel === ch.id ? "bg-primary/15 border border-primary/30 text-primary" : "bg-background border border-card-border text-gray-400"
                        }`}>
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">{ch.label}</span>
                        <span className="text-[10px] block opacity-60">{ch.cost}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Template da mensagem</label>
                <textarea value={newCampaign.template} onChange={e => setNewCampaign(p => ({ ...p, template: e.target.value }))}
                  placeholder="Olá {{nome}}, sentimos sua falta! Use o cupom {{cupom}} e ganhe 10% OFF na sua próxima compra."
                  className="bg-background border border-card-border rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors min-h-[100px] resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Cupom (opcional)</label>
                  <input type="text" value={newCampaign.coupon_code} onChange={e => setNewCampaign(p => ({ ...p, coupon_code: e.target.value }))}
                    placeholder="CUPOM10"
                    className="bg-background border border-card-border rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Agendar (opcional)</label>
                  <input type="date" value={newCampaign.scheduled_at} onChange={e => setNewCampaign(p => ({ ...p, scheduled_at: e.target.value }))}
                    className="bg-background border border-card-border rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors" />
                </div>
              </div>

              <button onClick={handleCreate}
                className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all hover:scale-[0.98]">
                Criar Campanha
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-3">{Array.from({length:3}).map((_,i) => (
            <div key={i} className="glass-panel p-5 animate-pulse"><div className="h-4 bg-white/10 rounded w-3/4 mb-2" /><div className="h-3 bg-white/5 rounded w-1/2" /></div>
          ))}</div>
        ) : (
          <div className="space-y-3">
            {campaigns.length === 0 && (
              <div className="glass-panel p-8 text-center text-sm text-gray-500">Nenhuma campanha criada ainda</div>
            )}
            {campaigns.map((campaign: any) => (
              <motion.div key={campaign.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-panel p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        {campaign.channel === "whatsapp" ? <MessageSquare className="w-3 h-3" /> :
                         campaign.channel === "sms" ? <Smartphone className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        {campaign.channel}
                      </span>
                      <span>·</span>
                      <span>{SEGMENTS.find((s: any) => s.id === campaign.segment)?.label || campaign.segment}</span>
                      {campaign.scheduled_at && (
                        <><span>·</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(campaign.scheduled_at).toLocaleDateString("pt-BR")}</span></>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    campaign.sent_at ? "bg-primary/15 text-primary" :
                    campaign.scheduled_at ? "bg-yellow-400/15 text-yellow-400" :
                    "bg-gray-400/15 text-gray-400"
                  }`}>{campaign.sent_at ? "Enviada" : campaign.scheduled_at ? "Agendada" : "Rascunho"}</span>
                </div>

                {campaign.stats?.sentCount > 0 && (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-background rounded-xl p-3">
                      <p className="text-lg font-bold text-primary">{campaign.stats.sentCount}</p>
                      <p className="text-xs text-gray-500">Enviadas</p>
                    </div>
                    <div className="bg-background rounded-xl p-3">
                      <p className="text-lg font-bold text-primary">{campaign.stats.openRate || 0}%</p>
                      <p className="text-xs text-gray-500">Taxa de abertura</p>
                    </div>
                  </div>
                )}

                {!campaign.sent_at && !campaign.scheduled_at && (
                  <button className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all hover:scale-[0.98] text-xs flex items-center justify-center gap-1">
                    <Send className="w-3 h-3" /> Enviar agora
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
