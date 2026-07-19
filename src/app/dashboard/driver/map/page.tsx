"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
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
  Check,
  Send,
  Image,
  Mic,
  MicOff,
  Loader2,
} from "lucide-react";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { useUser } from "@/lib/hooks/use-user";
import { useActiveTrip } from "@/lib/hooks/use-active-trip";
import { useTripChat } from "@/lib/chat/use-trip-chat";
import { triggerHaptic } from "@/lib/haptics";
import SosButton from "@/components/safety/SosButton";

const OpenStreetMap = dynamic(
  () => import("@/components/map/OpenStreetMap").then(m => m.OpenStreetMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#1a1a2e]" /> }
);

const STATUS_LABELS: Record<string, string> = {
  DRIVER_ACCEPTED: "A caminho do passageiro",
  GOING_TO_PICKUP: "A caminho do passageiro",
  ARRIVED: "Esperando passageiro",
  PASSENGER_ON_BOARD: "Viagem iniciada",
  IN_PROGRESS: "Viagem em andamento",
  FINISHING: "Finalizando viagem",
};

const STATUS_ACTIONS: Record<string, { label: string; next: string; icon: any }[]> = {
  DRIVER_ACCEPTED: [{ label: "A caminho", next: "GOING_TO_PICKUP", icon: Navigation }],
  GOING_TO_PICKUP: [{ label: "Cheguei", next: "ARRIVED", icon: MapPin }],
  ARRIVED: [{ label: "Embarcar", next: "PASSENGER_ON_BOARD", icon: User }],
  PASSENGER_ON_BOARD: [{ label: "Iniciar viagem", next: "IN_PROGRESS", icon: Navigation }],
  IN_PROGRESS: [{ label: "Finalizar", next: "FINISHING", icon: Check }],
  FINISHING: [{ label: "Confirmar", next: "COMPLETED", icon: Check }],
};

function openNavigation(lat: number, lng: number, label: string) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  window.open(url, "_blank");
}

