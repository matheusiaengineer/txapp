"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, BarChart3, MessageSquare, Smartphone, Mail, Target, Tag, Calendar, Check, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Campaign {
  id: number;
  name: string;
  segment: string;
  channel: string;
  status: "draft" | "scheduled" | "sent";
  sentCount: number;
  openRate: number;
  scheduledAt: string;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, name: "Inativos 30 dias - Cupom 10%", segment: "inactive_30d", channel: "whatsapp", status: "sent", sentCount: 45, openRate: 68, scheduledAt: "15/07" },
  { id: 2, name: "VIPs - Lançamento novo produto", segment: "vip", channel: "email", status: "scheduled", sentCount: 0, openRate: 0, scheduledAt: "20/07" },
  { id: 3, name: "Aniversariantes Julho", segment: "birthday", channel: "sms", status: "draft", sentCount: 0, openRate: 0, scheduledAt: "" },
];

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
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [newCampaign, setNewCampaign] = useState({
    name: "", segment: "inactive_30d", channel: "whatsapp", template: "", coupon: "", schedule: "",
  });

  const handleCreate = () => {
    const c: Campaign = {
      id: campaigns.length + 1,
      name: newCampaign.name || "Campanha sem nome",
      segment: newCampaign.segment,
      channel: newCampaign.channel,
      status: newCampaign.schedule ? "scheduled" : "draft",
      sentCount: 0, openRate: 0,
      scheduledAt: newCampaign.schedule || "",
    };
    setCampaigns(prev => [c, ...prev]);
    setShowNew(false);
    setNewCampaign({ name: "", segment: "inactive_30d", channel: "whatsapp", template: "", coupon: "", schedule: "" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold">Remarketing</h1>
            <button onClick={() => setShowNew(true)}
              className="bg-primary hover:bg-primary-hover text-background text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 transition-all">
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
                <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-white text-sm">Cancelar</button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Nome da campanha</label>
                <input type="text" value={newCampaign.name} onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Recuperação inativos"
                  className="bg-background border border-card-border rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors" />
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
                        <span className="text-[8px] block opacity-60">{ch.cost}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400">Template da mensagem</label>
                <textarea value={newCampaign.template} onChange={e => setNewCampaign(p => ({ ...p, template: e.target.value }))}
                  placeholder="Olá {{nome}}, sentimos sua falta! Use o cupom {{cupom}} e ganhe 10% OFF na sua próxima compra."
                  className="bg-background border border-card-border rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors min-h-[100px] resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Cupom (opcional)</label>
                  <input type="text" value={newCampaign.coupon} onChange={e => setNewCampaign(p => ({ ...p, coupon: e.target.value }))}
                    placeholder="CUPOM10"
                    className="bg-background border border-card-border rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Agendar (opcional)</label>
                  <input type="date" value={newCampaign.schedule} onChange={e => setNewCampaign(p => ({ ...p, schedule: e.target.value }))}
                    className="bg-background border border-card-border rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors" />
                </div>
              </div>

              <button onClick={handleCreate}
                className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl transition-all hover:scale-[0.98]">
                Criar Campanha
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {campaigns.map(campaign => (
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
                    <span>{SEGMENTS.find(s => s.id === campaign.segment)?.label || campaign.segment}</span>
                    {campaign.scheduledAt && (
                      <><span>·</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{campaign.scheduledAt}</span></>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  campaign.status === "sent" ? "bg-primary/15 text-primary" :
                  campaign.status === "scheduled" ? "bg-yellow-400/15 text-yellow-400" :
                  "bg-gray-400/15 text-gray-400"
                }`}>{campaign.status === "sent" ? "Enviada" : campaign.status === "scheduled" ? "Agendada" : "Rascunho"}</span>
              </div>

              {campaign.status === "sent" && (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-background rounded-xl p-3">
                    <p className="text-lg font-bold text-primary">{campaign.sentCount}</p>
                    <p className="text-[10px] text-gray-500">Enviadas</p>
                  </div>
                  <div className="bg-background rounded-xl p-3">
                    <p className="text-lg font-bold text-primary">{campaign.openRate}%</p>
                    <p className="text-[10px] text-gray-500">Taxa de abertura</p>
                  </div>
                </div>
              )}

              {campaign.status === "draft" && (
                <button className="w-full py-2 bg-primary text-background text-xs font-bold rounded-xl flex items-center justify-center gap-1 hover:bg-primary-hover transition-all">
                  <Send className="w-3 h-3" /> Enviar agora
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
