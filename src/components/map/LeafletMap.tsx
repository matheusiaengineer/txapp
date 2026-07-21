"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Shield, Zap, CloudRain } from "lucide-react";

const center = { lat: -23.561, lng: -46.656 };

interface TxdMapProps {
  pickupCoords?: { lat: number; lng: number } | null;
  destinationCoords?: { lat: number; lng: number } | null;
  directions?: { polyline: { lat: number; lng: number }[] } | null;
}

export default function TxdLeafletMap({ pickupCoords, destinationCoords, directions }: TxdMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [layers, setLayers] = useState({ traffic: false, weather: false, incidents: false });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
    if (pickupCoords) {
      const marker = L.marker([pickupCoords.lat, pickupCoords.lng], {
        icon: L.divIcon({
          className: "custom-pickup-marker",
          html: `<div style="width:16px;height:16px;background:#10b981;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(16,185,129,0.5)"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(mapRef.current);
      pickupMarkerRef.current = marker;
      mapRef.current.setView([pickupCoords.lat, pickupCoords.lng]);
    }
  }, [pickupCoords, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
    if (destinationCoords) {
      const marker = L.marker([destinationCoords.lat, destinationCoords.lng], {
        icon: L.divIcon({
          className: "custom-dest-marker",
          html: `<div style="width:16px;height:16px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(239,68,68,0.5)"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(mapRef.current);
      destMarkerRef.current = marker;
    }
  }, [destinationCoords, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (directions && pickupCoords && destinationCoords) {
      const polyline = L.polyline(
        [[pickupCoords.lat, pickupCoords.lng], [destinationCoords.lat, destinationCoords.lng]],
        { color: "#10b981", weight: 5, opacity: 0.7 }
      ).addTo(mapRef.current);
      polylineRef.current = polyline;
      mapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }, [directions, pickupCoords, destinationCoords, mapReady]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-20 right-4 flex flex-col gap-2 z-[1000]">
        <button
          onClick={() => setLayers(l => ({ ...l, traffic: !l.traffic }))}
          className={`p-2 rounded-full shadow-lg border transition-colors ${layers.traffic ? 'bg-primary text-black border-primary' : 'bg-card-bg text-gray-400 border-card-border hover:bg-card-bg/80'}`}
          title="Trânsito ao vivo"
        >
          <Zap className="w-5 h-5" />
        </button>
        <button
          onClick={() => setLayers(l => ({ ...l, incidents: !l.incidents }))}
          className={`p-2 rounded-full shadow-lg border transition-colors ${layers.incidents ? 'bg-primary text-black border-primary' : 'bg-card-bg text-gray-400 border-card-border hover:bg-card-bg/80'}`}
          title="Acidentes / Obras"
        >
          <Shield className="w-5 h-5" />
        </button>
        <button
          onClick={() => setLayers(l => ({ ...l, weather: !l.weather }))}
          className={`p-2 rounded-full shadow-lg border transition-colors ${layers.weather ? 'bg-blue-500 text-white border-blue-500' : 'bg-card-bg text-gray-400 border-card-border hover:bg-card-bg/80'}`}
          title="Clima (Chuva)"
        >
          <CloudRain className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
