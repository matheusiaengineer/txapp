"use client";

import { useState, useEffect } from "react";
import { SkeletonList } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Camera,
  Car,
  Shield,
  ChevronRight,
  User,
  Hash,
  Calendar,
  Palette,
  FileCheck,
  ScanLine,
  Video,
} from "lucide-react";
import { VideoIntro } from "@/lib/components/video-intro";

interface DocumentItem {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  status: "approved" | "pending" | "rejected" | "not_uploaded";
  required: boolean;
}

const documents: DocumentItem[] = [
  { id: "1", name: "CNH", description: "Carteira Nacional de Habilitação", icon: FileText, status: "approved", required: true },
  { id: "2", name: "CRLV", description: "Certificado de Registro e Licenciamento", icon: FileText, status: "approved", required: true },
  { id: "3", name: "Foto do Rosto", description: "Selfie segurando documento", icon: Camera, status: "approved", required: true },
  { id: "4", name: "Comprovante de Residência", description: "Conta de luz, água ou telefone", icon: FileText, status: "pending", required: true },
  { id: "5", name: "Certidão de Antecedentes", description: "Certidão cível e criminal", icon: Shield, status: "pending", required: true },
  { id: "6", name: "Foto do Veículo", description: "Foto externa e interna do carro", icon: Car, status: "not_uploaded", required: true },
  { id: "7", name: "Comprovante de Seguro", description: "Apólice de seguro vigente", icon: FileText, status: "rejected", required: true },
  { id: "8", name: "Conta Bancária", description: "Dados bancários para recebimento", icon: FileText, status: "not_uploaded", required: false },
];

function getStatusIcon(status: string) {
  switch (status) {
    case "approved": return CheckCircle;
    case "pending": return Clock;
    case "rejected": return AlertCircle;
    default: return Upload;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "approved": return "text-primary";
    case "pending": return "text-yellow-400";
    case "rejected": return "text-red-400";
    default: return "text-gray-400";
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case "approved": return "bg-primary/15";
    case "pending": return "bg-yellow-400/15";
    case "rejected": return "bg-red-400/15";
    default: return "bg-white/5";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "approved": return "Aprovado";
    case "pending": return "Em análise";
    case "rejected": return "Rejeitado";
    default: return "Pendente";
  }
}

