"use client";

import { Clock, MapPin, DollarSign } from "lucide-react";

export default function TripsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Viagens</h1>
      <div className="space-y-3">
        {[
          { origem: "R. Afonso Pena, 150", destino: "Av. Getúlio Vargas, 500", valor: "R$ 25", data: "Hoje, 14:30", status: "Completa" },
          { origem: "Praça Tiradentes, 10", destino: "R. Floriano Peixoto, 200", valor: "R$ 32", data: "Hoje, 13:15", status: "Completa" },
          { origem: "R. 7 de Setembro, 50", destino: "Av. Amazonas, 1000", valor: "R$ 18", data: "Ontem, 18:45", status: "Completa" },
        ].map((t, i) => (
          <div key={i} className="txd-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{t.data}</span>
              <span className="text-xs font-medium text-primary">{t.status}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm"><MapPin className="w-3.5 h-3.5 text-primary" />{t.origem}</div>
              <div className="flex items-center gap-2 text-sm"><MapPin className="w-3.5 h-3.5 text-red-400" />{t.destino}</div>
            </div>
            <div className="mt-2 text-right font-bold text-primary">{t.valor}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
