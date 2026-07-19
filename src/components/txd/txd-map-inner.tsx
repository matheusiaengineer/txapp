"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createEmojiIcon(emoji: string, color: string, pulse: boolean = false) {
  return L.divIcon({
    html: `
      <div style="position: relative;">
        ${pulse ? `<div style="position:absolute;top:-8px;left:-8px;width:40px;height:40px;border-radius:50%;background:${color};opacity:0.3;animation:txd-ping-slow 2s ease-out infinite;"></div>` : ""}
        <div style="width:36px;height:36px;border-radius:50%;background:${color};border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 12px rgba(0,0,0,0.5);">${emoji}</div>
      </div>`,
    className: "txd-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

interface TxdMapInnerProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string; lat: number; lng: number;
    type: "user" | "driver" | "pickup" | "destination" | "bike" | "truck";
    label?: string; pulse?: boolean;
  }>;
  route?: { from: { lat: number; lng: number }; to: { lat: number; lng: number }; color?: string };
  showRoute?: boolean;
  interactive?: boolean;
  className?: string;
}

const MARKER_CFG = {
  user: { emoji: "📍", color: "#3ECB8E" },
  driver: { emoji: "🚗", color: "#3ECB8E" },
  pickup: { emoji: "🟢", color: "#3ECB8E" },
  destination: { emoji: "🎯", color: "#ef4444" },
  bike: { emoji: "🛵", color: "#60a5fa" },
  truck: { emoji: "🚚", color: "#f59e0b" },
};

export default function TxdMapInner({
  center = [-23.5505, -46.6333],
  zoom = 13,
  markers = [],
  route,
  showRoute = false,
  interactive = true,
  className = "",
}: TxdMapInnerProps) {
  const routeCoords: [number, number][] = route
    ? [[route.from.lat, route.from.lng], [route.to.lat, route.to.lng]]
    : [];

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: "100%", height: "100%", background: "#0a0d12" }}
      className={className + " rounded-[inherit]"}
      zoomControl={interactive}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      {markers.map((m) => {
        const cfg = MARKER_CFG[m.type];
        return (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={createEmojiIcon(cfg.emoji, cfg.color, m.pulse)}>
            {m.label && <Popup>{m.label}</Popup>}
          </Marker>
        );
      })}
      {showRoute && route && (
        <>
          <Polyline positions={routeCoords} pathOptions={{ color: route.color || "#3ECB8E", weight: 12, opacity: 0.2 }} />
          <Polyline positions={routeCoords} pathOptions={{ color: route.color || "#3ECB8E", weight: 4, opacity: 0.9 }} />
        </>
      )}
    </MapContainer>
  );
}
