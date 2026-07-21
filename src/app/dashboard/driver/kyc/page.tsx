"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import Link from "next/link";

type Step = "cnh" | "selfie" | "vehicle" | "pricing" | "done";

export default function DriverKycPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("cnh");
  const [cnhFile, setCnhFile] = useState<File | null>(null);
  const [cnhNumber, setCnhNumber] = useState("");
  const [selfieBlob, setSelfieBlob] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState("carro");
  const [placa, setPlaca] = useState("");
  const [precoPorKm, setPrecoPorKm] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const VEHICLES = [
    { id: "moto", label: "Moto", icon: "🏍️" },
    { id: "carro", label: "Carro", icon: "🚗" },
    { id: "van", label: "Van / Fiorino", icon: "🚐" },
    { id: "caminhao", label: "Caminhão", icon: "🚛" },
    { id: "carreta", label: "Carreta", icon: "🚚" },
  ];

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch {
      setError("Permissão de câmera negada");
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  }

  async function handleSave() {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Usuário não autenticado");
      setLoading(false);
      return;
    }

    const { error: upsertError } = await supabase.from("drivers").upsert({
      id: user.id,
      cnh_numero: cnhNumber,
      tipo_veiculo: vehicleType,
      placa: placa,
      preco_por_km: parseFloat(precoPorKm),
      verificado: true,
      status: "online",
    });

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }

    await supabase.from("users").update({ verificado: true }).eq("id", user.id);
    setLoading(false);
    router.push("/dashboard/driver");
  }

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="px-4 py-4 flex items-center gap-3 border-b border-card-border">
        <Link href="/dashboard/driver" className="text-gray-400">←</Link>
        <div>
          <h1 className="text-lg font-bold text-white">Cadastro de Motorista</h1>
          <p className="text-xs text-gray-400">Passo {["cnh", "selfie", "vehicle", "pricing", "done"].indexOf(step) + 1} de 5</p>
        </div>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {step === "cnh" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">CNH</h2>
            <p className="text-sm text-gray-400">Faça upload da foto da sua CNH</p>
            <input
              type="text"
              value={cnhNumber}
              onChange={(e) => setCnhNumber(e.target.value)}
              placeholder="Número da CNH"
              className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white text-base"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCnhFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary file:text-black file:font-bold"
            />
            <button onClick={() => setStep("selfie")} className="w-full bg-primary text-black font-bold py-3.5 rounded-full">
              Continuar
            </button>
          </div>
        )}

        {step === "selfie" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Verificação Facial</h2>
            <p className="text-sm text-gray-400">Posicione seu rosto na frente da câmera</p>

            {!selfieBlob ? (
              <div>
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl bg-black aspect-[3/4] object-cover" />
                <div className="flex gap-3 mt-4">
                  <button onClick={startCamera} className="flex-1 border border-white/10 text-white py-3 rounded-full text-sm">
                    Ligar câmera
                  </button>
                  <button onClick={captureSelfie} className="flex-1 bg-primary text-black font-bold py-3 rounded-full text-sm">
                    Capturar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <img src={selfieBlob} alt="Selfie" className="w-full rounded-2xl aspect-[3/4] object-cover" />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setSelfieBlob(null)} className="flex-1 border border-white/10 text-white py-3 rounded-full text-sm">
                    Refazer
                  </button>
                  <button onClick={() => setStep("vehicle")} className="flex-1 bg-primary text-black font-bold py-3 rounded-full text-sm">
                    Continuar
                  </button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {step === "vehicle" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Seu Veículo</h2>
            <p className="text-sm text-gray-400">Selecione o tipo e informe a placa</p>
            <div className="grid grid-cols-3 gap-2">
              {VEHICLES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVehicleType(v.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    vehicleType === v.id ? "bg-primary/20 border border-primary" : "bg-card-bg-2 border border-card-border"
                  }`}
                >
                  <div className="text-2xl mb-1">{v.icon}</div>
                  <div className="text-xs text-white">{v.label}</div>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="Placa: ABC-1234"
              maxLength={8}
              className="w-full px-4 py-3 rounded-xl bg-card-bg-2 border border-card-border text-white text-base"
            />
            <button onClick={() => setStep("pricing")} className="w-full bg-primary text-black font-bold py-3.5 rounded-full">
              Continuar
            </button>
          </div>
        )}

        {step === "pricing" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Qual o valor do seu quilômetro?</h2>
            <p className="text-sm text-gray-400">Você define o preço por km rodado</p>
            <div className="txd-card p-6 text-center">
              <div className="text-5xl font-bold text-primary mb-2">R$ {precoPorKm}</div>
              <div className="text-sm text-gray-400">por km</div>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={precoPorKm}
              onChange={(e) => setPrecoPorKm(e.target.value)}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>R$ 1</span><span>R$ 5</span><span>R$ 10</span><span>R$ 15</span><span>R$ 20</span>
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-primary text-black font-bold py-3.5 rounded-full txd-green-glow-sm disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Finalizar cadastro"}
            </button>

            {error && <div className="text-error text-sm bg-error/10 px-4 py-2 rounded-lg">{error}</div>}
          </div>
        )}
      </div>
    </main>
  );
}
