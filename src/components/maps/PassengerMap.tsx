"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

const businessIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/4320/4320337.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

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

interface PassengerMapProps {
  userLocation: [number, number]
  nearbyBusinesses?: Array<{
    id: string
    name: string
    lat: number
    lng: number
    category: string
    isFeatured: boolean
  }>
  onBusinessClick?: (business: any) => void
  onLocationSelect?: (lat: number, lng: number) => void
}

export default function PassengerMap({
  userLocation,
  nearbyBusinesses = [],
  onBusinessClick,
  onLocationSelect,
}: PassengerMapProps) {
  return (
    <div className="w-full h-full relative" style={{ borderRadius: "16px", overflow: "hidden" }}>
      <MapContainer
        center={userLocation || [-23.5505, -46.6333]}
        zoom={15}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        <MapClickHandler onClick={onLocationSelect} />

        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>Voce esta aqui</Popup>
          </Marker>
        )}

        {nearbyBusinesses.map((biz) => (
          <Marker
            key={biz.id}
            position={[biz.lat, biz.lng]}
            icon={businessIcon}
            eventHandlers={{ click: () => onBusinessClick?.(biz) }}
          >
            <Popup>
              <div className="min-w-[150px]">
                <div className="font-bold text-sm">{biz.isFeatured ? "⭐ " : ""}{biz.name}</div>
                <div className="text-xs text-gray-500">{biz.category}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <button
        onClick={() => {}}
        className="absolute bottom-5 right-5 w-[50px] h-[50px] rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 border-none text-black text-[22px] cursor-pointer shadow-lg z-[1000] flex items-center justify-center hover:scale-105 transition-transform"
      >
        📍
      </button>
    </div>
  )
}