export default function DriverKYC() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"documents" | "vehicle" | "background">("documents");
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const approvedCount = documents.filter((d) => d.status === "approved").length;
  const totalRequired = documents.filter((d) => d.required).length;
  const progress = Math.round((approvedCount / totalRequired) * 100);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {loading ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SkeletonList count={6} />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl sm:text-3xl font-bold">Verificação de motorista</h1>
            <p className="text-sm text-gray-400 mt-1">Complete seu cadastro para começar a dirigir</p>
          </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5 sm:p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold">Progresso da verificação</h2>
              <p className="text-sm text-gray-400">
                {approvedCount} de {totalRequired} documentos obrigatórios
              </p>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-primary">{progress}%</div>
          </div>
          <div className="bg-background border border-card-border rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 relative"
            >
              <div className="absolute inset-0 bg-white/10 rounded-full" />
            </motion.div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          {[
            { key: "documents" as const, label: "Documentos", icon: FileText },
            { key: "vehicle" as const, label: "Veículo", icon: Car },
            { key: "background" as const, label: "Antecedentes", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-background"
                    : "glass-panel text-gray-400 hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {documents.map((doc) => {
                const StatusIcon = getStatusIcon(doc.status);
                return (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass-panel p-4 flex items-center gap-4 ${
                      doc.status === "rejected" ? "border-red-500/30" : ""
                    } ${doc.status === "approved" ? "border-primary/20" : ""}`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${getStatusBg(doc.status)} flex items-center justify-center shrink-0`}>
                      <doc.icon className={`w-5 h-5 ${getStatusColor(doc.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{doc.name}</p>
                        {doc.required && (
                          <span className="text-xs text-red-400 font-medium">Obrigatório</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{doc.description}</p>
                      {doc.status === "rejected" && (
                        <p className="text-xs text-red-400 mt-1">
                          Motivo: Documento ilegível. Envie uma foto com melhor resolução.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.status === "approved" ? (
                        <span className="text-xs text-primary font-medium">Verificado</span>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                            doc.status === "rejected"
                              ? "bg-red-400/15 text-red-400"
                              : "bg-primary/15 text-primary"
                          }`}
                        >
                          <Upload className="w-3 h-3" />
                          {doc.status === "rejected" ? "Reenviar" : "Enviar"}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === "vehicle" && (
            <motion.div
              key="vehicle"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Vehicle info form */}
              <div className="glass-panel p-5 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  Informações do veículo
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Marca</label>
                      <div className="flex items-center gap-2 bg-background border border-card-border rounded-xl px-4 py-3">
                        <Car className="w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Ex: Toyota"
                          defaultValue="Toyota"
                          className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Modelo</label>
                      <div className="flex items-center gap-2 bg-background border border-card-border rounded-xl px-4 py-3">
                        <Car className="w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Ex: Corolla"
                          defaultValue="Corolla"
                          className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Ano</label>
                      <div className="flex items-center gap-2 bg-background border border-card-border rounded-xl px-4 py-3">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Ex: 2022"
                          defaultValue="2022"
                          className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Cor</label>
                      <div className="flex items-center gap-2 bg-background border border-card-border rounded-xl px-4 py-3">
                        <Palette className="w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Ex: Prata"
                          defaultValue="Prata"
                          className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Placa</label>
                    <div className="flex items-center gap-2 bg-background border border-card-border rounded-xl px-4 py-3">
                      <Hash className="w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Ex: ABC-1234"
                        defaultValue="ABC-1234"
                        className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Capacidade (passageiros)</label>
                      <div className="flex items-center gap-2 bg-background border border-card-border rounded-xl px-4 py-3">
                        <User className="w-4 h-4 text-gray-500" />
                        <input
                          type="number"
                          placeholder="4"
                          defaultValue="4"
                          className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Categoria</label>
                      <div className="flex items-center gap-2 bg-background border border-card-border rounded-xl px-4 py-3">
                        <Car className="w-4 h-4 text-gray-500" />
                        <select className="bg-transparent border-none outline-none w-full text-sm text-white appearance-none cursor-pointer">
                          <option value="pop" className="bg-[#1c1c1c]">TXD Pop</option>
                          <option value="comfort" className="bg-[#1c1c1c]">TXD Comfort</option>
                          <option value="black" className="bg-[#1c1c1c]">TXD Black</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all hover:scale-[0.98] mt-2"
                  >
                    Salvar informações
                  </motion.button>
                </div>
              </div>

              {/* Vehicle photos */}
              <div className="glass-panel p-5 sm:p-6">
                <h3 className="font-semibold mb-4">Fotos do veículo</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["Frente", "Traseira", "Lado direito", "Interior"].map((angle) => (
                    <motion.button
                      key={angle}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="aspect-square rounded-2xl border-2 border-dashed border-card-border bg-background flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <Camera className="w-6 h-6 text-gray-500" />
                      <span className="text-xs text-gray-500">{angle}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "background" && (
            <motion.div
              key="background"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Background Check */}
              <div className="glass-panel p-5 sm:p-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Verificação de antecedentes
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  A verificação de antecedentes é obrigatória para todos os motoristas.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-background border border-card-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Consulta criminal</p>
                        <p className="text-xs text-gray-500">Verificação em andamento</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                      <Clock className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background border border-card-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Verificação de identidade</p>
                        <p className="text-xs text-gray-600">Aguardando documentos</p>
                      </div>
                    </div>
                    <AlertCircle className="w-4 h-4 text-gray-600" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background border border-card-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Verificação de endereço</p>
                        <p className="text-xs text-gray-600">Documento em análise</p>
                      </div>
                    </div>
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                  <p className="text-xs text-yellow-400">
                    A verificação pode levar até 48 horas úteis. Você receberá uma notificação quando for concluída.
                  </p>
                </div>
              </div>

              {/* Selfie Capture */}
              <div className="glass-panel p-5 sm:p-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-primary" />
                  Captura de selfie
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Tire uma selfie segurando seu documento de identificação ao lado do rosto.
                </p>
                {showSelfieCapture ? (
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#0a0a0a] border-2 border-primary/30">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-primary/40" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowSelfieCapture(false)}
                        className="bg-primary hover:bg-primary-hover text-background font-bold px-6 py-3.5 rounded-full transition-all hover:scale-[0.98] text-sm"
                      >
                        Capturar foto
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowSelfieCapture(true)}
                    className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-card-border bg-background flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors"
                  >
                    <Camera className="w-10 h-10 text-gray-500" />
                    <span className="text-sm text-gray-400">Clique para abrir a câmera</span>
                    <span className="text-xs text-gray-600">Selfie com documento</span>
                  </motion.button>
                )}
              </div>

              {/* Video Introduction */}
              <div className="glass-panel p-5 sm:p-6">
                <VideoIntro onCapture={(blob) => console.log("Video captured:", blob.size)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )}
    </div>
  );
}

