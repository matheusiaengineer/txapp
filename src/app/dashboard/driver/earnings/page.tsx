"use client";

import { DollarSign, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";

export default function EarningsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Ganhos</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="txd-card p-5">
          <div className="flex items-center gap-2 text-primary mb-2"><DollarSign className="w-5 h-5" /><span className="text-sm">Hoje</span></div>
          <div className="text-3xl font-bold">R$ 127</div>
          <div className="text-xs text-gray-500">5 corridas</div>
        </div>
        <div className="txd-card p-5">
          <div className="flex items-center gap-2 text-primary mb-2"><Calendar className="w-5 h-5" /><span className="text-sm">Esta Semana</span></div>
          <div className="text-3xl font-bold">R$ 845</div>
          <div className="text-xs text-gray-500">34 corridas</div>
        </div>
        <div className="txd-card p-5">
          <div className="flex items-center gap-2 text-primary mb-2"><TrendingUp className="w-5 h-5" /><span className="text-sm">Este Mês</span></div>
          <div className="text-3xl font-bold">R$ 3.240</div>
          <div className="text-xs text-gray-500">+15% vs mês passado</div>
        </div>
      </div>
      <div className="txd-card p-5">
        <h2 className="font-semibold mb-4">Últimos Ganhos</h2>
        <div className="space-y-3">
          {[{dia: "Hoje, 14:30", valor: "R$ 25", tipo: "Corrida"}, {dia: "Hoje, 13:15", valor: "R$ 32", tipo: "Corrida"}].map((g, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-background rounded-xl border border-card-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><ArrowUpRight className="w-4 h-4 text-primary" /></div>
                <div><div className="text-sm font-medium">{g.valor}</div><div className="text-xs text-gray-500">{g.dia}</div></div>
              </div>
              <span className="text-xs text-gray-400">{g.tipo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