export default function DriverMapView() {
  const [loading, setLoading] = useState(true);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const { user, loading: userLoading } = useUser();
  const { latitude, longitude, loading: geoLoading } = useGeolocation({ watch: true });
  const { trip, loading: tripLoading, updateStatus } = useActiveTrip(user?.id);
  const { messages, send, sendFile, emitTyping, isTyping, typingLabel } = useTripChat(trip?.id || null, user?.id || null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const handleChatSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    await send(chatInput);
    setChatInput("");
  }, [chatInput, send]);

  const handlePhotoPick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    await sendFile(file);
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [sendFile]);

  const toggleRecording = useCallback(async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `audio_${Date.now()}.webm`, { type: "audio/webm" });
        setUploadingFile(true);
        await sendFile(file);
        setUploadingFile(false);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
    } catch {}
  }, [recording, sendFile]);

  const isWorking = tripLoading || loading || userLoading;

  return (
    <>
      {isWorking ? (
        <div className="w-full h-dvh bg-background flex items-center justify-center">
          <div className="space-y-4 text-center">
            <Skeleton className="w-16 h-16 rounded-full mx-auto" />
            <Skeleton className="h-5 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      ) : (
        <div className="relative w-full h-dvh bg-background text-foreground overflow-hidden">
      <SosButton driverId={user?.id} />
      {/* Full-screen OpenStreetMap */}
      <div className="absolute inset-0 z-0">
        {latitude && longitude ? (
          <OpenStreetMap
            center={{ lat: latitude, lng: longitude }}
            zoom={15}
            userLocation={{ lat: latitude, lng: longitude }}
            showUserLocation={true}
            pickup={trip ? { lat: trip.originLat, lng: trip.originLng } : null}
            destination={trip ? { lat: trip.destLat, lng: trip.destLng } : null}
            interactive={true}
            height="100%"
          />
        ) : (
          <OpenStreetMap
            center={{ lat: -23.561, lng: -46.656 }}
            zoom={14}
            interactive={true}
            height="100%"
          />
        )}
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
                className={`glass-panel p-3 rounded-full ${showHeatMap ? "border-primary/50" : ""}`}
              >
                <Layers className={`w-5 h-5 ${showHeatMap ? "text-primary" : ""}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-panel p-3 rounded-full"
                onClick={() => {
                  if (latitude && longitude) {
                    openNavigation(latitude, longitude, "Minha localização");
                  }
                }}
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
              <span className="text-sm font-bold">{trip ? "Em corrida" : "Online"}</span>
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
            <AnimatePresence mode="wait">
              {trip ? (
                <motion.div
                  key="ride-card"
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
                            <span className="font-semibold">{STATUS_LABELS[trip.status] || trip.status}</span>
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
                              <h2 className="font-bold">{STATUS_LABELS[trip.status] || "Viagem"}</h2>
                            </div>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMinimized(true)}>
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            </motion.button>
                          </div>

                          {/* Passenger Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                              {trip.passengerName.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-lg">{trip.passengerName}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                  {trip.passengerRating.toFixed(1)}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  ~{trip.estimatedDurationMin} min
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Route */}
                          <div className="bg-background border border-card-border rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col items-center gap-1 mt-0.5">
                                <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                                <div className="w-0.5 h-8 bg-gray-600" />
                                <div className="w-3 h-3 rounded-full bg-red-400 shrink-0" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{trip.originAddress}</p>
                                <p className="text-xs text-gray-500">Origem</p>
                                <p className="text-sm font-medium mt-2">{trip.destAddress}</p>
                                <p className="text-xs text-gray-500">Destino</p>
                              </div>
                            </div>
                          </div>

                          {/* Status Action */}
                          {STATUS_ACTIONS[trip.status] && (
                            <div className="grid grid-cols-2 gap-2">
                              {STATUS_ACTIONS[trip.status].map(action => (
                                <motion.button
                                  key={action.next}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={async () => {
                                    triggerHaptic("medium");
                                    await updateStatus(action.next);
                                  }}
                                  className="glass-panel p-3 flex flex-col items-center gap-1 border-primary/30"
                                >
                                  <action.icon className="w-5 h-5 text-primary" />
                                  <span className="text-xs">{action.label}</span>
                                </motion.button>
                              ))}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="grid grid-cols-4 gap-2">
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => openNavigation(trip.destLat, trip.destLng, trip.destAddress)}
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
                              onClick={() => window.open(`tel:${trip.passengerName}`, "_blank")}
                              className="glass-panel p-3 flex flex-col items-center gap-1"
                            >
                              <Phone className="w-5 h-5 text-green-400" />
                              <span className="text-xs">Ligar</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="glass-panel p-3 flex flex-col items-center gap-1 border-red-500/30"
                              onClick={async () => {
                                triggerHaptic("warning");
                                await updateStatus("CANCELLED");
                              }}
                            >
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                              <span className="text-xs">Cancelar</span>
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                /* Empty state when no ride */
                <motion.div
                  key="empty"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="max-w-md mx-auto w-full"
                >
                  <div className="glass-panel p-5 text-center">
                    <Navigation className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                    <p className="font-semibold">Aguardando solicitações</p>
                    <p className="text-xs text-gray-500 mt-1">Você será notificado quando houver uma corrida</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Chat Panel Overlay */}
      <AnimatePresence>
        {showChat && trip && (
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
                  {trip.passengerName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{trip.passengerName}</p>
                  <p className="text-xs text-primary">Online</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {uploadingFile && (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              )}
              {messages.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">Nenhuma mensagem ainda. Envie uma mensagem para o passageiro.</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                      msg.senderId === user?.id
                        ? "bg-primary text-background rounded-br-md"
                        : "bg-background border border-card-border text-white rounded-bl-md"
                    }`}>
                      {msg.fileType === "image" && msg.fileUrl ? (
                        <img src={msg.fileUrl} alt="Foto" className="rounded-xl max-w-full max-h-40 mb-1 object-cover cursor-pointer"
                          onClick={() => window.open(msg.fileUrl, "_blank")} />
                      ) : msg.fileType === "audio" && msg.fileUrl ? (
                        <audio controls src={msg.fileUrl} className="max-w-full h-8" />
                      ) : null}
                      {msg.content && <p>{msg.content}</p>}
                      <p className={`text-[10px] mt-0.5 ${msg.senderId === user?.id ? "text-background/60" : "text-gray-500"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-background border border-card-border px-4 py-2 rounded-2xl rounded-bl-md text-xs text-gray-400 italic">
                    {typingLabel}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-card-border">
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}
                  className="w-10 h-10 rounded-xl bg-background border border-card-border flex items-center justify-center hover:border-primary/30 transition shrink-0 disabled:opacity-30">
                  <Image className="w-4 h-4 text-gray-400" />
                </button>
                <button type="button" onClick={toggleRecording} disabled={uploadingFile}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition shrink-0 disabled:opacity-30 ${
                    recording ? "bg-red-500 border-red-500 animate-pulse" : "bg-background border-card-border hover:border-primary/30"
                  }`}>
                  {recording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-gray-400" />}
                </button>
                <input value={chatInput} onChange={e => { setChatInput(e.target.value); emitTyping(); }}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/50 transition"
                />
                <button type="submit" disabled={!chatInput.trim() || uploadingFile}
                  className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-30 shrink-0">
                  <Send className="w-4 h-4 text-background" />
                </button>
              </form>
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


