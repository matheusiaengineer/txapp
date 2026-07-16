"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, AlertTriangle, Loader2, User, FileText } from "lucide-react";
import { compareFaces, getMatchLabel, getMatchColor } from "@/lib/auth/face-match";

interface FaceComparisonProps {
  selfieBase64: string;
  docBase64: string;
  onResult?: (match: boolean) => void;
}

export function FaceComparison({ selfieBase64, docBase64, onResult }: FaceComparisonProps) {
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<{ match: boolean; similarity: number } | null>(null);

  const handleCompare = async () => {
    setComparing(true);
    const res = await compareFaces(selfieBase64, docBase64);
    setComparing(false);
    setResult(res);
    onResult?.(res.match);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3" /> Selfie</p>
          <div className="rounded-xl overflow-hidden bg-black aspect-[3/4]">
            <img src={selfieBase64} alt="Selfie" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-gray-400 flex items-center gap-1"><FileText className="w-3 h-3" /> Documento</p>
          <div className="rounded-xl overflow-hidden bg-black aspect-[3/4]">
            <img src={docBase64} alt="Documento" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {!result && (
        <button onClick={handleCompare} disabled={comparing}
          className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[0.98]">
          {comparing ? <><Loader2 className="w-5 h-5 animate-spin" /> Comparando...</> : <>Comparar Faces</>}
        </button>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 ${result.match ? "bg-primary/10 border border-primary/20" : "bg-red-500/10 border border-red-500/30"}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {result.match ? <Check className="w-5 h-5 text-primary" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
              <span className={`font-bold ${result.match ? "text-primary" : "text-red-400"}`}>
                {result.match ? "Faces correspondem" : "Faces não correspondem"}
              </span>
            </div>
            <span className={`font-mono font-bold ${getMatchColor(result.similarity)}`}>
              {(result.similarity * 100).toFixed(0)}%
            </span>
          </div>
          <p className={`text-xs ${getMatchColor(result.similarity)}`}>
            {getMatchLabel(result.similarity)}
          </p>
        </motion.div>
      )}
    </div>
  );
}
