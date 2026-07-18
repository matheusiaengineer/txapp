"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Camera, Shield, CheckCircle, ChevronRight, ArrowLeft, ScanLine, Video,
} from "lucide-react";
import Link from "next/link";
import { SkeletonList } from "@/components/ui/skeleton";
import { SelfieCapture } from "@/lib/components/selfie-capture";
import { VideoIntro } from "@/lib/components/video-intro";

type Step = "intro" | "selfie" | "video" | "done";

export default function VerificationPage() {
  const [step, setStep] = useState<Step>("intro");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {step !== "intro" && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setStep("intro")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </motion.button>
        )}

        {loading ? (
          <SkeletonList count={5} />
        ) : (
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {step === "intro" && (
            <>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Verificação de identidade</h1>
                <p className="text-sm text-gray-400 mt-1">Complete 3 etapas rápidas para desbloquear todos os recursos</p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: ScanLine, title: "Selfie com documento", desc: "Tire uma foto do seu rosto segurando um documento", status: selfie ? "done" : "pending" },
                  { icon: Video, title: "Vídeo de apresentação", desc: "Grave um vídeo curto se apresentando (opcional, mas recomendado)", status: videoBlob ? "done" : "pending" },
                  { icon: Shield, title: "Revisão", desc: "Nossa equipe analisa e libera em até 24h", status: "pending" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className={`glass-panel p-4 flex items-center gap-4 ${
                      item.status === "done" ? "border-primary/20" : ""
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        item.status === "done" ? "bg-primary/15" : "bg-white/5"
                      }`}>
                        {item.status === "done" ? (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        ) : (
                          <Icon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      {item.status === "pending" && (
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setStep("selfie")}
                className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" /> Iniciar verificação
              </button>

              <p className="text-xs text-gray-600 text-center">
                Seus dados são protegidos com criptografia de ponta a ponta
              </p>

              <Link
                href="/dashboard/passenger"
                className="block text-center text-sm text-gray-500 hover:text-white transition-colors"
              >
                Pular, farei depois
              </Link>
            </>
          )}

          {step === "selfie" && (
            <div className="glass-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-primary" /> Selfie com documento
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Posicione seu documento ao lado do rosto e tire uma selfie
              </p>

              {selfie ? (
                <div className="space-y-3">
                  <img src={selfie} alt="Selfie" className="w-full rounded-2xl border border-card-border" />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelfie(null)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm"
                    >
                      Refazer
                    </button>
                    <button
                      onClick={() => setStep("video")}
                      className="flex-1 bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl transition-all text-sm"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              ) : (
                <SelfieCapture
                  onCapture={(blob) => setSelfie(URL.createObjectURL(blob))}
                  livenessRequired={false}
                  onSkip={() => setStep("video")}
                />
              )}
              {error && (
                <p className="text-sm text-red-400 mt-2">{error}</p>
              )}
            </div>
          )}

          {step === "video" && (
            <div className="glass-panel p-5 sm:p-6">
              <VideoIntro
                onCapture={(blob) => setVideoBlob(blob)}
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setStep("selfie")}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm"
                >
                  Voltar
                </button>
                <button
                  onClick={() => { setStep("done"); }}
                  className="flex-1 bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl transition-all text-sm"
                >
                  {videoBlob ? "Finalizar" : "Pular e finalizar"}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Verificação enviada!</h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Seus documentos foram recebidos. Nossa equipe irá analisar e você receberá uma notificação em até 24 horas.
              </p>
              <Link
                href="/dashboard/passenger"
                className="inline-block bg-primary hover:bg-primary-hover text-background font-bold py-3 px-8 rounded-xl transition-all text-sm mt-4"
              >
                Ir para o dashboard
              </Link>
            </div>
          )}
        </motion.div>
        )}
      </div>
    </div>
  );
}
