"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy, Flame, Star, Gift, ChevronRight, Sparkles } from "lucide-react";

interface GamificationBarProps {
  tripsToday?: number;
  earningsToday?: number;
  bonusTarget?: number;
  className?: string;
}

const BONUS_TIERS = [
  { trips: 3, bonus: 10, label: "Bronze", icon: Star, color: "#CD7F32" },
  { trips: 5, bonus: 20, label: "Prata", icon: Star, color: "#C0C0C0" },
  { trips: 10, bonus: 35, label: "Ouro", icon: Trophy, color: "#FFD700" },
  { trips: 15, bonus: 50, label: "Diamante", icon: Sparkles, color: "#00FFFF" },
];

export default function GamificationBar({
  tripsToday = 0,
  earningsToday = 0,
  bonusTarget = 15,
  className = "",
}: GamificationBarProps) {
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [currentBonus, setCurrentBonus] = useState(0);
  const [prevTrips, setPrevTrips] = useState(tripsToday);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);

  const currentTier = BONUS_TIERS.slice().reverse().find((t) => tripsToday >= t.trips);
  const nextTier = BONUS_TIERS.find((t) => tripsToday < t.trips);
  const progress = nextTier ? tripsToday / nextTier.trips : 1;
  const progressPercent = Math.min(progress * 100, 100);

  useEffect(() => {
    if (tripsToday > prevTrips) {
      const gained = tripsToday - prevTrips;
      const bonus = gained * 2;
      setXp((prev) => prev + bonus);
      setStreak((prev) => prev + 1);

      const tier = BONUS_TIERS.find((t) => t.trips === tripsToday);
      if (tier) {
        setCurrentBonus(tier.bonus);
        setShowBonusPopup(true);
        setTimeout(() => setShowBonusPopup(false), 3000);
      }
    }
    setPrevTrips(tripsToday);
  }, [tripsToday]);

  const resetStreak = useCallback(() => setStreak(0), []);

  const level = Math.floor(xp / 100) + 1;
  const levelProgress = (xp % 100) / 100;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Barra de Energia Principal */}
      <div className="glass-panel p-4 relative overflow-hidden">
        {/* Glow de fundo */}
        <div
          className="absolute inset-0 opacity-20 transition-all duration-700"
          style={{
            background: currentTier
              ? `radial-gradient(ellipse at center, ${currentTier.color}40 0%, transparent 70%)`
              : "none",
          }}
        />

        <div className="relative z-10">
          {/* Header com level e streak */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400">Nv.{level}</span>
              </div>
              {streak >= 3 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20"
                >
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-[10px] font-bold text-orange-400">{streak} dias</span>
                </motion.div>
              )}
            </div>
            <div className="text-xs text-gray-400">
              <span className="text-primary font-bold">{tripsToday}</span> corridas hoje
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="relative h-4 bg-background rounded-full overflow-hidden border border-card-border">
            <motion.div
              className="h-full rounded-full relative"
              style={{
                background: currentTier
                  ? `linear-gradient(90deg, ${currentTier.color}, ${currentTier.color}88)`
                  : "linear-gradient(90deg, #3ECB8E, #3ECB8E88)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Efeito de brilho neon animado */}
              <motion.div
                className="absolute inset-0"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                style={{
                  background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)`,
                }}
              />
            </motion.div>

            {/* Níveis (bolinhas) */}
            {BONUS_TIERS.map((tier) => {
              const pos = (tier.trips / bonusTarget) * 100;
              const reached = tripsToday >= tier.trips;
              return (
                <div
                  key={tier.label}
                  className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all ${
                    reached
                      ? "border-background shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                      : "border-card-border bg-background"
                  }`}
                  style={{
                    left: `${pos}%`,
                    backgroundColor: reached ? tier.color : undefined,
                    boxShadow: reached ? `0 0 8px ${tier.color}` : undefined,
                  }}
                />
              );
            })}
          </div>

          {/* Legendas dos tiers */}
          <div className="flex justify-between mt-1.5">
            {BONUS_TIERS.map((tier) => {
              const Icon = tier.icon;
              const reached = tripsToday >= tier.trips;
              return (
                <div
                  key={tier.label}
                  className={`flex items-center gap-1 text-[10px] transition-all ${
                    reached ? "opacity-100" : "opacity-40"
                  }`}
                  style={{ color: reached ? tier.color : undefined }}
                >
                  <Icon className="w-3 h-3" />
                  <span>R${tier.bonus}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popup de bônus conquistado */}
      <AnimatePresence>
        {showBonusPopup && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="glass-panel p-4 border-primary/40 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{
                background: "radial-gradient(circle at center, rgba(62,203,142,0.3) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10 flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Gift className="w-8 h-8 text-primary" />
              </motion.div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Bônus desbloqueado!</p>
                <p className="text-xs text-gray-400">
                  {currentTier?.label}: +R$ {currentBonus.toFixed(2)} adicionado aos ganhos de hoje
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">+R${currentBonus}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
