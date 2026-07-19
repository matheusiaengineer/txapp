"use client";

import { useUIStore } from "@/lib/store/ui-store";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

export function OnlineBanner() {
  const isOnline = useUIStore((s) => s.isOnline);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-red-500/90 backdrop-blur-md text-white text-xs font-semibold text-center py-2 flex items-center justify-center gap-2"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
        >
          <WifiOff className="w-3.5 h-3.5" />
          Sem conexão com a internet
        </motion.div>
      )}
    </AnimatePresence>
  );
}
