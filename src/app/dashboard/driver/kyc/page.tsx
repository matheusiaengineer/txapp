"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import Link from "next/link";
import { compareFaces, getMatchLabel, getMatchColor } from "@/lib/auth/face-match";
import { validateCNH } from "@/lib/auth/document-validator";

type Step = "cnh" | "selfie" | "matching" | "vehicle" | "pricing" | "done";

export default function DriverKycPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("cnh");
  const [cnhFile, setCnhFile] = useState<File | null>(null);
  const [cnhBase64, setCnhBase64] = useState<string | null>(null);
  const [cnhNumber, setCnhNumber] = useState("");
  const [selfieBlob, setSelfieBlob] = useState<string | null>(null);
  
  const [vehicleType, setVehicleType] = useState("carro");
  const [placa, setPlaca] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [year, setYear] = useState("");
  const [precoPorKm, setPrecoPorKm] = useState("5");
  
  const [loading, setLoading] = useState(false);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Face Matching results
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [matchResult, setMatchResult] = useState<boolean | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const VEHICLES = [
    { id: "moto", label: "Moto", icon: "🏍️" },
    { id: "carro", label: "Carro", icon: "🚗" },
    { id: "van", label: "Van / Fiorino", icon: "🚐" },
    { id: "caminhao", label: "Caminhão", icon: "🚛" },
  ];

  // Clean stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  async function handleCnhFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setCnhFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCnhBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch {
      setError("Permissão de câmera negada. Ative as permissões nas configurações do navegador.");
    }
  }

  function captureSelfie() {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg");
    setSelfieBlob(dataUrl);
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  async function runFaceMatch() {
    if (!cnhBase64 || !selfieBlob) {
      setError("Documento ou Selfie ausente.");
      return;
    }

    setVerifyingFace(true);
    setStep("matching");
    setError(null);

    try {
      // Run CNH local OCR simulation
      const ocrRes = await validateCNH(cnhBase64);
      if (ocrRes.extractedData) {
        setExtractedData(ocrRes.extractedData);
      }

      // Run facial match simulation (structural comparison of base64)
      const matchRes = await compareFaces(selfieBlob, cnhBase64);
      setSimilarity(matchRes.similarity);
      setMatchResult(matchRes.match);

      setTimeout(() => {
        setVerifyingFace(false);
      }, 2000); // Visual scanning effect delay
    } catch (err: any) {
      setError("Falha ao analisar imagens. " + err.message);
      setVerifyingFace(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/driver/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cnhNumber,
          cnhBase64,
          selfieBase64: selfieBlob,
          vehicleCategory: vehicleType,
          licensePlate: placa,
          brand,
          model,
          color,
          year,
          pricePerKm: parseFloat(precoPorKm),
          similarityScore: similarity,
          cnhExtractedData: extractedData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar verificação");
      }

      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col text-white"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="px-4 py-4 flex items-center gap-3 border-b border-card-border bg-card-bg/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/dashboard/driver" className="text-gray-400 hover:text-white transition-colors">←</Link>
        <div>
          <h1 className="text-lg font-bold text-white">Cadastro de Motorista</h1>
          <p className="text-xs text-gray-400">
            Passo {["cnh", "selfie", "matching", "vehicle", "pricing", "done"].indexOf(step) + 1} de 6
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col justify-center">
        {error && (
          <div className="text-error text-sm bg-error/10 border border-error/20 px-4 py-3 rounded-xl mb-4">
            ⚠️ {error}
          </div>
        )}

        {/* STEP 1: CNH */}
        {step === "cnh" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <span className="text-5xl">🪪</span>
              <h2 className="text-2xl font-bold text-white mt-3">Sua CNH</h2>
              <p className="text-sm text-gray-400 mt-1">Insira o número e envie uma foto nítida do documento aberto.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1 block">Número de Registro CNH</label>
                <input
                  type="text"
                  value={cnhNumber}
                  onChange={(e) => setCnhNumber(e.target.value)}
                  placeholder="Ex: 12345678900"
                  className="w-full px-4 py-3.5 rounded-xl bg-card-bg-2 border border-card-border text-white text-base focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium mb-1 block">Foto da CNH</label>
                <div className="border-2 border-dashed border-card-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-card-bg/20 relative">
                  {!cnhBase64 ? (
                    <>
                      <span className="text-3xl block mb-2">📸</span>
                      <p className="text-sm font-semibold">Tirar ou selecionar foto</p>
                      <p className="text-xs text-gray-500 mt-1">Formatos aceitos: JPG, PNG</p>
                    </>
                  ) : (
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <img src={cnhBase64} alt="CNH preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => { setCnhFile(null); setCnhBase64(null); }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 text-xs hover:bg-black"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCnhFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("selfie")}
              disabled={!cnhNumber || !cnhBase64}
              className="w-full bg-primary text-black font-bold py-4 rounded-full disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-[0.98] mt-6"
            >
              Continuar
            </button>
          </div>
        )}

        {/* STEP 2: SELFIE */}
        {step === "selfie" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <span className="text-5xl">🤳</span>
              <h2 className="text-2xl font-bold text-white mt-3">Verificação Facial</h2>
              <p className="text-sm text-gray-400 mt-1">Tire uma selfie de segurança. Evite usar bonés ou óculos.</p>
            </div>

            {!selfieBlob ? (
              <div className="space-y-4">
                <div className="relative w-full rounded-2xl bg-black aspect-[3/4] overflow-hidden border border-card-border flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  
                  {/* Facial frame indicator overlay */}
                  <div className="absolute inset-0 border-4 border-dashed border-primary/20 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-4/5 h-2/3 border-2 border-primary/40 rounded-[50%]" />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={startCamera}
                    className="flex-1 border border-card-border hover:bg-white/5 text-white py-3.5 rounded-full text-sm font-semibold transition-colors"
                  >
                    Ligar Câmera
                  </button>
                  <button
                    onClick={captureSelfie}
                    className="flex-1 bg-primary text-black font-bold py-3.5 rounded-full text-sm transition-all active:scale-[0.97]"
                  >
                    Capturar Foto
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <img src={selfieBlob} alt="Selfie" className="w-full rounded-2xl aspect-[3/4] object-cover border-2 border-primary" />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setSelfieBlob(null); startCamera(); }}
                    className="flex-1 border border-card-border hover:bg-white/5 text-white py-3.5 rounded-full text-sm font-semibold transition-colors"
                  >
                    Refazer Foto
                  </button>
                  <button
                    onClick={runFaceMatch}
                    className="flex-1 bg-primary text-black font-bold py-3.5 rounded-full text-sm transition-all active:scale-[0.97]"
                  >
                    Analisar Biometria
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: MATCHING ANIMATION / RESULTS */}
        {step === "matching" && (
          <div className="space-y-6 text-center animate-in fade-in duration-300">
            {verifyingFace ? (
              <div className="space-y-6 py-12">
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-4xl animate-pulse">🤖</span>
                </div>
                <h2 className="text-xl font-bold">Verificando Biometria...</h2>
                <p className="text-sm text-gray-400 max-w-xs mx-auto">
                  A nossa IA está comparando as características faciais da sua selfie com a foto do seu documento CNH.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative w-28 h-28 mx-auto bg-card-bg-2 border border-card-border rounded-full flex items-center justify-center text-4xl">
                  {matchResult ? "🟢" : "⚠️"}
                </div>

                <h2 className="text-2xl font-bold">Análise Concluída</h2>

                <div className="txd-card p-5 max-w-sm mx-auto border-card-border bg-card-bg/30 rounded-2xl text-left space-y-3">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-xs text-gray-400">Match Biométrico:</span>
                    <span className={`text-sm font-bold ${getMatchColor(similarity || 0)}`}>
                      {similarity ? `${Math.round(similarity * 100)}%` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-xs text-gray-400">Resultado:</span>
                    <span className={`text-sm font-bold ${getMatchColor(similarity || 0)}`}>
                      {getMatchLabel(similarity || 0)}
                    </span>
                  </div>
                  {extractedData?.name && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Nome Extraído (OCR)</span>
                      <span className="text-sm text-white font-medium truncate">{extractedData.name}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  {matchResult 
                    ? "Sua selfie coincide perfeitamente com os dados do documento. A aprovação será imediata!"
                    : "A semelhança foi baixa ou necessita de revisão humana. Seu cadastro passará por aprovação manual."}
                </p>

                <button
                  onClick={() => setStep("vehicle")}
                  className="w-full bg-primary text-black font-bold py-4 rounded-full mt-6"
                >
                  Continuar Cadastro
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: VEHICLE */}
        {step === "vehicle" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <span className="text-5xl">🚗</span>
              <h2 className="text-2xl font-bold text-white mt-3">Seu Veículo</h2>
              <p className="text-sm text-gray-400 mt-1">Informe a categoria, placa e detalhes do veículo.</p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {VEHICLES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVehicleType(v.id)}
                  className={`p-3.5 rounded-2xl text-center border transition-all ${
                    vehicleType === v.id 
                      ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(62,203,142,0.1)]" 
                      : "bg-card-bg-2 border-card-border"
                  }`}
                >
                  <div className="text-2xl mb-1">{v.icon}</div>
                  <div className="text-[10px] text-white font-medium">{v.label}</div>
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1 block">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Chevrolet"
                    className="w-full px-4 py-3.5 rounded-xl bg-card-bg-2 border border-card-border text-white text-base focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1 block">Modelo</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ex: Onix"
                    className="w-full px-4 py-3.5 rounded-xl bg-card-bg-2 border border-card-border text-white text-base focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1 block">Placa</label>
                  <input
                    type="text"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC1D23"
                    maxLength={8}
                    className="w-full px-4 py-3.5 rounded-xl bg-card-bg-2 border border-card-border text-white text-base focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1 block">Ano</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Ex: 2021"
                    className="w-full px-4 py-3.5 rounded-xl bg-card-bg-2 border border-card-border text-white text-base focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium mb-1 block">Cor do Veículo</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Ex: Prata"
                  className="w-full px-4 py-3.5 rounded-xl bg-card-bg-2 border border-card-border text-white text-base focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => setStep("pricing")}
              disabled={!placa}
              className="w-full bg-primary text-black font-bold py-4 rounded-full disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-[0.98] mt-6"
            >
              Continuar
            </button>
          </div>
        )}

        {/* STEP 5: PRICING */}
        {step === "pricing" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <span className="text-5xl">💰</span>
              <h2 className="text-2xl font-bold text-white mt-3">Valor por Quilômetro</h2>
              <p className="text-sm text-gray-400 mt-1">Defina a sua tarifa por km. O passageiro verá seu preço final.</p>
            </div>

            <div className="txd-card p-8 text-center border-primary/20 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl">
              <div className="text-5xl font-extrabold text-primary mb-1">R$ {precoPorKm}</div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">por quilômetro rodado</div>
            </div>

            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={precoPorKm}
              onChange={(e) => setPrecoPorKm(e.target.value)}
              className="w-full h-2 bg-card-bg-2 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-500 font-semibold px-1">
              <span>R$ 1</span>
              <span>R$ 5</span>
              <span>R$ 10</span>
              <span>R$ 15</span>
              <span>R$ 20</span>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-primary text-black font-bold py-4 rounded-full txd-green-glow-sm disabled:opacity-50 transition-all active:scale-[0.98] mt-6"
            >
              {loading ? "Salvando cadastro..." : "Finalizar e Enviar"}
            </button>
          </div>
        )}

        {/* STEP 6: DONE */}
        {step === "done" && (
          <div className="space-y-6 text-center animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-success/20 border border-success/30 rounded-full flex items-center justify-center text-4xl mx-auto">
              ✓
            </div>
            <h2 className="text-2xl font-bold">Cadastro Recebido!</h2>
            
            <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
              {matchResult && similarity && similarity >= 0.75 ? (
                <span className="text-primary font-semibold">Seu cadastro foi aprovado automaticamente pela biometria facial!</span>
              ) : (
                "Seus documentos foram enviados para auditoria manual. O prazo máximo de resposta é de até 2 horas úteis."
              )}
            </p>

            <button
              onClick={() => router.push("/dashboard/driver")}
              className="w-full bg-primary text-black font-bold py-4 rounded-full mt-6 transition-all active:scale-[0.98]"
            >
              Ir para o Dashboard
            </button>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
