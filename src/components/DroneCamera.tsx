"use client"

import { useRef, useState } from "react"
import L from "leaflet"

interface DroneCameraProps {
  userLocation: [number, number]
  onCapture?: (images: DroneImage[]) => void
}

interface DroneImage {
  id: string
  url: string
  type: "360" | "regular"
  location: [number, number]
  timestamp: number
  heading: number
  altitude: number
}

export default function DroneCamera({ userLocation, onCapture }: DroneCameraProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [capturedImages, setCapturedImages] = useState<DroneImage[]>([])
  const [currentHeading, setCurrentHeading] = useState(0)
  const [altitude, setAltitude] = useState(100)
  const droneRef = useRef<HTMLDivElement>(null)

  const startRecording = () => {
    setIsRecording(true)
    setCurrentHeading(0)
    setAltitude(100)
  }

  const stopRecording = () => {
    setIsRecording(false)
    simulateImageCapture()
  }

  const simulateImageCapture = () => {
    const newImage: DroneImage = {
      id: Date.now().toString(),
      url: `/api/placeholder?360&heading=${currentHeading}&location=${userLocation[0]},${userLocation[1]}&
      type: "360",
      location: userLocation,
      timestamp: Date.now(),
      heading: currentHeading,
      altitude: altitude,
    }

    setCapturedImages(prev => [...prev, newImage])
    onCapture?.([...capturedImages, newImage])
  }

  const rotateDrone = (angle: number) => {
    setCurrentHeading(prev => (prev + angle) % 360)
  }

  const changeAltitude = (change: number) => {
    setAltitude(prev => Math.max(50, Math.min(500, prev + change)))
  }

  return (
    <div className="relative w-full h-64 bg-black/20 rounded-xl overflow-hidden">
      {/* Drone display area */}
      <div ref={droneRef} className="w-full h-full relative">
        {/* Drone visualization */}
        <div 
          className="absolute w-16 h-16 transition-transform"
          style={{ 
            left: '50%', 
            top: '50%', 
            transform: "translate(-50%, -50%) rotate(" + currentHeading + "deg)", 
            marginTop: (altitude * 0.3) + "px"
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              🚀
            </div>
          </div>
        </div>

        {/* 360 camera ring */}
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-2 border-dashed border-emerald-400 rounded-full animate-spin"
                 style={{ animationDuration: '3s' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Camera view indicator */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-2 rounded-full text-white text-xs font-mono">
          🗺️ [{userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}] | 🎯 {currentHeading.toFixed(0)}° | 📏 {altitude}m
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => rotateDrone(45)}
          className="w-10 h-10 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700 transition-colors"
          title="Rotate 45 degrees"
        >
          🔄45°
        </button>
        <button
          onClick={() => changeAltitude(50)}
          className="w-10 h-10 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700 transition-colors"
          title="Increase altitude"
        >
          📈
        </button>
        <button
          onClick={() => changeAltitude(-50)}
          className="w-10 h-10 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700 transition-colors"
          title="Decrease altitude"
        >
          📉
        </button>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={"w-16 h-16 rounded-full shadow-lg transition-all " + (isRecording ? "bg-red-500 animate-pulse" : "bg-emerald-500 hover:bg-emerald-400") + " text-white font-bold"}
          title={isRecording ? "Stop recording" : "Start 360 recording"}
        >
          {isRecording ? "⏹️" : "🎥"}
        </button>
      </div>

      {/* Captured images thumbnail strip */}
      {capturedImages.length > 0 && (
        <div className="absolute top-4 left-4 right-4 bg-black/60 backdrop-blur px-4 py-2 rounded-xl">
          <div className="text-xs text-white font-bold mb-2">📸 Captured 360° Views</div>
          <div className="flex gap-2 overflow-x-auto">
            {capturedImages.map(img => (
              <div key={img.id} className="w-16 h-16 rounded-lg overflow-hidden border-2 border-emerald-500/50 shrink-0">
                <img
                  src={img.url}
                  alt={`360° view ${img.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status indicator */}
      {isRecording && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 right-4 bg-red-500/20 backdrop-blur px-3 py-2 rounded-full text-red-300 text-xs font-medium">
            🔄 RECORDING 360° SPHERE
          </div>
        </div>
      )}
    </div>
  )
}
