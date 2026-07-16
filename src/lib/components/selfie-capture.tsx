"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, RefreshCw, Check, Smile, Eye, AlertTriangle } from "lucide-react";

interface SelfieCaptureProps {
  onCapture: (blob: Blob) => void;
  onSkip?: () => void;
  livenessRequired?: boolean;
}

type LivenessStep = "idle" | "blink" | "smile" | "turn" | "complete" | "error";

export function SelfieCapture({ onCapture, onSkip, livenessRequired = true }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [livenessStep, setLivenessStep] = useState<LivenessStep>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCam() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setStreaming(true);
          };
        }
      } catch {
        setError("Permissão de câmera negada. Faça upload da selfie manualmente.");
      }
    }
    startCam();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCaptured(dataUrl);
    canvas.toBlob(b => { if (b) onCapture(b); }, "image/jpeg", 0.9);
    if (livenessRequired) {
      setLivenessStep("blink");
      setTimeout(() => setLivenessStep("smile"), 2000);
      setTimeout(() => setLivenessStep("turn"), 4000);
      setTimeout(() => setLivenessStep("complete"), 6000);
    }
  }

  function retake() {
    setCaptured(null);
    setLivenessStep("idle");
    setError(null);
  }

  const livenessMessages: Record<LivenessStep, { icon: React.ReactNode; text: string }> = {
    idle: { icon: <Camera className="w-5 h-5" />, text: "" },
    blink: { icon: <Eye className="w-5 h-5" />, text: "Pisque os olhos" },
    smile: { icon: <Smile className="w-5 h-5" />, text: "Sorria" },
    turn: { icon: <RefreshCw className="w-5 h-5" />, text: "Vire o rosto levemente" },
    complete: { icon: <Check className="w-5 h-5" />, text: "Liveness verificado!" },
    error: { icon: <AlertTriangle className="w-5 h-5" />, text: "Falha na verificação" },
  };

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={retake} className="mt-4 text-primary hover:underline text-sm">Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-black aspect-[4/3]">
        {captured ? (
          <img src={captured} alt="Selfie" className="w-full h-full object-cover" />
        ) : (
          <video ref={videoRef} className="w-full h-full object-cover" playsInline />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {livenessStep !== "idle" && livenessStep !== "complete" && streaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-xl p-3 flex items-center gap-3"
          >
            {livenessMessages[livenessStep].icon}
            <span className="text-white text-sm">{livenessMessages[livenessStep].text}</span>
          </motion.div>
        )}
        {livenessStep === "complete" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 bg-primary/20 flex items-center justify-center"
          >
            <div className="bg-primary rounded-full p-4"><Check className="w-10 h-10 text-white" /></div>
          </motion.div>
        )}
      </div>

      <div className="flex gap-3">
        {captured ? (
          <>
            <button onClick={retake} className="flex-1 py-3 bg-card-bg border border-card-border rounded-xl text-white text-sm font-medium hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refazer
            </button>
            <div className="flex-1 py-3 bg-primary rounded-xl text-background text-sm font-bold text-center flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Selfie OK
            </div>
          </>
        ) : (
          <button
            onClick={capture}
            disabled={!streaming}
            className="w-full py-4 bg-primary hover:bg-primary-hover disabled:opacity-50 rounded-xl text-background font-bold flex items-center justify-center gap-3 transition-all hover:scale-[0.98]"
          >
            <Camera className="w-6 h-6" /> Capturar Selfie
          </button>
        )}
      </div>

      {onSkip && !captured && (
        <button onClick={onSkip} className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors">
          Pular por enquanto
        </button>
      )}
    </div>
  );
}
