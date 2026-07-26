"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Zap, CloudRain, AlertTriangle, Navigation, Locate } from "lucide-react";

const DEFAULT_CENTER = { lat: -23.561, lng: -46.656 };

interface TxdMapProps {
  pickupCoords?: { lat: number; lng: number } | null;
  destinationCoords?: { lat: number; lng: number } | null;
  directions?: { polyline: { lat: number; lng: number }[]; distance?: number; duration?: number } | null;
  showLayers?: boolean;
  className?: string;
}

export default function TxdLeafletMap({ pickupCoords, destinationCoords, directions, showLayers = true, className }: TxdMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [layers, setLayers] = useState({ traffic: false, incidents: false, weather: false });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const center = pickupCoords || DEFAULT_CENTER;
    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: pickupCoords ? 15 : 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
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
          className: "",
          html: `<div style="width:20px;height:20px;background:#10b981;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(16,185,129,0.6)"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(mapRef.current);
      pickupMarkerRef.current = marker;
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
          className: "",
          html: `<div style="width:20px;height:20px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(239,68,68,0.6)"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
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

    const points: L.LatLngExpression[] = [];

    if (directions?.polyline && directions.polyline.length > 1) {
      directions.polyline.forEach((p) => points.push([p.lat, p.lng]));
    } else if (pickupCoords && destinationCoords) {
      points.push([pickupCoords.lat, pickupCoords.lng]);
      points.push([destinationCoords.lat, destinationCoords.lng]);
    }

    if (points.length > 1) {
      const polyline = L.polyline(points, {
        color: "#10b981",
        weight: 5,
        opacity: 0.8,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(mapRef.current);
      polylineRef.current = polyline;
      mapRef.current.fitBounds(polyline.getBounds(), { padding: [60, 60], maxZoom: 16 });
    } else if (pickupCoords) {
      mapRef.current.setView([pickupCoords.lat, pickupCoords.lng], 15);
    }
  }, [directions, pickupCoords, destinationCoords, mapReady]);

  const toggleTraffic = useCallback(() => {
    if (!mapRef.current || !mapReady) return;
    setLayers((prev) => {
      const next = { ...prev, traffic: !prev.traffic };
      if (next.traffic) {
        if (!trafficLayerRef.current) {
          trafficLayerRef.current = L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            { maxZoom: 19, opacity: 0.6 }
          );
        }
        trafficLayerRef.current.addTo(mapRef.current!);
      } else {
        if (trafficLayerRef.current) {
          trafficLayerRef.current.remove();
        }
      }
      return next;
    });
  }, [mapReady]);

  const recenter = useCallback(() => {
    if (!mapRef.current) return;
    if (pickupCoords) {
      mapRef.current.setView([pickupCoords.lat, pickupCoords.lng], 15);
    }
  }, [pickupCoords]);

  return (
    <div className={`relative w-full h-full ${className || ""}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {showLayers && (
        <div className="absolute top-20 right-4 flex flex-col gap-2 z-[1000]">
          <button
            onClick={recenter}
            className="p-2 rounded-full shadow-lg border transition-colors bg-card-bg text-gray-400 border-card-border hover:bg-card-bg/80"
            title="Centralizar"
          >
            <Locate className="w-5 h-5" />
          </button>
          <button
            onClick={toggleTraffic}
            className={`p-2 rounded-full shadow-lg border transition-colors ${
              layers.traffic
                ? "bg-primary text-black border-primary"
                : "bg-card-bg text-gray-400 border-card-border hover:bg-card-bg/80"
            }`}
            title="Trânsito ao vivo"
          >
            <Zap className="w-5 h-5" />
          </button>
          <button
            onClick={() => setLayers((l) => ({ ...l, incidents: !l.incidents }))}
            className={`p-2 rounded-full shadow-lg border transition-colors ${
              layers.incidents
                ? "bg-warning text-black border-warning"
                : "bg-card-bg text-gray-400 border-card-border hover:bg-card-bg/80"
            }`}
            title="Acidentes / Obras"
          >
            <AlertTriangle className="w-5 h-5" />
          </button>
          <button
            onClick={() => setLayers((l) => ({ ...l, weather: !l.weather }))}
            className={`p-2 rounded-full shadow-lg border transition-colors ${
              layers.weather
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-card-bg text-gray-400 border-card-border hover:bg-card-bg/80"
            }`}
            title="Clima (Chuva)"
          >
            <CloudRain className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
