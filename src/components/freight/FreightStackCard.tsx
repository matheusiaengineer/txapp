"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, DollarSign, Package, Truck, Scale,
  ChevronLeft, ChevronRight, Star, User, Navigation,
} from "lucide-react";

interface FreightOffer {
  id: string;
  company: string;
  companyRating: number;
  origin: string;
  destination: string;
  cargoType: string;
  weight: string;
  volume: string;
  estimatedValue: number;
  distance: string;
  deadline: string;
  pickupDate: string;
}

const MOCK_OFFERS: FreightOffer[] = [
  {
    id: "1",
    company: "Logística ABC",
    companyRating: 4.8,
    origin: "São Paulo, SP",
    destination: "Campinas, SP",
    cargoType: "Eletrônicos",
    weight: "500 kg",
    volume: "3 m³",
    estimatedValue: 1200,
    distance: "95 km",
    deadline: "2 dias",
    pickupDate: "Amanhã",
  },
  {
    id: "2",
    company: "Transportadora Rápida",
    companyRating: 4.5,
    origin: "Guarulhos, SP",
    destination: "Rio de Janeiro, RJ",
    cargoType: "Alimentos",
    weight: "2 ton",
    volume: "8 m³",
    estimatedValue: 3500,
    distance: "430 km",
    deadline: "5 dias",
    pickupDate: "Hoje",
  },
  {
    id: "3",
    company: "Frete Express",
    companyRating: 4.2,
    origin: "São Bernardo, SP",
    destination: "Belo Horizonte, MG",
    cargoType: "Peças automotivas",
    weight: "1.5 ton",
    volume: "6 m³",
    estimatedValue: 2800,
    distance: "500 km",
    deadline: "3 dias",
    pickupDate: "10/07",
  },
];

export default function FreightStackCard({ className = "" }: { className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const offers = MOCK_OFFERS;
  const currentOffer = offers[currentIndex];

  const next = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const prev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Cards empilhados (efeito 3D) */}
      <div className="relative h-[300px]">
        {/* Card de fundo (próximo) */}
        {offers.length > 1 && (
          <motion.div
            className="absolute inset-0 z-0 rounded-2xl border border-card-border bg-background/80 backdrop-blur-sm"
            style={{ y: 8, scale: 0.95, opacity: 0.5 }}
          />
        )}

        {/* Card principal */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentOffer.id}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 z-10 glass-panel p-5 rounded-2xl flex flex-col overflow-hidden"
          >
            {/* Header da oferta */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{currentOffer.company}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] text-yellow-400">{currentOffer.companyRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-right"
              >
                <p className="text-lg font-bold text-primary">R$ {currentOffer.estimatedValue.toFixed(0)}</p>
                <p className="text-[10px] text-gray-500">valor estimado</p>
              </motion.div>
            </div>

            {/* Rota */}
            <div className="flex items-start gap-2 mb-3">
              <div className="flex flex-col items-center gap-0.5 mt-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                <div className="w-0.5 h-6 bg-primary/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{currentOffer.origin}</p>
                <p className="text-[10px] text-gray-500 truncate">→ {currentOffer.destination}</p>
              </div>
              <div className="text-[10px] text-gray-500 text-right shrink-0">
                <div>{currentOffer.distance}</div>
                <div>{currentOffer.deadline}</div>
              </div>
            </div>

            {/* Detalhes da carga */}
            <div className="flex gap-3 mb-3">
              <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-background rounded-lg px-2 py-1">
                <Package className="w-3 h-3" />
                <span>{currentOffer.cargoType}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-background rounded-lg px-2 py-1">
                <Scale className="w-3 h-3" />
                <span>{currentOffer.weight}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-background rounded-lg px-2 py-1">
                <MapPin className="w-3 h-3" />
                <span>{currentOffer.pickupDate}</span>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2 mt-auto">
              <button
                onClick={prev}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-300 text-xs font-semibold hover:bg-white/10 transition flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" /> Anterior
              </button>
              <button className="flex-[2] py-2.5 rounded-xl bg-primary text-background text-xs font-bold hover:bg-primary-hover transition flex items-center justify-center gap-2">
                <Navigation className="w-3.5 h-3.5" /> Dar lance
              </button>
              <button
                onClick={next}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-300 text-xs font-semibold hover:bg-white/10 transition flex items-center justify-center gap-1"
              >
                Próximo <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicadores */}
      <div className="flex justify-center gap-1.5 mt-3">
        {offers.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > currentIndex ? 1 : -1);
              setCurrentIndex(i);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex ? "bg-primary w-5" : "bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
