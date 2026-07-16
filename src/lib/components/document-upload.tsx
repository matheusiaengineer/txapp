"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Camera, X, Check, AlertCircle, ScanLine } from "lucide-react";
import type { DocumentType } from "@/lib/auth/countries";

interface DocumentUploadProps {
  documentType: DocumentType;
  onUpload: (file: File, type: string) => void;
  onRemove: (type: string) => void;
  uploaded?: boolean;
  validating?: boolean;
  error?: string;
}

export function DocumentUpload({ documentType, onUpload, onRemove, uploaded, validating, error }: DocumentUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    onUpload(file, documentType.id);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative border-2 border-dashed rounded-xl p-5 transition-all ${
        uploaded ? "border-primary/50 bg-primary/5" :
        error ? "border-red-500/50 bg-red-500/5" :
        dragOver ? "border-primary bg-primary/10" :
        "border-card-border hover:border-primary/50 hover:bg-card-bg"
      }`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {uploaded && preview ? (
        <div className="relative">
          <img src={preview} alt="Documento" className="w-full h-36 object-cover rounded-lg" />
          <div className="absolute top-2 right-2 flex gap-2">
            <div className="bg-primary text-white p-1.5 rounded-full"><Check className="w-4 h-4" /></div>
            <button onClick={() => { setPreview(null); onRemove(documentType.id); }} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-lg">
            <span className="text-white text-sm font-medium">{documentType.id === "selfie" ? "Selfie capturada" : `${documentType.name} verificado`}</span>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="w-full flex flex-col items-center gap-3 text-center cursor-pointer">
          {validating ? (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <AlertCircle className="w-10 h-10 text-red-400" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                {documentType.id === "selfie" ? <Camera className="w-6 h-6 text-primary" /> :
                 documentType.id === "cnh" || documentType.id === "drivers_license" ? <ScanLine className="w-6 h-6 text-primary" /> :
                 <Upload className="w-6 h-6 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{documentType.id === "selfie" ? "Tirar Selfie" : `Enviar ${documentType.namePt || documentType.name}`}</p>
                <p className="text-xs text-gray-500 mt-1">Clique para upload • JPG, PNG ou PDF</p>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}
