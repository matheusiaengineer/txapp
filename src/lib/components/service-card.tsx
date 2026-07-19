"use client";

import { motion } from "framer-motion";
import {
  Bike, Car, Truck, Package, Dog, Baby, Users, Route,
  Accessibility, Heart, Briefcase, Home, LucideIcon,
} from "lucide-react";
import type { ServiceCategory } from "@/lib/mobility/service-categories";

const iconMap: Record<string, LucideIcon> = {
  bike: Bike, car: Car, truck: Truck, package: Package,
  dog: Dog, baby: Baby, users: Users, route: Route,
  accessibility: Accessibility, venus: Heart,
  briefcase: Briefcase, home: Home,
};

interface ServiceCardProps {
  category: ServiceCategory;
  price: number;
  etaMinutes: number;
  selected: boolean;
  onSelect: () => void;
  index?: number;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2)}`;
}

export function ServiceCard({ category, price, etaMinutes, selected, onSelect, index = 0 }: ServiceCardProps) {
  const Icon = iconMap[category.icon] || Car;
  const isFreight = category.type === "freight";
  const capacityLabel = isFreight
    ? category.maxWeight
      ? `Até ${category.maxWeight}kg`
      : null
    : category.capacity === 1
      ? "1 passageiro"
      : `Até ${category.capacity} passageiros`;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`w-full text-left rounded-2xl p-4 transition-all cursor-pointer border ${
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(62,203,142,0.15)]"
          : "border-card-border bg-card-bg hover:border-white/20 hover:bg-card-bg/80"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: category.color + "20" }}
        >
          <Icon className="w-6 h-6" style={{ color: category.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white text-base">{category.name}</span>
            <span className="text-white font-bold text-lg">{formatCurrency(price)}</span>
          </div>
          <p className="text-gray-400 text-sm mt-0.5 truncate">{category.descriptionPt}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>
              {isFreight
                ? `${category.maxWeight ? "Carga: " + category.maxWeight + "kg" : ""}`
                : `${etaMinutes} min • ${capacityLabel}`
              }
            </span>
            {category.petFriendly && <span className="text-amber-400">🐾 Pet</span>}
            {category.accessible && <span className="text-purple-400">♿ Acessível</span>}
            {category.womenOnly && <span className="text-pink-400">♀ Feminino</span>}
            {category.requiresCarSeat && <span className="text-rose-400">🧒 Cadeirinha</span>}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
