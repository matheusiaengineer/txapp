"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, FileText, CheckCircle2, ShieldAlert, Mail, Phone, ChevronRight, ArrowLeft } from "lucide-react";
import { FileUpload } from "@/components/verification/FileUpload";
import { SelfieCapture } from "@/components/verification/SelfieCapture";

export default function VerificationPage() {
  const [progress, setProgress] = useState(35);
  
  // States for verification steps
  const [activeStep, setActiveStep] = useState<string | null>(null);
  
  // Dummy statuses
  const [statuses, setStatuses] = useState({
    email: "approved",
    phone: "pending",
    cnh: "pending",
    selfie: "pending"
  });

  const handleDocumentSuccess = (url: string) => {
    setStatuses(prev => ({ ...prev, cnh: "approved" }));
    setProgress(p => Math.min(p + 30, 100));
    setActiveStep(null);
  };

  const handleSelfieSuccess = (url: string) => {
    setStatuses(prev => ({ ...prev, selfie: "approved" }));
    setProgress(p => Math.min(p + 35, 100));
    setActiveStep(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl mt-10">
        
        {/* CABEÇALHO */}
        <header className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-card-bg border border-card-border rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <ShieldAlert className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Trust & Safety Engine</h1>
          <p className="text-gray-400">Verificação de Identidade. Seu status atual é <span className="text-yellow-500 font-bold">PENDING_VERIFICATION</span></p>
        </header>

        {/* PROGRESSO */}
        <div className="w-full bg-card-bg rounded-full h-4 mb-2 overflow-hidden border border-card-border">
          <motion.div 
            className="bg-primary h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="text-right text-sm text-primary font-bold mb-8">{progress}% Concluído</div>

        {/* CONTENT AREA */}
        <AnimatePresence mode="wait">
          {!activeStep ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 mb-10"
            >
              <VerificationItem 
                title="Email Confirmado" 
                status={statuses.email}
                icon={<Mail />} 
              />
              
              <VerificationItem 
                title="Telefone Confirmado" 
                status={statuses.phone}
                icon={<Phone />} 
                action="Confirmar SMS"
                onClick={() => {}}
              />

              <VerificationItem 
                title="Documento de Identidade (CNH)" 
                status={statuses.cnh}
                icon={<FileText />} 
                action="Fazer Upload"
                onClick={() => setActiveStep("cnh")}
              />

              <VerificationItem 
                title="Selfie de Segurança" 
                status={statuses.selfie}
                icon={<Camera />} 
                action="Tirar Foto"
                onClick={() => setActiveStep("selfie")}
              />
            </motion.div>
          ) : (
            <motion.div
              key="step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-10"
            >
              <button 
                onClick={() => setActiveStep(null)}
                className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              {activeStep === "cnh" && (
                <FileUpload label="Upload de CNH (Frente e Verso)" onUploadSuccess={handleDocumentSuccess} />
              )}

              {activeStep === "selfie" && (
                <SelfieCapture onCaptureSuccess={handleSelfieSuccess} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div className="flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <p className="text-sm text-gray-500 text-center max-w-lg">
            Nenhuma funcionalidade da plataforma estará acessível até que o seu status seja atualizado para APPROVED pelos nossos administradores.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function VerificationItem({ title, status, icon, action, onClick }: any) {
  const isApproved = status === "approved";
  return (
    <div className={`glass-panel p-5 flex items-center justify-between transition-colors ${isApproved ? 'border-primary/30' : 'hover:border-primary/50'}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${isApproved ? 'bg-primary/20 text-primary' : 'bg-card-bg text-gray-400'}`}>
          {isApproved ? <CheckCircle2 className="w-6 h-6" /> : icon}
        </div>
        <span className={`font-semibold ${isApproved ? 'text-white' : 'text-gray-300'}`}>{title}</span>
      </div>
      
      {!isApproved && (
        <button 
          onClick={onClick}
          className="px-4 py-2 bg-card-bg hover:bg-primary/20 hover:text-primary border border-card-border hover:border-primary/50 rounded-lg text-sm transition-all flex items-center gap-2"
        >
          {action} <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
