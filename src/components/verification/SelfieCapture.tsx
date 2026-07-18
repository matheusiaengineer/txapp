"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, RefreshCw, CheckCircle2, ScanFace } from "lucide-react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/haptics";

export function SelfieCapture({ onCaptureSuccess }: { onCaptureSuccess: (url: string) => void }) {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const capture = useCallback(() => {
    triggerHaptic("medium");
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImageSrc(imageSrc);
      triggerHaptic("success");
    }
  }, [webcamRef]);

  const handleConfirm = () => {
    if (imageSrc) {
      onCaptureSuccess(imageSrc);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border border-card-border rounded-xl bg-card-bg">
      <h3 className="font-semibold text-lg">Tirar Selfie de Segurança</h3>
      <p className="text-sm text-gray-400 text-center">Posicione seu rosto no centro da câmera em um local bem iluminado.</p>
      
      {!imageSrc ? (
        <div className="relative w-full max-w-sm rounded-xl overflow-hidden aspect-[3/4] bg-black flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(62,203,142,0.1)]">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{ facingMode: "user" }}
          />
          
          {/* Face Outline Guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
            <div className="w-full h-2/3 border-2 border-dashed border-primary/50 rounded-[40%] relative">
               <ScanFace className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-primary/30" />
            </div>
          </div>
          
          {/* Neon Scanner Line */}
          <motion.div 
            className="absolute left-0 right-0 h-1 bg-primary/80 shadow-[0_0_15px_rgba(62,203,142,0.8)] pointer-events-none"
            animate={{ top: ["10%", "90%", "10%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          
          {/* HUD corners */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary/70 pointer-events-none" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary/70 pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary/70 pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary/70 pointer-events-none" />

          <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
            <button
              onClick={capture}
              className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white hover:scale-105 transition-transform hover:bg-white/30"
            >
              <Camera className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-sm rounded-xl overflow-hidden aspect-[3/4] border-2 border-green-500">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt="Selfie" className="w-full h-full object-cover" />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={() => setImageSrc(null)}
              className="p-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-primary text-black font-bold rounded-full flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" /> Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
