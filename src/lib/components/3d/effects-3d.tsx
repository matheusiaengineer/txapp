"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";

export function ParticlesBackground({ count = 50 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 3 + 1, speed: Math.random() * 0.5 + 0.1,
    opacity: Math.random() * 0.5 + 0.1, color: i % 3 === 0 ? "#3ECB8E" : i % 3 === 1 ? "#8B5CF6" : "#3B82F6",
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
            backgroundColor: p.color, opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          }}
          animate={{ y: [0, -30, 0], opacity: [p.opacity, p.opacity * 2, p.opacity] }}
          transition={{ duration: p.speed * 10, repeat: Infinity, ease: "easeInOut", delay: p.id * 0.1 }}
        />
      ))}
    </div>
  );
}

export function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  function handleMouse(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / 15);
    y.set((e.clientY - centerY) / -15);
  }

  function handleLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX: springY, rotateY: springX, transformStyle: "preserve-3d" }}
      className={`transition-transform duration-100 ${className}`}
    >
      <div style={{ transformStyle: "preserve-3d", transform: "translateZ(50px)" }}>
        {children}
      </div>
    </motion.div>
  );
}

export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-card-bg rounded-xl ${className}`}>
      <motion.div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, transparent, rgba(62,203,142,0.08), transparent)" }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function Confetti({ active = false }: { active?: boolean }) {
  const [windowHeight, setWindowHeight] = useState(0);
  useEffect(() => { setWindowHeight(window.innerHeight); }, []);

  if (!active) return null;
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i, color: ["#3ECB8E", "#8B5CF6", "#3B82F6", "#F59E0B", "#EF4444"][i % 5],
    x: Math.random() * 100, delay: Math.random() * 0.5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{ left: `${p.x}%`, backgroundColor: p.color, top: -10 }}
          animate={{ y: [0, windowHeight + 10], rotate: [0, 720], opacity: [1, 0] }}
          transition={{ duration: 2, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

export function NeonText({ children, color = "#3ECB8E", className = "" }: { children: React.ReactNode; color?: string; className?: string }) {
  return (
    <span className={className} style={{
      color, textShadow: `0 0 7px ${color}, 0 0 10px ${color}, 0 0 21px ${color}, 0 0 42px ${color}`,
    }}>
      {children}
    </span>
  );
}

export function ParallaxContainer({ children, speed = 0.5 }: { children: React.ReactNode; speed?: number }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 1000 * speed]);
  return <motion.div style={{ y }}>{children}</motion.div>;
}

export function AnimatedCounter({ from = 0, to, duration = 2, suffix = "" }: { from?: number; to: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(from);
  useEffect(() => {
    let start = from;
    const increment = (to - from) / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(Math.round(start * 100) / 100);
    }, 16);
    return () => clearInterval(timer);
  }, [from, to, duration]);
  return <span>{count}{suffix}</span>;
}
