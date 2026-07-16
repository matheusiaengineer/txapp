"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, RefreshCw, Check, Smile, Eye, AlertTriangle, ArrowLeft,
  ArrowRight, Loader2, ChevronRight,
} from "lucide-react";
import { LivenessDetector, getRandomizedGestures, getTotalLivenessDuration } from "@/lib/auth/liveness-detection";

interface LivenessCaptureProps {
  onComplete: (result: { passed: boolean; bestFrame?: string }) => void;
  onCancel?: () => void;
}

type Step = "intro" | "capturing" | "processing" | "result";

export function LivenessCapture({ onComplete, onCancel }: LivenessCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<LivenessDetector | null>(null);
  const [step, setStep] = useState<Step>("intro");
  const [error, setError] = useState<string | null>(null);
  const [gestures] = useState(() => getRandomizedGestures());
  const [currentGesture, setCurrentGesture] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ passed: boolean; bestFrame?: string } | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    return () => {
      detectorRef.current?.destroy();
    };
  }, []);

  const handleStart = useCallback(async () => {
    setStep("capturing");
    setError(null);

    const detector = new LivenessDetector();
    const ok = await detector.initialize();
    if (!ok) {
      setError("Permissão de câmera negada");
      setStep("intro");
      return;
    }

    detectorRef.current = detector;

    setTimeout(() => {
      if (videoRef.current && canvasRef.current) {
        detector.setVideoElement(videoRef.current);
        detector.setCanvasElement(canvasRef.current);
        setCameraReady(true);
      }
    }, 100);
  }, []);

  const handleCapture = useCallback(async () => {
    const detector = detectorRef.current;
    if (!detector || !cameraReady) return;

    setStep("processing");

    try {
      const livenessResult = await detector.processGestures(
        gestures,
        (stepIdx) => setCurrentGesture(stepIdx),
        setProgress,
      );

      const result = {
        passed: livenessResult.passed,
        bestFrame: livenessResult.bestFrame,
      };
      setResult(result);
      setStep("result");
      onComplete(result);
    } catch (err: any) {
      setError(err.message || "Erro durante a captura");
      setStep("intro");
    }
  }, [gestures, cameraReady, onComplete]);

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-bold">Verificação de Prova de Vida</h3>
            <p className="text-sm text-gray-400">
              Vamos pedir que você faça alguns gestos para garantir que é uma pessoa real.
              <br />São {gestures.length} gestos, leva cerca de 15 segundos.
            </p>
            <div className="space-y-2 text-left">
              {gestures.map((g, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {g.gesture === "smile" ? <Smile className="w-4 h-4 text-primary" /> :
                     g.gesture === "blink" ? <Eye className="w-4 h-4 text-primary" /> :
                     g.gesture === "left" ? <ArrowLeft className="w-4 h-4 text-primary" /> :
                     <ArrowRight className="w-4 h-4 text-primary" />}
                  </div>
                  <span>{g.instruction}</span>
                </div>
              ))}
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <div className="flex gap-3">
              {onCancel && (
                <button onClick={onCancel} className="flex-1 py-3 bg-card-bg border border-card-border rounded-xl text-sm hover:bg-[#2a2a2a] transition-colors">
                  Cancelar
                </button>
              )}
              <button onClick={handleStart} className="flex-1 bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl transition-all hover:scale-[0.98]">
                Começar
              </button>
            </div>
          </motion.div>
        )}

        {step === "capturing" && (
          <motion.div key="capturing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="relative overflow-hidden rounded-xl bg-black aspect-[4/3]">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-sm">
                  {gestures[currentGesture]?.instruction || "Prepare-se..."}
                </p>
              </div>
            </div>
            {cameraReady && (
              <button onClick={handleCapture} className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[0.98]">
                <Camera className="w-5 h-5" /> Iniciar Captura
              </button>
            )}
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <p className="text-gray-400">Processando verificação...</p>
            <div className="w-full bg-card-bg rounded-full h-2 overflow-hidden max-w-xs mx-auto">
              <motion.div className="bg-primary h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
          </motion.div>
        )}

        {step === "result" && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center py-6 space-y-4">
            {result.passed ? (
              <>
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-primary">Verificação concluída!</h3>
                <p className="text-sm text-gray-400">Prova de vida confirmada com sucesso.</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-red-400">Vericação falhou</h3>
                <p className="text-sm text-gray-400">Não foi possível confirmar sua identidade. Tente novamente.</p>
                <button onClick={() => { setStep("intro"); setResult(null); }}
                  className="bg-primary hover:bg-primary-hover text-background font-bold py-3 px-6 rounded-xl transition-all">
                  Tentar novamente
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
