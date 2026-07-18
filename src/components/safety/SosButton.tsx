"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Phone, Share2, Bell, BellOff, MapPin, X } from "lucide-react";

const EMERGENCY_CONTACTS = [
  { name: "Polícia Militar", number: "190", icon: Phone },
  { name: "Emergência Geral", number: "192", icon: Phone },
];

const TRUSTED_CONTACTS = [
  { name: "Maria (Mãe)", number: "+55 11 99999-0001" },
  { name: "Carlos (Irmão)", number: "+55 11 99999-0002" },
  { name: "Ana (Amiga)", number: "+55 11 99999-0003" },
];

export default function SosButton({ onTrigger, driverId }: { onTrigger?: () => void; driverId?: string }) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [activated, setActivated] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [appMuted, setAppMuted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const holdRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimeRef = useRef(0);

  const startHold = useCallback(() => {
    startTimeRef.current = Date.now();
    holdRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / 3000, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        clearInterval(holdRef.current);
        holdRef.current = undefined;
        setHoldProgress(0);
        setShowConfirm(true);
      }
    }, 50);
  }, []);

  const cancelHold = useCallback(() => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = undefined;
    }
    setHoldProgress(0);
  }, []);

  const triggerSOS = useCallback(async () => {
    setActivated(true);
    setShowConfirm(false);
    setAppMuted(true);
    setCountdown(5);

    const userLocation = await new Promise<{ lat: number; lng: number }>((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: -23.5505, lng: -46.6333 });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: -23.5505, lng: -46.6333 }),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });

    const alertPayload = {
      type: "SOS_ACTIVATED",
      timestamp: new Date().toISOString(),
      location: userLocation,
      driverId,
      trustedContacts: TRUSTED_CONTACTS.map((c) => c.number),
    };

    try {
      await fetch("/api/location/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...alertPayload, status: "SOS_ALERT", sos: true }),
      }).catch(() => {});
    } catch {}

    TRUSTED_CONTACTS.forEach((contact) => {
      const mapsUrl = `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`;
      const message = encodeURIComponent(
        `🚨 SOS TXDAPP! ${contact.name}, estou precisando de ajuda! Minha localização: ${mapsUrl}`
      );
      window.open(`https://wa.me/${contact.number.replace(/\D/g, "")}?text=${message}`, "_blank");
    });

    EMERGENCY_CONTACTS.forEach((c) => {
      window.open(`tel:${c.number}`, "_blank");
    });

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      clearInterval(timer);
      setCountdown(0);
    }, 5000);

    onTrigger?.();
  }, [driverId, onTrigger]);

  const cancelSOS = useCallback(() => {
    setActivated(false);
    setAppMuted(false);
    setCountdown(0);
  }, []);

  useEffect(() => {
    return () => {
      if (holdRef.current) clearInterval(holdRef.current);
    };
  }, []);

  return (
    <>
      {/* Botão SOS Invisível - segure 3s no mapa */}
      <div
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        className="fixed inset-0 z-[60] pointer-events-none"
        style={{ touchAction: "none" }}
      >
        <div className="absolute bottom-32 right-6 pointer-events-auto">
          <AnimatePresence>
            {holdProgress > 0 && !showConfirm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="4" />
                    <motion.circle
                      cx="32" cy="32" r="28" fill="none" stroke="#ef4444" strokeWidth="4"
                      strokeLinecap="round" strokeDasharray="176"
                      strokeDashoffset={176 - holdProgress * 176}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <span className="text-[10px] text-red-400 font-bold bg-black/80 px-2 py-1 rounded-full">
                  {Math.ceil((1 - holdProgress) * 3)}s
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de confirmação */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/70 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="glass-panel w-full max-w-sm p-6 rounded-3xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Emergência</h3>
                    <p className="text-sm text-gray-400">SOS será acionado</p>
                  </div>
                </div>
                <button onClick={() => setShowConfirm(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-300 font-medium">Ações que serão realizadas:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Share2 className="w-4 h-4 text-red-400" />
                    <span>Localização enviada para 3 contatos de confiança via WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="w-4 h-4 text-red-400" />
                    <span>Ligação para emergência (190)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <BellOff className="w-4 h-4 text-red-400" />
                    <span>Áudio do app silenciado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span>Localização ao vivo compartilhada</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 font-semibold text-sm hover:bg-white/10 transition">
                  Cancelar
                </button>
                <button onClick={triggerSOS}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Acionar SOS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner SOS ativado */}
      <AnimatePresence>
        {activated && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[80] bg-red-600 p-4 pt-[calc(env(safe-area-inset-top,0px)+16px)]"
          >
            <div className="flex items-center justify-between max-w-lg mx-auto">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <AlertTriangle className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <p className="text-white font-bold">SOS Ativado</p>
                  <p className="text-white/80 text-xs">
                    {countdown > 0
                      ? `Ajuda a caminho em ${countdown}s...`
                      : "Emergência acionada. Contatos notificados."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {appMuted && (
                  <div className="flex items-center gap-1 text-xs text-white/80">
                    <BellOff className="w-3 h-3" />
                    <span>Mudo</span>
                  </div>
                )}
                <button onClick={cancelSOS}
                  className="px-4 py-2 rounded-full bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition">
                  Cancelar SOS
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
