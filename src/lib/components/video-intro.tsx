"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Video, Play, Square, Loader2, CheckCircle, Upload, X,
} from "lucide-react";

interface VideoIntroProps {
  onCapture: (blob: Blob) => void;
  maxDuration?: number;
}

export function VideoIntro({ onCapture, maxDuration = 15 }: VideoIntroProps) {
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const opts: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
        opts.mimeType = "video/webm;codecs=vp9,opus";
      }
      const mediaRecorder = new MediaRecorder(stream, opts);

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setPreview(url);
        onCapture(blob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(1000);
      mediaRef.current = mediaRecorder;
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      alert("Permita acesso à câmera e microfone para gravar o vídeo.");
    }
  }, [maxDuration, onCapture]);

  const stopRecording = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state === "recording") {
      mediaRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }, []);

  const reset = useCallback(() => {
    setPreview(null);
    setDuration(0);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
        <Video className="w-3 h-3 text-primary" /> Grave um vídeo curto de apresentação (máx. {maxDuration}s)
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-black/60 aspect-[4/3] flex items-center justify-center border border-card-border">
        {!preview && !recording && (
          <div className="text-center p-6">
            <Camera className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Fale quem você é e seu veículo</p>
            <p className="text-xs text-gray-600 mt-1">Ex: "Fala chefe, sou João, carreta tal, 15 anos de estrada..."</p>
          </div>
        )}

        {recording && (
          <>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500/80 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              REC {duration}s
            </div>
          </>
        )}

        {preview && (
          <video src={preview} controls playsInline className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex gap-2">
        {!recording && !preview && (
          <button onClick={startRecording}
            className="flex-1 bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
            <Video className="w-4 h-4" /> Gravar apresentação
          </button>
        )}

        {recording && (
          <button onClick={stopRecording}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
            <Square className="w-4 h-4" /> Parar ({duration}s)
          </button>
        )}

        {preview && (
          <>
            <button onClick={reset}
              className="flex-1 bg-white/5 border border-card-border text-gray-400 hover:text-white font-medium py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
              <X className="w-4 h-4" /> Refazer
            </button>
            <button
              className="flex-1 bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Confirmar
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-gray-600 text-center">
        Isso ajuda clientes a confiarem em você. Apareça apenas uma vez.
      </p>
    </div>
  );
}
