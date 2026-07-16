"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Crosshair, Maximize2, Minimize2, Navigation } from "lucide-react";

interface Coordinates {
  lat: number;
  lng: number;
}

interface Marker {
  id: string;
  lat: number;
  lng: number;
  type: "pickup" | "destination" | "driver" | "poi";
  label?: string;
  color?: string;
}

interface RoutePath {
  points: Coordinates[];
  color?: string;
  width?: number;
}

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface MapViewProps {
  center?: Coordinates;
  zoom?: number;
  markers?: Marker[];
  routes?: RoutePath[];
  heatPoints?: HeatPoint[];
  onCenterChange?: (center: Coordinates) => void;
  onZoomChange?: (zoom: number) => void;
  onMapClick?: (coord: Coordinates) => void;
  showControls?: boolean;
  showCurrentLocation?: boolean;
  showFollowMode?: boolean;
  showFullscreen?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const TILE_COLOR = "#1a1a2e";
const ROAD_COLOR = "#2a2a4a";
const ROAD_WIDTH = 2;
const MIN_ZOOM = 10;
const MAX_ZOOM = 20;
const BASE_SCALE = 256;
const PULSE_DURATION = 2000;

function mercatorY(lat: number): number {
  return Math.log(Math.tan(lat * Math.PI / 360 + Math.PI / 4));
}

function lngToX(lng: number, centerLng: number, scale: number, width: number): number {
  return width / 2 + (lng - centerLng) * scale;
}

function latToY(lat: number, centerLat: number, centerY: number, scale: number, height: number): number {
  return height / 2 - (mercatorY(lat) - centerY) * scale;
}

function generateRoadGrid(center: Coordinates, zoom: number, width: number, height: number) {
  const scale = BASE_SCALE * Math.pow(2, zoom - 10);
  const centerY = mercatorY(center.lat);
  const roads: { x1: number; y1: number; x2: number; y2: number; name?: string }[] = [];
  const names: { x: number; y: number; name: string; angle: number }[] = [];

  const degLng = width / scale;
  const degLat = height / scale;

  const minLng = center.lng - degLng / 2;
  const maxLng = center.lng + degLng / 2;
  const minLat = center.lat - degLat / 2;
  const maxLat = center.lat + degLat / 2;

  const step = Math.max(0.002, 0.02 / Math.pow(2, zoom - 10));

  const streetNames = [
    "Av. Paulista", "Rua Augusta", "Rua Oscar Freire", "Av. Brigadeiro Faria Lima",
    "Rua da Consolação", "Av. Rebouças", "Rua Haddock Lobo", "Rua Bela Cintra",
    "Av. 9 de Julho", "Rua Teodoro Sampaio", "Rua dos Pinheiros", "Rua Mourato Coelho",
    "Av. São João", "Rua do Carmo", "Rua 25 de Março", "Av. Ipiranga",
    "Rua da Glória", "Rua do Gasômetro", "Av. Washington Luís", "Rua Boa Vista",
    "Rua Líbero Badaró", "Av. São Luís", "Rua da Liberdade", "Rua Vergueiro",
  ];

  let nameIndex = 0;
  for (let lng = minLng - (minLng % step); lng <= maxLng; lng += step) {
    const x1 = lngToX(lng, center.lng, scale, width);
    const x2 = lngToX(lng, center.lng, scale, width);
    const y1 = latToY(minLat, center.lat, centerY, scale, height);
    const y2 = latToY(maxLat, center.lat, centerY, scale, height);
    roads.push({ x1: x1, y1: Math.max(0, y1), x2: x2, y2: Math.min(height, y2) });
    if (nameIndex % 3 === 0 && x1 > 20 && x1 < width - 20) {
      names.push({
        x: x1,
        y: height / 2,
        name: streetNames[nameIndex % streetNames.length],
        angle: 0,
      });
    }
    nameIndex++;
  }

  nameIndex = 0;
  for (let lat = minLat - (minLat % step); lat <= maxLat; lat += step) {
    const x1 = lngToX(minLng, center.lng, scale, width);
    const x2 = lngToX(maxLng, center.lng, scale, width);
    const y1 = latToY(lat, center.lat, centerY, scale, height);
    const y2 = latToY(lat, center.lat, centerY, scale, height);
    roads.push({ x1: Math.max(0, x1), y1, x2: Math.min(width, x2), y2 });
    if (nameIndex % 2 === 0 && y1 > 15 && y1 < height - 15) {
      names.push({
        x: width / 2,
        y: y1,
        name: streetNames[(nameIndex + 5) % streetNames.length],
        angle: Math.PI / 2,
      });
    }
    nameIndex++;
  }

  return { roads, names };
}

export function MapView({
  center: externalCenter,
  zoom: externalZoom,
  markers = [],
  routes = [],
  heatPoints = [],
  onCenterChange,
  onZoomChange,
  onMapClick,
  showControls = true,
  showCurrentLocation = true,
  showFollowMode = true,
  showFullscreen = true,
  className = "",
  style,
}: MapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalCenter, setInternalCenter] = useState<Coordinates>(externalCenter || { lat: -23.5505, lng: -46.6333 });
  const [internalZoom, setInternalZoom] = useState(externalZoom || 14);
  const [isPanning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setFullscreen] = useState(false);
  const [followMode, setFollowMode] = useState(false);
  const [driverPositions, setDriverPositions] = useState<Record<string, { lat: number; lng: number }>>({});
  const animFrameRef = useRef<number>(0);
  const pulseRef = useRef(0);

  const center = externalCenter || internalCenter;
  const zoom = externalZoom ?? internalZoom;

  const updateCenter = useCallback((c: Coordinates) => {
    if (!externalCenter) setInternalCenter(c);
    onCenterChange?.(c);
  }, [externalCenter, onCenterChange]);

  const updateZoom = useCallback((z: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
    if (externalZoom === undefined) setInternalZoom(clamped);
    onZoomChange?.(clamped);
  }, [externalZoom, onZoomChange]);

  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Geolocation')) return;
      originalError.apply(console, args);
    };
    return () => { console.error = originalError; };
  }, []);

  useEffect(() => {
    if (!followMode) return;
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      pos => {
        updateCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [followMode, updateCenter]);

  useEffect(() => {
    const driverMarkers = markers.filter(m => m.type === "driver");
    if (driverMarkers.length === 0) return;

    const initial: Record<string, { lat: number; lng: number }> = {};
    driverMarkers.forEach(m => { initial[m.id] = { lat: m.lat, lng: m.lng }; });
    setDriverPositions(initial);

    const intervals = driverMarkers.map(m => {
      return setInterval(() => {
        setDriverPositions(prev => ({
          ...prev,
          [m.id]: {
            lat: m.lat + (Math.random() - 0.5) * 0.001,
            lng: m.lng + (Math.random() - 0.5) * 0.001,
          },
        }));
      }, 2000 + Math.random() * 1000);
    });

    return () => intervals.forEach(clearInterval);
  }, [markers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const W = rect.width;
    const H = rect.height;

    const scale = BASE_SCALE * Math.pow(2, zoom - 10);
    const centerY = mercatorY(center.lat);

    function toCanvas(coord: Coordinates): { x: number; y: number } {
      return {
        x: lngToX(coord.lng, center.lng, scale, W),
        y: latToY(coord.lat, center.lat, centerY, scale, H),
      };
    }

    ctx.clearRect(0, 0, W, H);

    const gradient = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#0f0f1a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    const grid = generateRoadGrid(center, zoom, W, H);

    ctx.strokeStyle = ROAD_COLOR;
    ctx.lineWidth = ROAD_WIDTH;
    for (const road of grid.roads) {
      ctx.beginPath();
      ctx.moveTo(road.x1, road.y1);
      ctx.lineTo(road.x2, road.y2);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (const road of grid.roads) {
      ctx.beginPath();
      ctx.moveTo(road.x1 + 2, road.y1);
      ctx.lineTo(road.x2 + 2, road.y2);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const n of grid.names) {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(n.angle);
      ctx.fillText(n.name, 0, 0);
      ctx.restore();
    }

    if (heatPoints.length > 0) {
      const heatCanvas = document.createElement("canvas");
      heatCanvas.width = W;
      heatCanvas.height = H;
      const hCtx = heatCanvas.getContext("2d");
      if (hCtx) {
        for (const hp of heatPoints) {
          const { x, y } = toCanvas({ lat: hp.lat, lng: hp.lng });
          const radius = 20 + hp.intensity * 15;
          const radial = hCtx.createRadialGradient(x, y, 0, x, y, radius);
          radial.addColorStop(0, `rgba(62, 203, 142, ${0.3 * hp.intensity})`);
          radial.addColorStop(1, "rgba(62, 203, 142, 0)");
          hCtx.fillStyle = radial;
          hCtx.beginPath();
          hCtx.arc(x, y, radius, 0, Math.PI * 2);
          hCtx.fill();
        }
        ctx.drawImage(heatCanvas, 0, 0);
      }
    }

    for (const route of routes) {
      if (route.points.length < 2) continue;
      ctx.beginPath();
      const start = toCanvas(route.points[0]);
      ctx.moveTo(start.x, start.y);

      for (let i = 1; i < route.points.length - 1; i++) {
        const mid = toCanvas(route.points[i]);
        const next = toCanvas(route.points[i + 1]);
        const cp1x = (mid.x + toCanvas(route.points[i]).x) / 2;
        const cp1y = (mid.y + toCanvas(route.points[i]).y) / 2;
        const cp2x = (next.x + mid.x) / 2;
        const cp2y = (next.y + mid.y) / 2;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, mid.x, mid.y);
      }

      const end = toCanvas(route.points[route.points.length - 1]);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = route.color || "#3ECB8E";
      ctx.lineWidth = route.width || 4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.strokeStyle = route.color ? route.color + "44" : "#3ECB8E44";
      ctx.lineWidth = (route.width || 4) + 8;
      ctx.stroke();
    }

    for (const marker of markers) {
      const { x, y } = toCanvas(
        marker.type === "driver" && driverPositions[marker.id]
          ? driverPositions[marker.id]
          : { lat: marker.lat, lng: marker.lng }
      );

      if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;

      if (marker.type === "driver") {
        const pulseRadius = 12 + Math.sin(pulseRef.current * 3) * 4;
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = marker.color || "#3B82F6";
        ctx.globalAlpha = 0.15;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = marker.color || "#3B82F6";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (marker.label) {
          ctx.fillStyle = "#fff";
          ctx.font = "11px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(marker.label, x, y - 16);
        }
      } else if (marker.type === "pickup") {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = marker.color || "#3ECB8E";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(marker.label || "Origem", x, y - 18);
      } else if (marker.type === "destination") {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = marker.color || "#EF4444";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(marker.label || "Destino", x, y - 18);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = marker.color || "#8B5CF6";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (marker.label) {
          ctx.fillStyle = "#9CA3AF";
          ctx.font = "10px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(marker.label, x, y - 13);
        }
      }
    }

    const currentLocation = markers.find(m => m.type === "pickup");
    if (currentLocation) {
      const { x, y } = toCanvas(currentLocation);
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(62, 203, 142, 0.08)";
      ctx.fill();
    }

    pulseRef.current += 0.05;
    animFrameRef.current = requestAnimationFrame(() => {});
  }, [center, zoom, markers, routes, heatPoints, driverPositions]);

  useEffect(() => {
    let running = true;
    function animate() {
      if (!running) return;
      pulseRef.current += 0.03;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const container = containerRef.current;
          if (container) {
            const W = container.getBoundingClientRect().width;
            const H = container.getBoundingClientRect().height;
            const scale = BASE_SCALE * Math.pow(2, zoom - 10);
            const centerY = mercatorY(center.lat);
            ctx.clearRect(0, 0, W, H);

            const gradient = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
            gradient.addColorStop(0, "#1a1a2e");
            gradient.addColorStop(1, "#0f0f1a");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, W, H);

            const grid = generateRoadGrid(center, zoom, W, H);
            ctx.strokeStyle = ROAD_COLOR;
            ctx.lineWidth = ROAD_WIDTH;
            for (const road of grid.roads) {
              ctx.beginPath();
              ctx.moveTo(road.x1, road.y1);
              ctx.lineTo(road.x2, road.y2);
              ctx.stroke();
            }

            ctx.strokeStyle = "rgba(255,255,255,0.03)";
            ctx.lineWidth = 1;
            for (const road of grid.roads) {
              ctx.beginPath();
              ctx.moveTo(road.x1 + 2, road.y1);
              ctx.lineTo(road.x2 + 2, road.y2);
              ctx.stroke();
            }

            ctx.fillStyle = "rgba(255,255,255,0.15)";
            ctx.font = "10px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for (const n of grid.names) {
              ctx.save();
              ctx.translate(n.x, n.y);
              ctx.rotate(n.angle);
              ctx.fillText(n.name, 0, 0);
              ctx.restore();
            }

            for (const route of routes) {
              if (route.points.length < 2) continue;
              ctx.beginPath();
              const startP = { lat: route.points[0].lat, lng: route.points[0].lng };
              const s = { x: lngToX(startP.lng, center.lng, scale, W), y: latToY(startP.lat, center.lat, centerY, scale, H) };
              ctx.moveTo(s.x, s.y);
              for (let i = 1; i < route.points.length - 1; i++) {
                const p1 = { lat: route.points[i].lat, lng: route.points[i].lng };
                const p2 = { lat: route.points[i + 1].lat, lng: route.points[i + 1].lng };
                const cp1 = { x: (lngToX(p1.lng, center.lng, scale, W) + lngToX(p1.lng, center.lng, scale, W)) / 2, y: (latToY(p1.lat, center.lat, centerY, scale, H) + latToY(p1.lat, center.lat, centerY, scale, H)) / 2 };
                const cp2 = { x: (lngToX(p2.lng, center.lng, scale, W) + lngToX(p1.lng, center.lng, scale, W)) / 2, y: (latToY(p2.lat, center.lat, centerY, scale, H) + latToY(p1.lat, center.lat, centerY, scale, H)) / 2 };
                ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, lngToX(p1.lng, center.lng, scale, W), latToY(p1.lat, center.lat, centerY, scale, H));
              }
              const lastP = { lat: route.points[route.points.length - 1].lat, lng: route.points[route.points.length - 1].lng };
              ctx.lineTo(lngToX(lastP.lng, center.lng, scale, W), latToY(lastP.lat, center.lat, centerY, scale, H));
              ctx.strokeStyle = route.color || "#3ECB8E";
              ctx.lineWidth = route.width || 4;
              ctx.lineJoin = "round";
              ctx.lineCap = "round";
              ctx.stroke();
            }

            for (const marker of markers) {
              const mPos = marker.type === "driver" && driverPositions[marker.id] ? driverPositions[marker.id] : { lat: marker.lat, lng: marker.lng };
              const x = lngToX(mPos.lng, center.lng, scale, W);
              const y = latToY(mPos.lat, center.lat, centerY, scale, H);
              if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;

              if (marker.type === "driver") {
                const pulseRadius = 12 + Math.sin(pulseRef.current * 3) * 4;
                ctx.beginPath();
                ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
                ctx.fillStyle = marker.color || "#3B82F6";
                ctx.globalAlpha = 0.15;
                ctx.fill();
                ctx.globalAlpha = 1;

                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fillStyle = marker.color || "#3B82F6";
                ctx.fill();
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2;
                ctx.stroke();

                if (marker.label) {
                  ctx.fillStyle = "#fff";
                  ctx.font = "11px Inter, sans-serif";
                  ctx.textAlign = "center";
                  ctx.fillText(marker.label, x, y - 16);
                }
              } else if (marker.type === "pickup") {
                ctx.beginPath();
                ctx.arc(x, y, 10, 0, Math.PI * 2);
                ctx.fillStyle = marker.color || "#3ECB8E";
                ctx.fill();
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.fillStyle = "#fff";
                ctx.font = "bold 12px Inter, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(marker.label || "Origem", x, y - 18);
              } else if (marker.type === "destination") {
                ctx.beginPath();
                ctx.arc(x, y, 10, 0, Math.PI * 2);
                ctx.fillStyle = marker.color || "#EF4444";
                ctx.fill();
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.fillStyle = "#fff";
                ctx.font = "bold 12px Inter, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(marker.label || "Destino", x, y - 18);
              } else {
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fillStyle = marker.color || "#8B5CF6";
                ctx.fill();
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 1.5;
                ctx.stroke();
                if (marker.label) {
                  ctx.fillStyle = "#9CA3AF";
                  ctx.font = "10px Inter, sans-serif";
                  ctx.textAlign = "center";
                  ctx.fillText(marker.label, x, y - 13);
                }
              }
            }
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(animate);
    }
    animate();
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [zoom, markers, routes, heatPoints, driverPositions, center.lat, center.lng]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.5 : 0.5;
    updateZoom(zoom + delta);
  }, [zoom, updateZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    const scale = BASE_SCALE * Math.pow(2, zoom - 10);
    const centerY = mercatorY(center.lat);
    const newLng = center.lng - dx / scale;
    const newLatMerc = centerY + dy / scale;
    const newLat = 360 * Math.atan(Math.exp(newLatMerc)) / Math.PI - 90;
    setPanStart({ x: e.clientX, y: e.clientY });
    updateCenter({ lat: newLat, lng: newLng });
  }, [isPanning, panStart, zoom, center, updateCenter]);

  const handleMouseUp = useCallback(() => {
    setPanning(false);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onMapClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scale = BASE_SCALE * Math.pow(2, zoom - 10);
    const centerY = mercatorY(center.lat);
    const lng = center.lng + (x - rect.width / 2) / scale;
    const latMerc = centerY - (y - rect.height / 2) / scale;
    const lat = 360 * Math.atan(Math.exp(latMerc)) / Math.PI - 90;
    onMapClick({ lat, lng });
  }, [onMapClick, zoom, center]);

  const goToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => { updateCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }); updateZoom(15); },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [updateCenter, updateZoom]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#0f0f1a] ${className}`}
      style={{ touchAction: "none", ...style }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      />

      {showControls && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => updateZoom(zoom + 1)}
            className="w-10 h-10 rounded-xl bg-card-bg/90 backdrop-blur-sm border border-card-border flex items-center justify-center text-foreground hover:bg-card-bg transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
          <div className="text-center text-xs text-gray-500 font-mono tabular-nums bg-card-bg/90 backdrop-blur-sm rounded-lg px-2 py-1 border border-card-border">
            {zoom.toFixed(1)}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => updateZoom(zoom - 1)}
            className="w-10 h-10 rounded-xl bg-card-bg/90 backdrop-blur-sm border border-card-border flex items-center justify-center text-foreground hover:bg-card-bg transition-colors shadow-lg"
          >
            <Minus className="w-4 h-4" />
          </motion.button>
        </div>
      )}

      <div className="absolute bottom-4 right-3 flex flex-col gap-2">
        {showCurrentLocation && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={goToCurrentLocation}
            className="w-10 h-10 rounded-xl bg-card-bg/90 backdrop-blur-sm border border-card-border flex items-center justify-center text-foreground hover:bg-card-bg transition-colors shadow-lg"
            title="Minha localização"
          >
            <Crosshair className="w-4 h-4" />
          </motion.button>
        )}
        {showFollowMode && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setFollowMode(!followMode)}
            className={`w-10 h-10 rounded-xl backdrop-blur-sm border flex items-center justify-center transition-colors shadow-lg ${
              followMode
                ? "bg-primary/20 border-primary/50 text-primary"
                : "bg-card-bg/90 border-card-border text-foreground hover:bg-card-bg"
            }`}
            title="Modo seguir"
          >
            <Navigation className={`w-4 h-4 ${followMode ? "fill-primary" : ""}`} />
          </motion.button>
        )}
        {showFullscreen && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-xl bg-card-bg/90 backdrop-blur-sm border border-card-border flex items-center justify-center text-foreground hover:bg-card-bg transition-colors shadow-lg"
            title="Tela cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </motion.button>
        )}
      </div>
    </div>
  );
}
