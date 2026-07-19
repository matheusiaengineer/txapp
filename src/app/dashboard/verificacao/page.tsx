"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Camera, Shield, CheckCircle, ChevronRight, ArrowLeft, ScanLine, Video,
  Award, Star, CreditCard, Unlock, Zap,
} from "lucide-react";
import Link from "next/link";
import { SelfieCapture } from "@/lib/components/selfie-capture";
import { VideoIntro } from "@/lib/components/video-intro";
import { useUser } from "@/lib/hooks/use-user";
import { createClient } from "@/lib/supabase/browser";

const STEPS_META = [
  { icon: ScanLine, title: "Selfie com documento", desc: "Tire uma foto do seu rosto segurando um documento" },
  { icon: Video, title: "Vídeo de apresentação", desc: "Grave um vídeo curto se apresentando (opcional, mas recomendado)" },
  { icon: Shield, title: "Revisão", desc: "Nossa equipe analisa e libera em até 24h" },
];

const BENEFITS = [
  { icon: CreditCard, label: "Limite de corridas ilimitado" },
  { icon: Star, label: "Prioridade no suporte" },
  { icon: Unlock, label: "Acesso a corridas VIP" },
  { icon: Award, label: "Selos de confiança no perfil" },
];

type Step = "intro" | "selfie" | "video" | "done";

export default function VerificationPage() {
  const { user } = useUser();
  const [step, setStep] = useState<Step>("intro");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const stepIndex = step === "intro" ? 0 : step === "selfie" ? 1 : step === "video" ? 2 : 3;
  const progress = Math.round((stepIndex / 3) * 100);

  const handleFinalize = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();

      let selfieUrl = "";
      if (selfieBlob) {
        const formData = new FormData();
        formData.append("file", new File([selfieBlob], "selfie.jpg", { type: "image/jpeg" }));
        formData.append("bucket", "verifications");
        formData.append("userId", user.id);
        formData.append("docType", "selfie_document");
        const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          selfieUrl = data.url || "";
        }
      }

      const { error: verifError } = await supabase.from("verifications").upsert({
        profile_id: user.id,
        selfie_url: selfieUrl || null,
        selfie_status: selfieUrl ? "pending" : null,
        document_type: "selfie",
      }, { onConflict: "profile_id" });

      if (verifError) throw verifError;

      setStep("done");
    } catch (err: any) {
      setError(err.message || "Erro ao enviar verificação");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {step !== "intro" && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setStep("intro")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </motion.button>
        )}

        {step !== "intro" && (
          <div className="mb-6 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Etapa {stepIndex} de 3</span>
              <span>{progress}%</span>
            </div>
            <div className="bg-background border border-card-border rounded-full h-2 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-primary h-full rounded-full" />
            </div>
          </div>
        )}

        <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {step === "intro" && (
            <>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Verificação de identidade</h1>
                <p className="text-sm text-gray-400 mt-1">Complete 3 etapas rápidas para desbloquear todos os recursos</p>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-panel p-4 border-primary/10">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Após verificado você ganha</h3>
                <div className="grid grid-cols-2 gap-2">
                  {BENEFITS.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                      <b.icon className="w-3.5 h-3.5 text-primary shrink-0" /> {b.label}
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="space-y-3">
                {STEPS_META.map((item, i) => {
                  const isDone = (i === 0 && selfie) || (i === 1 && videoBlob) || false;
                  const Icon = item.icon;
                  return (
                    <div key={i} className={`glass-panel p-4 flex items-center gap-4 ${isDone ? "border-primary/20" : ""}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDone ? "bg-primary/15" : "bg-white/5"}`}>
                        {isDone ? <CheckCircle className="w-5 h-5 text-primary" /> : <Icon className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      {!isDone && <ChevronRight className="w-4 h-4 text-gray-600" />}
                    </div>
                  );
                })}
              </div>

              <button onClick={() => setStep("selfie")}
                className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                <Camera className="w-4 h-4" /> Iniciar verificação
              </button>

              <p className="text-xs text-gray-600 text-center">Seus dados são protegidos com criptografia de ponta a ponta</p>

              <Link href="/dashboard/passenger"
                className="block text-center text-sm text-gray-500 hover:text-white transition-colors">
                Pular, farei depois
              </Link>
            </>
          )}

          {step === "selfie" && (
            <div className="glass-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-primary" /> Selfie com documento
              </h2>
              <p className="text-sm text-gray-400 mb-4">Posicione seu documento ao lado do rosto e tire uma selfie</p>

              {selfie ? (
                <div className="space-y-3">
                  <img src={selfie} alt="Selfie" className="w-full rounded-2xl border border-card-border" />
                  <div className="flex gap-2">
                    <button onClick={() => { setSelfie(null); setSelfieBlob(null); }}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm">Refazer</button>
                    <button onClick={() => setStep("video")}
                      className="flex-1 bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl transition-all text-sm">Próximo</button>
                  </div>
                </div>
              ) : (
                <SelfieCapture
                  onCapture={(blob) => { setSelfie(URL.createObjectURL(blob)); setSelfieBlob(blob); }}
                  livenessRequired={false}
                  onSkip={() => setStep("video")}
                />
              )}
              {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </div>
          )}

          {step === "video" && (
            <div className="glass-panel p-5 sm:p-6">
              <VideoIntro onCapture={(blob) => setVideoBlob(blob)} />
              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep("selfie")}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm">Voltar</button>
                <button onClick={handleFinalize} disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary-hover text-background font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? "Enviando..." : videoBlob ? "Finalizar" : "Pular e finalizar"}
                </button>
              </div>
              {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-8 space-y-5">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-primary" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold">Verificação enviada!</h2>
                <p className="text-sm text-gray-400 mt-1">Status: <span className="text-yellow-400 font-semibold">Em análise</span></p>
              </div>
              <div className="glass-panel p-4 inline-flex items-center gap-3 mx-auto text-left">
                <Award className="w-8 h-8 text-yellow-400" />
                <div className="text-sm">
                  <p className="font-semibold">Nível: <span className="text-yellow-400">Bronze</span></p>
                  <p className="text-xs text-gray-500">Após aprovação: Prata</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Seus documentos foram recebidos. Nossa equipe irá analisar e você receberá uma notificação em até 24 horas.
              </p>
              <Link href="/dashboard/passenger"
                className="inline-block bg-primary hover:bg-primary-hover text-background font-bold py-3 px-8 rounded-xl transition-all text-sm mt-2">
                Ir para o dashboard
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
