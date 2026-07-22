"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const motoIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3063/3063176.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3202/3202926.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
})

const destinationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684809.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
})

function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => { if (center) map.setView(center, 15) }, [center, map])
  return null
}

function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  const map = useMap()
  useEffect(() => {
    if (!onClick) return
    const handler = (e: L.LeafletMouseEvent) => onClick(e.latlng.lat, e.latlng.lng)
    map.on("click", handler)
    return () => { map.off("click", handler) }
  }, [map, onClick])
  return null
}

interface DriverMapProps {
  userLocation: [number, number]
  nearbyDrivers?: Array<{
    id: string
    name: string
    lat: number
    lng: number
    vehicleType: "moto" | "carro" | "van"
    rating: number
    pricePerKm: number
    isOnline: boolean
  }>
  destination?: [number, number]
  route?: Array<[number, number]>
  onDriverClick?: (driver: any) => void
  onMapClick?: (lat: number, lng: number) => void
}

export default function DriverMap({
  userLocation,
  nearbyDrivers = [],
  destination,
  route,
  onDriverClick,
  onMapClick,
}: DriverMapProps) {
  const mapRef = useRef<L.Map | null>(null)

  return (
    <div className="w-full h-full relative" style={{ borderRadius: "16px", overflow: "hidden" }}>
      <MapContainer
        center={userLocation || [-23.5505, -46.6333]}
        zoom={15}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapController center={userLocation} />
        <MapClickHandler onClick={onMapClick} />

        {userLocation && (
          <>
            <Marker position={userLocation} icon={userIcon}>
              <Popup><div className="text-center font-medium">Voce esta aqui</div></Popup>
            </Marker>
            <Circle center={userLocation} radius={100} pathOptions={{ color: "#00d4aa", fillColor: "#00d4aa", fillOpacity: 0.1, weight: 1 }} />
          </>
        )}

        {nearbyDrivers.map((driver) => (
          <Marker
            key={driver.id}
            position={[driver.lat, driver.lng]}
            icon={driver.vehicleType === "moto" ? motoIcon : carIcon}
            eventHandlers={{ click: () => onDriverClick?.(driver) }}
          >
            <Popup>
              <div className="min-w-[180px] font-sans">
                <div className="font-bold text-sm mb-1">{driver.vehicleType === "moto" ? "🛵" : "🚕"} {driver.name}</div>
                <div className="text-xs text-gray-500 mb-1">{"⭐".repeat(Math.round(driver.rating))} ({driver.rating})</div>
                <div className="text-sm font-bold text-emerald-500">R$ {driver.pricePerKm.toFixed(2)}/km</div>
                <div className="text-xs text-emerald-500 mt-1">{driver.isOnline ? "🟢 Online" : "⚫ Offline"}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {destination && (
          <Marker position={destination} icon={destinationIcon}>
            <Popup><div className="text-center font-medium">Destino</div></Popup>
          </Marker>
        )}

        {route && route.length > 1 && (
          <Polyline positions={route} pathOptions={{ color: "#00d4aa", weight: 4, opacity: 0.8, dashArray: "10, 10" }} />
        )}
      </MapContainer>

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        <button onClick={() => mapRef.current?.zoomIn()} className="w-10 h-10 rounded-xl bg-black/80 border border-white/10 text-white text-xl cursor-pointer backdrop-blur flex items-center justify-center hover:bg-black/60">+</button>
        <button onClick={() => mapRef.current?.zoomOut()} className="w-10 h-10 rounded-xl bg-black/80 border border-white/10 text-white text-xl cursor-pointer backdrop-blur flex items-center justify-center hover:bg-black/60">−</button>
        <button onClick={() => userLocation && mapRef.current?.setView(userLocation, 15)} className="w-10 h-10 rounded-xl bg-emerald-500 border-none text-black text-lg cursor-pointer flex items-center justify-center hover:bg-emerald-400">📍</button>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur px-3 py-2 rounded-full text-emerald-500 text-xs font-bold border border-emerald-500/20 z-[1000]">
        🛵 {nearbyDrivers.length} motoristas proximos
      </div>
    </div>
  )
}
