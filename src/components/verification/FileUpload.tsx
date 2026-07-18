"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, X } from "lucide-react";

export function FileUpload({ onUploadSuccess, label }: { onUploadSuccess: (url: string) => void, label: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      setUploading(false);
      onUploadSuccess(URL.createObjectURL(file));
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-card-border rounded-xl bg-card-bg/50">
      <div className="text-center">
        <h3 className="font-semibold text-lg">{label}</h3>
        <p className="text-sm text-gray-400">Arraste um arquivo ou clique para selecionar</p>
      </div>
      
      {!file ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 transition-colors rounded-lg"
        >
          <UploadCloud className="w-5 h-5" /> Selecionar Arquivo
        </button>
      ) : (
        <div className="flex items-center gap-4 bg-background p-3 rounded-lg border border-card-border w-full max-w-sm justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" />
            <span className="truncate text-sm font-medium">{file.name}</span>
          </div>
          <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf"
      />

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full max-w-sm py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {uploading ? "Enviando..." : "Enviar Documento"}
        </button>
      )}
    </div>
  );
}
