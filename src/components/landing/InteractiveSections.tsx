"use client";

import { useState, lazy, Suspense } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useAuth } from "./auth-context";
import { RippleButton } from "@/components/ui/ripple-button";
import { LiveIndicator } from "@/components/ui/live-indicator";

const TxdMap = lazy(() => import("@/components/txd/txd-map"));

/* ── Benefits Tabs ── */

const benefitsData: Record<string, { icon: IconName; title: string; desc: string }[]> = {
  passenger: [
    { icon: "shield", title: "Segurança", desc: "Motoristas verificados e viagens monitoradas em tempo real" },
    { icon: "zap", title: "Rapidez", desc: "Motorista aceita em menos de 3 segundos" },
    { icon: "dollar-sign", title: "Preço competitivo", desc: "Taxas justas sem surpresas" },
    { icon: "navigation", title: "Rastreamento", desc: "Acompanhe cada curva da sua viagem" },
    { icon: "credit-card", title: "Pagamento digital", desc: "PIX, cartão e carteira digital" },
    { icon: "headphones", title: "Suporte 24/7", desc: "Equipe pronta para ajudar" },
  ],
  driver: [
    { icon: "trending-up", title: "Comissão transparente", desc: "Você sabe exatamente quanto ganha por corrida" },
    { icon: "dollar-sign", title: "Ganhos diários", desc: "Receba todo dia sem burocracia" },
    { icon: "zap", title: "Pagamentos rápidos", desc: "Saque via PIX 24 horas por dia" },
    { icon: "map", title: "Escolha das corridas", desc: "Aceite ou recuse sem penalidades" },
    { icon: "clock", title: "Histórico completo", desc: "Todos os ganhos e rotas registrados" },
    { icon: "wallet", title: "Carteira digital", desc: "Saldo disponível para saque imediato" },
  ],
  company: [
    { icon: "building-2", title: "Painel administrativo", desc: "Gerencie entregas em tempo real" },
    { icon: "users", title: "Gestão de funcionários", desc: "Cadastre equipes e defina limites" },
    { icon: "trending-up", title: "Relatórios", desc: "Métricas detalhadas de desempenho" },
    { icon: "dollar-sign", title: "Faturamento", desc: "Controle de custos por departamento" },
    { icon: "briefcase", title: "Contratos recorrentes", desc: "Fretes programados e parcerias" },
    { icon: "shield", title: "Compliance", desc: "Notas fiscais e conformidade LGPD" },
  ],
};

