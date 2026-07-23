"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/browser"
import { useRouter } from "next/navigation"

export default function DroneDashboardLayout({ children }: { children: React.ReactNode }) {
  const [activeTrip, setActiveTrip] = useState<any>(null)
  const [isFlying, setIsFlying] = useState(false)
  const [droneStatus, setDroneStatus] = useState("IDLE")
  const router = useRouter()

  const takeoff = async () => {
    setIsFlying(true)
    setDroneStatus("AIRBORNE")
    // Simulate drone takeoff
    setTimeout(() => {
      alert("🚁 Drone decolou! Iniciando mapeamento 360°...")
      router.push("/dashboard/drone/360-image")
    }, 2000)
  }

  const land = () => {
    setIsFlying(false)
    setDroneStatus("LANDED")
    alert("🛬 Drone pousado com sucesso!")
  }

  return (
    <div className="min-h-screen bg-background text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-black to-emerald-900/10 z-0" />

      <div className="relative z-10 px-4 pt-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              🚁 Painel de Drone - TXAP
            </h1>
            <p className="text-sm text-gray-400 mt-1">Sistema de Imagens Aéreas 360°</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-card-bg/50 backdrop-blur rounded-full border border-emerald-500/30">
              <span className="text-xs text-emerald-400 font-medium">Status: {droneStatus}</span>
            </div>
            <div className="px-3 py-1 bg-card-bg/50 backdrop-blur rounded-full border border-emerald-500/30">
              <span className="text-xs text-emerald-400 font-medium">Bateria: 85%</span>
            </div>
          </div>
        </div>

        {droneStatus === "IDLE" ? (
          <div className="flex items-center justify-center py-12">
            <button
              onClick={takeoff}
              className="w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center hover:scale-105 transition-all shadow-2xl shadow-emerald-500/30"
            >
              <span className="text-6xl">🚁</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-card-bg/50 backdrop-blur border border-emerald-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">🎯 Missão Ativa</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Altitude:</span>
                  <span className="text-emerald-400">380m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Velocidade:</span>
                  <span className="text-emerald-400">15m/s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Direção:</span>
                  <span className="text-emerald-400">NE (45°)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Câmera:</span>
                  <span className="text-emerald-400">360° Visão Total</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Imagens capturadas:</span>
                  <span className="text-emerald-400 font-bold">0/45</span>
                </div>
              </div>
            </div>

            <button
              onClick={land}
              className="w-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold py-3 rounded-xl hover:bg-red-500/30 transition-colors"
            >
              🛬 Pousar Drone
            </button>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-card-bg/90 backdrop-blur border-t border-emerald-500/20 px-4 py-3 z-50">
        <div className="flex justify-around">
          <button onClick={() => router.push("/dashboard/drone")} className="flex flex-col items-center text-emerald-400 text-xs gap-1">
            <span>🏠</span><span>Início</span>
          </button>
          <button onClick={() => router.push("/dashboard/drone/360-image")} className="flex flex-col items-center text-gray-500 text-xs gap-1">
            <span>📸</span><span>360°</span>
          </button>
          <button onClick={() => router.push("/dashboard/drone/map")} className="flex flex-col items-center text-gray-500 text-xs gap-1">
            <span>🗺️</span><span>Mapa</span>
          </button>
          <button onClick={() => router.push("/dashboard/drone/settings")} className="flex flex-col items-center text-gray-500 text-xs gap-1">
            <span>⚙️</span><span>Config</span>
          </button>
        </div>
      </nav>

      <main className="relative z-20 pb-24">
        {children}
      </main>
    </div>
  )
}
