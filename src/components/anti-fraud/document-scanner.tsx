"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Check, AlertTriangle, Loader2, FileText, ScanLine } from "lucide-react";
import { validateCNH, compareNames, validateExpirationDate, type ExtractedData } from "@/lib/auth/document-validator";

interface DocumentScannerProps {
  onValidate: (result: { valid: boolean; extractedData: Partial<ExtractedData> }) => void;
  expectedName?: string;
}

export function DocumentScanner({ onValidate, expectedName }: DocumentScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; extractedData: Partial<ExtractedData> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImage(base64);
      setScanning(true);
      setError(null);

      await new Promise(r => setTimeout(r, 2000));

      const validation = await validateCNH(base64);
      setScanning(false);

      if (expectedName && validation.extractedData.name) {
        const nameMatch = compareNames(expectedName, validation.extractedData.name);
        if (nameMatch < 0.5) {
          validation.errors.push("Nome não corresponde ao cadastro");
          validation.valid = false;
        }
      }

      const isValidDate = validateExpirationDate(validation.extractedData.expirationDate || "");
      if (!isValidDate) {
        validation.errors.push("CNH vencida ou data inválida");
      }

      setResult({ valid: validation.valid, extractedData: validation.extractedData });
      onValidate({ valid: validation.valid, extractedData: validation.extractedData });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {!image ? (
        <div className="space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-card-border rounded-xl p-8 text-center hover:border-primary/50 transition cursor-pointer"
          >
            <ScanLine className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Clique para escanear o documento</p>
            <p className="text-xs text-gray-600 mt-1">CNH ou documento oficial com foto</p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> Câmera</span>
              <span className="flex items-center gap-1"><Upload className="w-3 h-3" /> Upload</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black">
            <img src={image} alt="Documento" className="w-full object-cover max-h-64" />
            {scanning && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                  <p className="text-white text-sm">Escaneando documento...</p>
                </div>
              </div>
            )}
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-4 ${result.valid ? "bg-primary/10 border border-primary/20" : "bg-red-500/10 border border-red-500/30"}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.valid ? <Check className="w-5 h-5 text-primary" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
                <span className={`font-bold ${result.valid ? "text-primary" : "text-red-400"}`}>
                  {result.valid ? "Documento válido" : "Falha na validação"}
                </span>
              </div>
              {result.extractedData.name && (
                <div className="text-xs text-gray-400 space-y-1 mt-2">
                  <p><span className="text-gray-500">Nome:</span> {result.extractedData.name}</p>
                  <p><span className="text-gray-500">CPF:</span> {result.extractedData.cpf || "—"}</p>
                  <p><span className="text-gray-500">Registro:</span> {result.extractedData.documentNumber || "—"}</p>
                  <p><span className="text-gray-500">Validade:</span> {result.extractedData.expirationDate || "—"}</p>
                </div>
              )}
            </motion.div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setImage(null); setResult(null); setError(null); }}
              className="flex-1 py-3 bg-card-bg border border-card-border rounded-xl text-sm hover:bg-[#2a2a2a] transition-colors">
              Escanear outro
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}
