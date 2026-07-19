"use client";

import { useState, lazy, Suspense } from "react";
import { Icon } from "@/components/ui/Icon";

const TxdMap = lazy(() => import("@/components/txd/txd-map"));

const tabs = [
  { id: "passenger", label: "Passageiro", icon: "car" as const, desc: "Solicite corridas com poucos toques" },
  { id: "driver", label: "Motorista", icon: "bike" as const, desc: "Gerencie seus ganhos e corridas" },
  { id: "company", label: "Empresa", icon: "building-2" as const, desc: "Painel de entregas empresariais" },
  { id: "delivery", label: "Entregas", icon: "package" as const, desc: "Acompanhe entregas em tempo real" },
];

function PassengerDashboard() {
  return <div className="absolute inset-0 pt-12 pb-14 px-3 flex flex-col gap-2 z-10">
    <div className="txd-glass-strong rounded-xl p-2.5 flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1 flex-1"><div className="w-2 h-2 rounded-full bg-primary" /><input placeholder="Origem" className="bg-transparent outline-none text-white text-xs flex-1" /></div>
    </div>
    <div className="txd-glass-strong rounded-xl p-2.5 flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1 flex-1"><Icon name="map-pin" size={12} className="text-red-400" /><input placeholder="Destino" className="bg-transparent outline-none text-white text-xs flex-1" /></div>
    </div>
    <div className="flex-1 relative rounded-xl overflow-hidden">
      <Suspense fallback={<div className="w-full h-full bg-[#11151c] animate-pulse rounded-xl" />}>
        <TxdMap center={[-23.5505, -46.6333]} zoom={14}
          markers={[{ id:"p", lat:-23.5505, lng:-46.6333, type:"pickup" }, { id:"d", lat:-23.558, lng:-46.64, type:"destination" }]}
          route={{ from:{lat:-23.5505,lng:-46.6333}, to:{lat:-23.558,lng:-46.64} }} showRoute interactive={false} />
      </Suspense>
      <div className="absolute top-2 left-2 txd-glass-strong rounded-xl px-2 py-1"><span className="text-[10px]">8 min · 5,2 km</span></div>
    </div>
    <div className="flex gap-1.5">
      {[ { label:"Carro", price:"R$25", active:true }, { label:"Moto", price:"R$15", active:false }, { label:"Frete", price:"R$45", active:false } ].map((c, i) => (
        <button key={i} className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition ${c.active ? "bg-primary text-black" : "bg-white/5 text-gray-400"}`}>{c.label}<br />{c.price}</button>
      ))}
    </div>
    <button className="bg-primary hover:bg-primary-hover text-black text-xs font-bold py-2.5 rounded-xl transition txd-green-glow-sm">Confirmar corrida · R$ 25,00</button>
  </div>;
}

function DriverDashboard() {
  return <div className="absolute inset-0 pt-12 pb-14 px-3 flex flex-col gap-1.5 z-10 text-[10px]">
    <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-txd-pulse-glow" /><span className="font-semibold text-xs">Online</span></div><button className="text-red-400 border border-red-400/30 rounded-lg px-2 py-0.5 text-[10px]">Sair</button></div>
    <div className="bg-gradient-to-r from-primary to-[#2da874] rounded-xl p-3 text-black">
      <div className="font-bold text-sm">R$ 324,50</div>
      <div className="text-[10px] font-medium">hoje · 12 corridas · +18% vs ontem</div>
    </div>
    <div className="txd-card p-2.5 border-primary/20 flex-1">
      <div className="flex items-center gap-2 mb-1"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-[#2da874] flex items-center justify-center text-[10px]">🧑</div><div><span className="font-semibold text-xs">Marina S.</span><span className="text-yellow-400 ml-1">★4.9</span></div><div className="ml-auto txd-gradient-text font-bold text-xs">R$ 25</div></div>
      <div className="text-[10px] text-gray-400 mb-1">5,2 km · 8 min</div>
      <div className="flex gap-1 text-[9px]"><div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-primary" />Av. Paulista, 1000</div></div>
      <div className="flex gap-1 text-[9px] mb-2"><div className="flex items-center gap-1"><Icon name="map-pin" size={10} className="text-red-400" />Shopping Center</div></div>
      <div className="flex gap-2"><button className="flex-1 py-1 rounded-lg bg-red-500/20 text-red-400 font-medium">Recusar</button><button className="flex-1 py-1 rounded-lg bg-primary text-black font-medium">Aceitar</button></div>
      <div className="text-center mt-1"><button className="text-primary text-[9px]">Negociar valor</button></div>
    </div>
    <div className="grid grid-cols-3 gap-1">
      {[ { label:"Semana", value:"R$ 1.8k" }, { label:"Avaliação", value:"4.9★" }, { label:"Tx. aceite", value:"82%" } ].map((s,i) => <div key={i} className="txd-card p-1.5 text-center"><div className="text-[10px] font-semibold">{s.value}</div><div className="text-[8px] text-gray-500">{s.label}</div></div>)}
    </div>
  </div>;
}

function CompanyDashboard() {
  return <div className="absolute inset-0 pt-12 pb-14 px-3 flex flex-col gap-1.5 z-10 text-[10px]">
    <div className="flex items-center justify-between"><span className="text-[9px] text-gray-400">Farmácia Santa Cruz</span><span className="text-[8px] text-gray-500">Bem-vinda, Ana</span></div>
    <button className="bg-primary text-black text-[10px] font-bold py-1.5 rounded-xl">+ Novo pedido</button>
    <div className="grid grid-cols-2 gap-1">
      {[ { label:"Hoje", value:"24" }, { label:"Em trânsito", value:"6" }, { label:"Concluídos", value:"18" }, { label:"No mês", value:"R$ 2.4k" } ].map((s,i) => <div key={i} className="txd-card p-1.5 text-center"><div className="text-xs font-bold">{s.value}</div><div className="text-[8px] text-gray-500">{s.label}</div></div>)}
    </div>
    <div className="flex-1 space-y-1 overflow-hidden">
      {[ { id:"#5821", status:"Em trânsito", color:"#3ECB8E", client:"João S.", address:"R. das Flores, 123", driver:"Carlos M." },
         { id:"#5820", status:"Aguardando", color:"#f59e0b", client:"Maria A.", address:"Av. Principal, 456", driver:"Buscando..." },
         { id:"#5819", status:"Entregue", color:"#60a5fa", client:"Pedro R.", address:"R. do Comércio, 789", driver:"Ana P." } ].map((o,i) => (
        <div key={i} className="txd-card p-1.5 flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-gray-500">{o.id}</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium" style={{background:`${o.color}20`,color:o.color}}>{o.status}</span>
          <div className="flex-1 min-w-0"><div className="text-[9px] truncate">{o.client}</div><div className="text-[8px] text-gray-500 truncate">{o.address}</div></div>
          <span className="text-[8px] text-gray-500 shrink-0">{o.driver}</span>
        </div>
      ))}
    </div>
  </div>;
}

function DeliveryDashboard() {
  return <div className="absolute inset-0 pt-12 pb-14 px-3 flex flex-col gap-1.5 z-10 text-[10px]">
    <div className="bg-gradient-to-r from-primary to-[#2da874] rounded-xl p-2.5 text-black">
      <div className="font-bold text-[11px]">Entrega em andamento</div>
      <div className="text-[9px] font-medium opacity-80">#5821 · Farmácia · 0,2 kg</div>
    </div>
    <div className="flex items-center gap-1 text-[8px]">
      {["Coletado","A caminho","Entregue"].map((s,i) => <div key={i} className={`flex-1 text-center py-0.5 rounded ${i<2 ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-500"}`}>{s}</div>)}
    </div>
    <div className="flex-1 relative rounded-xl overflow-hidden">
      <Suspense fallback={<div className="w-full h-full bg-[#11151c] animate-pulse rounded-xl" />}>
        <TxdMap center={[-23.5505, -46.6333]} zoom={14}
          markers={[{ id:"p", lat:-23.5505, lng:-46.6333, type:"pickup" }, { id:"d", lat:-23.555, lng:-46.638, type:"destination" }, { id:"b", lat:-23.552, lng:-46.636, type:"bike", pulse:true }]}
          route={{ from:{lat:-23.5505,lng:-46.6333}, to:{lat:-23.555,lng:-46.638} }} showRoute interactive={false} />
      </Suspense>
      <div className="absolute top-2 left-2 txd-glass-strong rounded-xl px-2 py-1"><span className="text-[10px]">Carlos · 3 min</span></div>
    </div>
    <div className="txd-card p-2 flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-sm">📦</div>
      <div className="flex-1"><div className="text-[9px] font-semibold">Entregue · #5820</div><div className="text-[8px] text-gray-500">GPS: -23.548, -46.632 · 14:32</div></div>
      <Icon name="check-circle" size={16} className="text-primary" />
    </div>
    <div className="flex gap-2"><button className="flex-1 py-1.5 rounded-xl bg-white/5 text-gray-300 text-[10px]">Ligar</button><button className="flex-1 py-1.5 rounded-xl bg-primary text-black font-medium text-[10px]">Mensagem</button></div>
  </div>;
}

export function DashboardPreview() {
  const [tab, setTab] = useState("passenger");

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 space-y-4">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`w-full txd-card p-4 text-left flex items-center gap-4 transition ${tab === t.id ? "border-primary/40" : ""}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tab === t.id ? "bg-primary text-black" : "bg-white/5 text-gray-400"}`}>
              <Icon name={t.icon} size={20} />
            </div>
            <div className="flex-1"><div className="font-semibold text-sm">{t.label}</div><div className="text-xs text-gray-500">{t.desc}</div></div>
          </button>
        ))}
      </div>
      <div className="lg:col-span-2 flex justify-center">
        <div className="relative max-w-full mx-auto" style={{ width: "clamp(240px, 75vw, 300px)" }}>
          <div className="absolute -inset-4 bg-gradient-radial from-primary/30 to-transparent blur-2xl opacity-30" />
          <div className="relative txd-glass-strong rounded-[2.5rem] p-[2.5px] shadow-2xl">
            <div className="relative w-full aspect-[9/19] rounded-[2.3rem] overflow-hidden bg-gradient-to-b from-[#0a0d12] to-[#0e1218]">
              <div className="absolute inset-0 txd-grid-bg opacity-20" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-20 flex items-center justify-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-800" />
                <div className="w-16 h-1.5 rounded-full bg-gray-900" />
              </div>
              <div className="absolute top-6 left-0 right-0 z-10 flex justify-between px-5 text-[10px] text-gray-400">
                <span>9:41</span>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-primary" /> 5G</div>
              </div>
              {tab === "passenger" && <PassengerDashboard />}
              {tab === "driver" && <DriverDashboard />}
              {tab === "company" && <CompanyDashboard />}
              {tab === "delivery" && <DeliveryDashboard />}
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 border-t border-white/5 px-4 py-2" style={{ backdropFilter: "blur(24px)" }}>
                <div className="flex justify-around">
                  {[ { icon: "map" as const, active: tab === "passenger" }, { icon: "car" as const, active: tab === "driver" }, { icon: "clock" as const, active: tab === "delivery" }, { icon: "wallet" as const, active: tab === "company" } ].map((t, i) => (
                    <div key={i} className={`flex flex-col items-center gap-0.5 ${t.active ? "text-primary" : "text-gray-600"}`}>
                      <Icon name={t.icon} size={16} />
                      <span className="text-[8px]">{[ "Início", "Corridas", "Histórico", "Carteira" ][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
