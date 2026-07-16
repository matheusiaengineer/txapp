"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";

interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "ghost" | "outline";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}

export function RippleButton({
  children, onClick, className = "", variant = "primary", disabled, loading, type = "button",
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const ref = useRef<HTMLButtonElement>(null);
  const idRef = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = idRef.current++;
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    onClick?.();
  };

  const base = "relative overflow-hidden font-bold transition-all select-none active:scale-[0.97]";
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-black",
    ghost: "text-gray-300 hover:text-white hover:bg-white/5",
    outline: "bg-white/5 hover:bg-white/10 border border-white/10 text-white",
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ scale: 0, opacity: 0.5, x: r.x, y: r.y }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute w-5 h-5 rounded-full bg-white/30 pointer-events-none -translate-x-1/2 -translate-y-1/2"
        />
      ))}
    </button>
  );
}
