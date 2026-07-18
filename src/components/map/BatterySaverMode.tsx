"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Battery, BatteryWarning, Moon, Sun, Zap } from "lucide-react";

interface BatterySaverModeProps {
  onBatteryModeChange?: (isSaver: boolean) => void;
  className?: string;
}

export default function BatterySaverMode({ onBatteryModeChange, className = "" }: BatterySaverModeProps) {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [saverMode, setSaverMode] = useState(false);
  const [supported, setSupported] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const nav = navigator as any;
    if (!nav.getBattery) {
      setSupported(false);
      return;
    }

    setSupported(true);

    nav.getBattery().then((battery: any) => {
      const update = () => {
        setBatteryLevel(battery.level);
        setIsCharging(battery.charging);
        if (battery.level <= 0.2 && !battery.charging) {
          setSaverMode(true);
          setShowIndicator(true);
          setTimeout(() => setShowIndicator(false), 5000);
        }
      };

      update();
      battery.addEventListener("levelchange", update);
      battery.addEventListener("chargingchange", update);

      return () => {
        battery.removeEventListener("levelchange", update);
        battery.removeEventListener("chargingchange", update);
      };
    });
  }, []);

  const toggleSaver = useCallback(() => {
    const newMode = !saverMode;
    setSaverMode(newMode);
    onBatteryModeChange?.(newMode);
    if (newMode) {
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 3000);
    }
  }, [saverMode, onBatteryModeChange]);

  useEffect(() => {
    onBatteryModeChange?.(saverMode);
  }, [saverMode, onBatteryModeChange]);

  if (!supported) return null;

  const batteryPercent = batteryLevel !== null ? Math.round(batteryLevel * 100) : null;

  return (
    <div className={className}>
      {/* Botão flutuante */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleSaver}
        className={`p-3 rounded-full transition-all shadow-lg ${
          saverMode
            ? "bg-yellow-500/20 border border-yellow-500/40"
            : batteryLevel !== null && batteryLevel <= 0.2 && !isCharging
            ? "bg-red-500/20 border border-red-500/40"
            : "glass-panel"
        }`}
        title={saverMode ? "Modo economia ativo" : "Ativar modo economia"}
      >
        {saverMode ? (
          <Moon className="w-5 h-5 text-yellow-400" />
        ) : batteryLevel !== null && batteryLevel <= 0.2 && !isCharging ? (
          <BatteryWarning className="w-5 h-5 text-red-400" />
        ) : (
          <Battery className="w-5 h-5 text-gray-400" />
        )}
      </motion.button>

      {/* Indicador de bateria */}
      <AnimatePresence>
        {batteryPercent !== null && showIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute top-full mt-2 right-0 glass-panel p-3 rounded-xl whitespace-nowrap"
          >
            <div className="flex items-center gap-2">
              {saverMode ? (
                <>
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-xs font-bold text-yellow-400">Economia ativada</p>
                    <p className="text-[10px] text-gray-500">FPS reduzido · Mapa escuro · 3D desligado</p>
                  </div>
                </>
              ) : batteryLevel !== null && batteryLevel <= 0.2 && !isCharging ? (
                <>
                  <BatteryWarning className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs font-bold text-red-400">Bateria crítica: {batteryPercent}%</p>
                    <p className="text-[10px] text-gray-500">Ative o modo economia para economizar</p>
                  </div>
                </>
              ) : (
                <>
                  <Battery className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs font-bold">{batteryPercent}%</p>
                    <p className="text-[10px] text-gray-500">{isCharging ? "Carregando" : "Bateria estável"}</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
