"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, FileText, CheckCircle2, ShieldAlert, Mail, Phone, UploadCloud, Clock } from "lucide-react";
import Link from "next/link";

export default function VerificationPage() {
  const [progress, setProgress] = useState(35); // Exemplo visual

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

        {/* CHECKLIST */}
        <div className="space-y-4 mb-10">
          
          <VerificationItem 
            title="Email Confirmado" 
            status="approved" 
            icon={<Mail />} 
          />
          
          <VerificationItem 
            title="Telefone Confirmado" 
            status="pending" 
            icon={<Phone />} 
            action="Confirmar SMS"
          />

          <VerificationItem 
            title="Documento de Identidade (CNH)" 
            status="pending" 
            icon={<FileText />} 
            action="Fazer Upload"
          />

          <VerificationItem 
            title="Selfie de Segurança" 
            status="pending" 
            icon={<Camera />} 
            action="Tirar Foto"
          />
          
        </div>

        <motion.div className="flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <p className="text-sm text-gray-500 text-center max-w-lg">
            Nenhuma funcionalidade da plataforma estará acessível até que o seu status seja atualizado para APPROVED pelos nossos administradores.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function VerificationItem({ title, status, icon, action }: any) {
  const isApproved = status === "approved";
  return (
    <div className={`glass-panel p-5 flex items-center justify-between ${isApproved ? 'border-primary/30' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${isApproved ? 'bg-primary/20 text-primary' : 'bg-card-bg text-gray-400'}`}>
          {isApproved ? <CheckCircle2 className="w-6 h-6" /> : icon}
        </div>
        <span className={`font-semibold ${isApproved ? 'text-white' : 'text-gray-300'}`}>{title}</span>
      </div>
      
      {!isApproved && (
        <button className="px-4 py-2 bg-card-bg hover:bg-[#2a2a2a] border border-card-border rounded-lg text-sm transition-colors flex items-center gap-2">
          <UploadCloud className="w-4 h-4" /> {action}
        </button>
      )}
    </div>
  );
}
