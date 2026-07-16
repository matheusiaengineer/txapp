"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<"logo" | "text" | "done">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 1200);
    const t2 = setTimeout(() => setPhase("done"), 2500);
    const t3 = setTimeout(() => onFinish(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-background flex items-center justify-center"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6"
        >
          <motion.span
            className="text-4xl font-bold text-background"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >TX</motion.span>
        </motion.div>

        <AnimatePresence>
          {phase === "text" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h1 className="text-3xl font-bold text-white tracking-tight">TXD</h1>
              <p className="text-primary text-sm font-medium tracking-widest uppercase">Mobilidade Inteligente</p>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "logo" && (
          <motion.div
            className="mt-8"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
