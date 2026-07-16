"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, X, Download } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || dismissed || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 md:bottom-8 left-4 right-4 z-[150] max-w-md mx-auto"
      >
        <div className="txd-glass-strong rounded-2xl p-4 border border-primary/20 shadow-2xl shadow-primary/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Instale o TXDAPP</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Acesso rápido na tela inicial como um app nativo
              </p>
            </div>
            <button
              onClick={() => { setShowPrompt(false); setDismissed(true); }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/5 transition shrink-0"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setShowPrompt(false); setDismissed(true); }}
              className="flex-1 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 transition"
            >
              Agora não
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-primary text-black hover:bg-primary-hover transition"
            >
              Instalar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
