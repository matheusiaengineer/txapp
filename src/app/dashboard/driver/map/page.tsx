"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  MapPin,
  User,
  MessageCircle,
  AlertTriangle,
  Shield,
  ChevronUp,
  ChevronDown,
  Layers,
  Locate,
  Phone,
  X,
  Clock,
  Star,
  Bell,
} from "lucide-react";

export default function DriverMapView() {
  const [loading, setLoading] = useState(true);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [showRideCard, setShowRideCard] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading ? (
        <div className="w-full h-dvh bg-background flex items-center justify-center">
          <div className="space-y-4 text-center">
            <Skeleton className="w-16 h-16 rounded-full mx-auto" />
            <Skeleton className="h-5 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      ) : (
        <div className="relative w-full h-dvh bg-background text-foreground overflow-hidden">
      {/* Full-screen Map Placeholder */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-[#121212] relative"
          style={{
            backgroundImage: "radial-gradient(#2a2a2a 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          {/* Street lines */}
          <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="30%" x2="100%" y2="35%" stroke="#333" strokeWidth="2" />
            <line x1="0" y1="55%" x2="100%" y2="50%" stroke="#333" strokeWidth="3" />
            <line x1="0" y1="75%" x2="100%" y2="72%" stroke="#333" strokeWidth="2" />
            <line x1="25%" y1="0" x2="22%" y2="100%" stroke="#333" strokeWidth="2" />
            <line x1="50%" y1="0" x2="55%" y2="100%" stroke="#333" strokeWidth="3" />
            <line x1="75%" y1="0" x2="72%" y2="100%" stroke="#333" strokeWidth="2" />
            <line x1="40%" y1="0" x2="38%" y2="100%" stroke="#333" strokeWidth="1" />
            <line x1="65%" y1="0" x2="68%" y2="100%" stroke="#333" strokeWidth="1" />
          </svg>

          {/* Heat map overlay */}
          {showHeatMap && (
            <div
              className="absolute inset-0 transition-opacity duration-500"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 30% 40%, rgba(62,203,142,0.35) 0%, transparent 45%),
                  radial-gradient(circle at 65% 30%, rgba(62,203,142,0.25) 0%, transparent 40%),
                  radial-gradient(circle at 70% 60%, rgba(62,203,142,0.3) 0%, transparent 45%),
                  radial-gradient(circle at 40% 70%, rgba(62,203,142,0.2) 0%, transparent 35%),
                  radial-gradient(circle at 15% 65%, rgba(255,107,53,0.2) 0%, transparent 35%),
                  radial-gradient(circle at 85% 20%, rgba(62,203,142,0.15) 0%, transparent 30%)
                `,
              }}
            />
          )}

          {/* Driver Marker */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/50 border-2 border-background">
              <Navigation className="w-6 h-6 text-background" />
            </div>
            <div className="w-24 h-24 bg-primary/10 rounded-full absolute -top-6 -left-6 animate-ping" />
            <div className="w-32 h-32 bg-primary/5 rounded-full absolute -top-10 -left-10 animate-pulse" />
          </motion.div>

          {/* Simulated destinations */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
            className="absolute top-[30%] left-[22%] z-10"
          >
            <div className="w-8 h-8 bg-red-400 rounded-full flex items-center justify-center shadow-lg border-2 border-background">
              <MapPin className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating UI */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="h-full flex flex-col justify-between p-4 sm:p-6" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
          {/* Top Controls */}
          <div className="flex items-start justify-between pointer-events-auto">
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHeatMap(!showHeatMap)}
                className={`glass-panel p-3 rounded-full ${
                  showHeatMap ? "border-primary/50" : ""
                }`}
              >
                <Layers className={`w-5 h-5 ${showHeatMap ? "text-primary" : ""}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-panel p-3 rounded-full"
              >
                <Locate className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="glass-panel px-4 py-2.5 rounded-full flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2.5 h-2.5 bg-primary rounded-full"
              />
              <span className="text-sm font-bold">Online</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-panel p-3 rounded-full"
            >
              <Bell className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Center spacer */}
          <div />

          {/* Bottom Panel */}
          <div className="pointer-events-auto">
            {/* Current Ride Card */}
            <AnimatePresence>
              {showRideCard && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="max-w-md mx-auto w-full"
                >
                  <div className="glass-panel p-4 sm:p-5 relative">
                    {/* Minimize handle */}
                    <div
                      className="flex items-center justify-center -mt-2 mb-3 cursor-pointer"
                      onClick={() => setMinimized(!minimized)}
                    >
                      <div className="w-10 h-1 bg-gray-600 rounded-full" />
                    </div>

                    <AnimatePresence mode="wait">
                      {minimized ? (
                        <motion.div
                          key="minimized"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                            <span className="font-semibold">Em viagem • 8 min restantes</span>
                          </div>
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="expanded"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-3 h-3 bg-primary rounded-full"
                              />
                              <h2 className="font-bold">Viagem em andamento</h2>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setMinimized(true)}
                            >
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            </motion.button>
                          </div>

                          {/* Passenger Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                              AO
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-lg">Ana Oliveira</p>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                  4.9
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  ETA: 8 min
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Destination */}
                          <div className="bg-background border border-card-border rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col items-center gap-1 mt-0.5">
                                <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                                <div className="w-0.5 h-8 bg-gray-600" />
                                <div className="w-3 h-3 rounded-full bg-red-400 shrink-0" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Av. Paulista, 1000</p>
                                <p className="text-xs text-gray-500">Origem • 2 min atrás</p>
                                <p className="text-sm font-medium mt-2">Shopping Morumbi</p>
                                <p className="text-xs text-gray-500">Destino • Av. Roque Petroni Jr, 1089</p>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-4 gap-2">
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="glass-panel p-3 flex flex-col items-center gap-1"
                            >
                              <Navigation className="w-5 h-5 text-primary" />
                              <span className="text-xs">Navegar</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setShowChat(!showChat)}
                              className="glass-panel p-3 flex flex-col items-center gap-1"
                            >
                              <MessageCircle className="w-5 h-5 text-blue-400" />
                              <span className="text-xs">Chat</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="glass-panel p-3 flex flex-col items-center gap-1"
                            >
                              <Phone className="w-5 h-5 text-green-400" />
                              <span className="text-xs">Ligar</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="glass-panel p-3 flex flex-col items-center gap-1 border-red-500/30"
                            >
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                              <span className="text-xs">Emergência</span>
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state when no ride */}
            {!showRideCard && (
              <div className="max-w-md mx-auto w-full">
                <div className="glass-panel p-5 text-center">
                  <Navigation className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                  <p className="font-semibold">Aguardando solicitações</p>
                  <p className="text-xs text-gray-500 mt-1">Você será notificado quando houver uma corrida</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Panel Overlay */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 right-0 w-full sm:w-80 z-30 glass-panel border-l border-card-border flex flex-col"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-card-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  AO
                </div>
                <div>
                  <p className="font-semibold text-sm">Ana Oliveira</p>
                  <p className="text-xs text-primary">Online</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="flex justify-start">
                <div className="bg-background border border-card-border rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm">Oi, estou na portaria de blazer azul</p>
                  <p className="text-xs text-gray-500 mt-1">14:32</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-primary text-background rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm">Já estou chegando!</p>
                  <p className="text-xs text-white/60 mt-1">14:32</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-background border border-card-border rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm">Perfeito, estou te aguardando</p>
                  <p className="text-xs text-gray-500 mt-1">14:33</p>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-card-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-background border border-card-border rounded-full px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary hover:bg-primary-hover text-background font-bold w-10 h-10 rounded-xl transition-all hover:scale-[0.98] flex items-center justify-center shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Modal Trigger - always accessible */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute bottom-4 left-4 z-20 glass-panel p-3 rounded-full border-red-500/40 pointer-events-auto"
      >
        <Shield className="w-6 h-6 text-red-400" />
      </motion.button>
    </div>
    )}
  </>
  );
}


