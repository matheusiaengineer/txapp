"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const VEHICLES = [
  {
    id: "carro",
    icon: (
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <defs>
          <linearGradient id="carGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3ECB8E" />
            <stop offset="100%" stopColor="#2da874" />
          </linearGradient>
        </defs>
        <rect x="15" y="18" width="70" height="22" rx="6" fill="url(#carGrad)" opacity="0.9" />
        <rect x="10" y="24" width="80" height="16" rx="4" fill="url(#carGrad)" />
        <rect x="25" y="10" width="45" height="14" rx="8" fill="#1a1a2e" stroke="#3ECB8E" strokeWidth="1.5" />
        <circle cx="30" cy="46" r="8" fill="#111" stroke="#3ECB8E" strokeWidth="1.5" />
        <circle cx="30" cy="46" r="4" fill="#3ECB8E" opacity="0.5" />
        <circle cx="70" cy="46" r="8" fill="#111" stroke="#3ECB8E" strokeWidth="1.5" />
        <circle cx="70" cy="46" r="4" fill="#3ECB8E" opacity="0.5" />
        <rect x="85" y="28" width="8" height="8" rx="2" fill="#3ECB8E" opacity="0.6" />
        <rect x="88" y="20" width="6" height="6" rx="1" fill="#3ECB8E" opacity="0.4" />
        <line x1="20" y1="30" x2="85" y2="30" stroke="#3ECB8E" strokeWidth="0.5" opacity="0.3" />
      </svg>
    ),
    label: "Carro",
    price: "R$ 25",
    color: "#3ECB8E",
  },
  {
    id: "moto",
    icon: (
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <defs>
          <linearGradient id="motoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <circle cx="30" cy="46" r="9" fill="#111" stroke="#60a5fa" strokeWidth="2" />
        <circle cx="30" cy="46" r="4" fill="#60a5fa" opacity="0.5" />
        <circle cx="90" cy="46" r="9" fill="#111" stroke="#60a5fa" strokeWidth="2" />
        <circle cx="90" cy="46" r="4" fill="#60a5fa" opacity="0.5" />
        <line x1="35" y1="40" x2="85" y2="40" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
        <line x1="38" y1="30" x2="38" y2="42" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
        <line x1="38" y1="30" x2="55" y2="20" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="55" y1="20" x2="60" y2="32" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
        <line x1="60" y1="32" x2="80" y2="28" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
        <circle cx="62" cy="26" r="3" fill="#60a5fa" opacity="0.6" />
      </svg>
    ),
    label: "Moto",
    price: "R$ 15",
    color: "#60a5fa",
  },
  {
    id: "caminhao",
    icon: (
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <defs>
          <linearGradient id="truckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <rect x="5" y="14" width="50" height="26" rx="4" fill="url(#truckGrad)" opacity="0.9" />
        <rect x="10" y="8" width="30" height="10" rx="3" fill="#1a1a2e" stroke="#f59e0b" strokeWidth="1.5" />
        <rect x="10" y="8" width="12" height="10" rx="3" fill="#f59e0b" opacity="0.15" />
        <rect x="55" y="8" width="45" height="32" rx="4" fill="#f59e0b" opacity="0.4" stroke="#f59e0b" strokeWidth="1.5" />
        <circle cx="25" cy="46" r="8" fill="#111" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="25" cy="46" r="4" fill="#f59e0b" opacity="0.5" />
        <circle cx="85" cy="46" r="8" fill="#111" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="85" cy="46" r="4" fill="#f59e0b" opacity="0.5" />
        <line x1="55" y1="24" x2="100" y2="24" stroke="#f59e0b" strokeWidth="0.5" opacity="0.4" />
        <rect x="60" y="14" width="25" height="4" rx="1" fill="#f59e0b" opacity="0.6" />
      </svg>
    ),
    label: "Caminhão",
    price: "R$ 45",
    color: "#f59e0b",
  },
  {
    id: "frete",
    icon: (
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <defs>
          <linearGradient id="freteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <rect x="8" y="12" width="60" height="28" rx="5" fill="url(#freteGrad)" opacity="0.9" />
        <rect x="12" y="6" width="35" height="10" rx="3" fill="#1a1a2e" stroke="#a78bfa" strokeWidth="1.5" />
        <rect x="68" y="6" width="40" height="34" rx="4" fill="#a78bfa" opacity="0.35" stroke="#a78bfa" strokeWidth="1.5" />
        <circle cx="28" cy="46" r="8" fill="#111" stroke="#a78bfa" strokeWidth="2" />
        <circle cx="28" cy="46" r="4" fill="#a78bfa" opacity="0.5" />
        <circle cx="90" cy="46" r="8" fill="#111" stroke="#a78bfa" strokeWidth="2" />
        <circle cx="90" cy="46" r="4" fill="#a78bfa" opacity="0.5" />
        <rect x="75" y="12" width="20" height="8" rx="2" fill="#a78bfa" opacity="0.5" />
        <line x1="68" y1="24" x2="108" y2="24" stroke="#a78bfa" strokeWidth="0.5" opacity="0.3" />
      </svg>
    ),
    label: "Frete",
    price: "Orçamento",
    color: "#a78bfa",
  },
];

export function Vehicle3D() {
  const ref = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 100, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 100, damping: 20 });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const startInterval = () => {
      interval = setInterval(() => {
        if (!isFlipping && document.visibilityState === "visible") {
          setIsFlipping(true);
          setTimeout(() => {
            setActiveIndex(prev => (prev + 1) % VEHICLES.length);
            setIsFlipping(false);
          }, 600);
        }
      }, 3000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearInterval(interval);
      } else {
        startInterval();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startInterval();

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isFlipping]);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    rotateX.set((e.clientY - centerY) / -20);
    rotateY.set((e.clientX - centerX) / 20);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  const v = VEHICLES[activeIndex];

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: "preserve-3d" }}
        className="relative w-64 h-48 cursor-pointer"
      >
        <motion.div
          key={v.id}
          initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
          animate={{ rotateY: 0, opacity: 1, scale: 1 }}
          exit={{ rotateY: -90, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{ transformStyle: "preserve-3d", transform: "translateZ(40px)" }}
          className="absolute inset-0"
        >
          <div
            className="w-full h-full rounded-3xl border-2 flex items-center justify-center p-6 backdrop-blur-sm"
            style={{
              borderColor: `${v.color}40`,
              background: `radial-gradient(circle at 50% 50%, ${v.color}15, transparent)`,
              boxShadow: `0 0 60px ${v.color}20, inset 0 0 60px ${v.color}10`,
            }}
          >
            {v.icon}
          </div>
        </motion.div>

        <motion.div
          className="absolute -bottom-2 -right-2 w-20 h-20 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-sm flex items-center justify-center"
          style={{ transform: "translateZ(60px)" }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-primary font-bold text-sm">{v.price}</span>
        </motion.div>

        <motion.div
          className="absolute -top-2 -left-2 w-16 h-16 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-sm flex items-center justify-center"
          style={{ transform: "translateZ(50px)" }}
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-white font-bold text-lg">{v.label}</span>
        </motion.div>
      </motion.div>

      <div className="flex gap-2">
        {VEHICLES.map((vItem, i) => (
          <button
            key={vItem.id}
            onClick={() => { setActiveIndex(i); setIsFlipping(true); setTimeout(() => setIsFlipping(false), 600); }}
            className={`w-3 h-3 rounded-full transition-all ${i === activeIndex ? "bg-primary w-6" : "bg-white/20 hover:bg-white/40"}`}
          />
        ))}
      </div>

      <div className="flex gap-6 text-xs text-gray-500">
        {VEHICLES.map((vItem, i) => (
          <button
            key={vItem.id}
            onClick={() => setActiveIndex(i)}
            className={`transition-colors ${i === activeIndex ? "text-primary font-medium" : ""}`}
          >
            {vItem.label}
          </button>
        ))}
      </div>
    </div>
  );
}