export function BenefitsSection() {
  const [tab, setTab] = useState("passenger");
  const items = benefitsData[tab];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex bg-white/5 rounded-2xl p-1.5 mb-10 max-w-md mx-auto">
        {[ { id: "passenger", label: "Passageiro" }, { id: "driver", label: "Motorista" }, { id: "company", label: "Empresa" } ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${tab === t.id ? "bg-primary text-black" : "text-gray-400"}`}>
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {items.map((b, i) => (
          <div key={i} className="txd-card p-4 md:p-5 txd-card-hover transition-all">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
              <Icon name={b.icon} size={20} className="text-primary" />
            </div>
            <h3 className="font-semibold mb-1 text-sm">{b.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Live Drivers ── */

const liveDrivers = [
  { name: "Carlos M.", status: "Estou disponível no Centro", time: "agora", dist: "800m", emoji: "🚗", color: "#3ECB8E" },
  { name: "Marina S.", status: "Fazendo entregas até 22h", time: "2 min", dist: "1,2 km", emoji: "🛵", color: "#60a5fa" },
  { name: "Pedro R.", status: "Aceito fretes de até 500 kg", time: "5 min", dist: "2,5 km", emoji: "🚚", color: "#f59e0b" },
  { name: "Ana P.", status: "Entrega em Teófilo Otoni às 14h", time: "8 min", dist: "3 km", emoji: "📦", color: "#a78bfa" },
  { name: "João V.", status: "Disponível para viagens entre cidades", time: "12 min", dist: "4,5 km", emoji: "🚗", color: "#34d399" },
];

export function LiveDriversSection() {
  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="relative h-[250px] md:h-[400px] txd-card overflow-hidden rounded-2xl">
        <Suspense fallback={<div className="w-full h-full bg-[#11151c] animate-pulse" />}>
          <TxdMap center={[-23.5505, -46.6333]} zoom={13}
            markers={[
              { id: "u", lat: -23.5505, lng: -46.6333, type: "user", pulse: true },
              { id: "c", lat: -23.545, lng: -46.635, type: "driver", pulse: true },
              { id: "m", lat: -23.548, lng: -46.628, type: "bike", pulse: true },
              { id: "p", lat: -23.553, lng: -46.642, type: "truck", pulse: true },
              { id: "a", lat: -23.542, lng: -46.638, type: "driver", pulse: true },
            ]}
            interactive={false} />
        </Suspense>
        <div className="absolute top-3 left-3 txd-glass-strong rounded-xl px-3 py-1.5">
          <LiveIndicator label="Motoristas online" interval={5000} />
        </div>
        <div className="absolute top-3 right-3 bg-black/40 rounded-xl px-3 py-1.5"><span className="text-xs text-gray-400">Raio: 5 km</span></div>
        <div className="absolute bottom-3 left-3 bg-black/40 rounded-xl px-3 py-1.5">
          <span className="text-xs text-gray-400"><LiveIndicator label="Corridas em andamento" interval={8000} /></span>
        </div>
      </div>
      <div className="space-y-3">
        {liveDrivers.map((d, i) => (
          <div key={i} className="txd-card p-4 flex items-center gap-4 txd-card-hover transition-all">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: `${d.color}20` }}>{d.emoji}</div>
            <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{d.name}</div><div className="text-xs text-gray-400 truncate">{d.status}</div></div>
            <div className="text-right shrink-0"><div className="text-xs text-gray-300">{d.time}</div><div className="text-xs text-gray-500">{d.dist}</div></div>
          </div>
        ))}
        <p className="text-center text-xs text-gray-500 mt-4">AO VIVO — status atualizados em tempo real</p>
      </div>
    </div>
  );
}

/* ── Plans ── */

export function PlansSection() {
  const { openAuth } = useAuth();

  const plans = [
    { name: "Passageiro", price: "Grátis", emoji: "🚗", features: ["Corridas ilimitadas", "Rastreamento ao vivo", "Pagamento digital", "Avaliação de motoristas", "Histórico completo", "Suporte 24/7"], popular: false },
    { name: "Motorista", price: "R$ 25 crédito", emoji: "🛵", features: ["Ganhos diários", "Saque PIX 24h", "KYC gratuito", "Carteira digital", "Negociação de valor", "Histórico de ganhos", "Suporte prioritário"], popular: true },
    { name: "Empresa", price: "Sob consulta", emoji: "🏢", features: ["Painel administrativo", "Funcionários ilimitados", "Centros de custo", "Relatórios", "NF automática", "Contratos recorrentes", "Suporte dedicado"], popular: false },
  ];

  return (
    <>
      <div className="max-w-5xl mx-auto mb-6 md:mb-8 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {[ { label: "Carro", price: "R$ 25" }, { label: "Moto", price: "R$ 15" }, { label: "Entrega", price: "R$ 10" }, { label: "Frete", price: "R$ 45" } ].map((p, i) => (
          <div key={i} className="txd-card p-3 md:p-4 text-center"><div className="text-[10px] md:text-xs text-gray-500">{p.label}</div><div className="txd-gradient-text font-bold text-sm md:text-lg">{p.price}</div><div className="text-[10px] md:text-xs text-gray-500">preço médio</div></div>
        ))}
      </div>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <div key={i} className={`txd-card p-6 md:p-8 text-center relative ${plan.popular ? "border-primary/40" : ""} transition-all`}>
            {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-xs font-bold px-4 py-1 rounded-full">Mais procurado</div>}
            <div className="text-3xl md:text-4xl mb-3 md:mb-4">{plan.emoji}</div>
            <div className="text-base md:text-lg font-bold">{plan.name}</div>
            <div className="txd-gradient-text text-xl md:text-2xl font-bold my-2 md:my-3">{plan.price}</div>
            <ul className="space-y-2 mb-5 md:mb-6 text-left">
              {plan.features.map((f, j) => <li key={j} className="flex items-center gap-2 text-sm text-gray-300"><Icon name="check-circle" size={16} className="text-primary shrink-0" />{f}</li>)}
            </ul>
            <RippleButton onClick={() => openAuth("register", plan.name.toLowerCase())}
              className={`w-full py-3 rounded-xl font-bold text-sm ${plan.popular ? "bg-primary hover:bg-primary-hover text-black txd-green-glow-sm" : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"}`}>
              {plan.name === "Empresa" ? "Falar conosco" : "Começar agora"}
            </RippleButton>
          </div>
        ))}
      </div>
    </>
  );
}
