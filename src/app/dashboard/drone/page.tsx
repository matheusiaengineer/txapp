"use client"

import { useState } from "react"
import { useGeolocation } from "@/hooks/useGeolocation"
import DroneCamera from "@/components/DroneCamera"

export default function DroneImagePage() {
  const { coords, loading, error, getLocation } = useGeolocation()
  const [selectedImages, setSelectedImages] = useState<any[]>([])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        📍 Obtendo sua localização...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-error">❌ {error}</div>
        <button onClick={getLocation} className="px-6 py-3 bg-primary text-black rounded-xl font-bold cursor-pointer hover:bg-primary-hover">
          🔄 Tentar Novamente
        </button>
      </div>
    )
  }

  if (!coords) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-white">❌ Localização não disponível</div>
        <button onClick={getLocation} className="px-6 py-3 bg-primary text-black rounded-xl font-bold cursor-pointer hover:bg-primary-hover">
          📍 Obter Localização
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background text-white pb-20">
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold text-white mb-2">📸 Imagens de Drone 360°</h1>
        <p className="text-sm text-gray-400">Capture visualizações aéreas em 360° do seu entorno</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <DroneCamera userLocation={coords} onCapture={setSelectedImages} />

        {/* System Status */}
        <div className="bg-card-bg/50 backdrop-blur border border-card-border rounded-xl p-4">
          <div className="text-sm font-bold text-white mb-3">🔧 Status do Sistema</div>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Localização:</span>
              <span className="text-emerald-400">[{coords[0].toFixed(4)}, {coords[1].toFixed(4)}]</span>
            </div>
            <div className="flex justify-between">
              <span>Imagens capturadas:</span>
              <span className="text-white font-medium">{selectedImages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Modo:</span>
              <span className="text-emerald-400">VIDEO Drone Pro™</span>
            </div>
            <div className="flex justify-between">
              <span>Autonomia:</span>
              <span className="text-orange-400">85%</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-card-bg/50 backdrop-blur border border-card-border rounded-xl p-4">
          <div className="text-sm font-bold text-white mb-3">⚡ Recursos Drone 360°</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center">🔄</span>
              <span className="text-gray-300">Rotação 360°</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center">📸</span>
              <span className="text-gray-300">Captura panorâmica</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center">🔭</span>
              <span className="text-gray-300">Zoom variável</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center">🏷️</span>
              <span className="text-gray-300">Geotagging automático</span>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="bg-emerald-500/10 backdrop-blur border border-emerald-500/20 rounded-xl p-4">
          <div className="text-sm font-bold text-emerald-400 mb-3">🚀 Vantagens</div>
          <div className="text-xs text-gray-300 space-y-2">
            <div>• Visualização aérea completa de 360°</div>
            <div>• Captura simultânea de múltiplos ângulos</div>
            <div>• Dados EXIF integrados ( GPS, altitude, heading)</div>
            <div>• Exportação para modelos 3D</div>
            <div>• Partilha instantânea em tempo real</div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card-bg/90 backdrop-blur border-t border-card-border px-4 py-3">
        <div className="flex gap-3">
          <button className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-700 transition-colors">
            📥 Exportar Pacote 360°
          </button>
          <button className="flex-1 bg-emerald-500 text-black font-bold py-3 rounded-xl hover:bg-emerald-400 transition-all active:scale-[0.98]">
            🚀 Publicar no Sistema
          </button>
        </div>
      </div>
    </main>
  )
}
