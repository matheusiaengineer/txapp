"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Crosshair, Check, MapPin, ArrowLeft } from "lucide-react";
import { mobilityEngine } from "@/lib/mobility/engine";

interface MapPickerProps {
  onConfirm: (coord: { lat: number; lng: number; address: string }) => void;
  onCancel?: () => void;
  initialLocation?: { lat: number; lng: number };
}

export function MapPicker({ onConfirm, onCancel, initialLocation }: MapPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState(initialLocation || { lat: -23.5505, lng: -46.6333 });
  const [zoom, setZoom] = useState(15);
  const [isPanning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const animFrameRef = useRef<number>(0);
  const pulseRef = useRef(0);

  const BASE_SCALE = 256;
  const ROAD_COLOR = "#2a2a4a";

  function mercatorY(lat: number): number {
    return Math.log(Math.tan(lat * Math.PI / 360 + Math.PI / 4));
  }

  function lngToX(lng: number, cLng: number, scale: number, width: number): number {
    return width / 2 + (lng - cLng) * scale;
  }

  function latToY(lat: number, cLat: number, cY: number, scale: number, height: number): number {
    return height / 2 - (mercatorY(lat) - cY) * scale;
  }

  function generateRoadGrid(c: { lat: number; lng: number }, z: number, w: number, h: number) {
    const scale = BASE_SCALE * Math.pow(2, z - 10);
    const cY = mercatorY(c.lat);
    const roads: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const degLng = w / scale;
    const degLat = h / scale;
    const minLng = c.lng - degLng / 2;
    const maxLng = c.lng + degLng / 2;
    const minLat = c.lat - degLat / 2;
    const maxLat = c.lat + degLat / 2;
    const step = Math.max(0.002, 0.02 / Math.pow(2, z - 10));

    for (let lng = minLng - (minLng % step); lng <= maxLng; lng += step) {
      const x = lngToX(lng, c.lng, scale, w);
      roads.push({ x1: x, y1: Math.max(0, 0), x2: x, y2: Math.min(h, h) });
    }
    for (let lat = minLat - (minLat % step); lat <= maxLat; lat += step) {
      const y = latToY(lat, c.lat, cY, scale, h);
      roads.push({ x1: Math.max(0, 0), y1: y, x2: Math.min(w, w), y2: y });
    }
    return roads;
  }

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); setShowResults(false); return; }
    setIsLoading(true);
    try {
      const results = await mobilityEngine.searchPlaces(q, center);
      setSearchResults(results);
      setShowResults(true);
    } catch { setSearchResults([]); }
    setIsLoading(false);
  }, [center]);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const selectPlace = useCallback((place: any) => {
    setCenter({ lat: place.lat, lng: place.lng });
    setSelectedAddress(`${place.name}, ${place.address}`);
    setSearchQuery(`${place.name}, ${place.address}`);
    setShowResults(false);
  }, []);

  useEffect(() => {
    function render() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      const W = rect.width;
      const H = rect.height;

      const scale = BASE_SCALE * Math.pow(2, zoom - 10);
      const cY = mercatorY(center.lat);

      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
      grad.addColorStop(0, "#1a1a2e");
      grad.addColorStop(1, "#0f0f1a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const roads = generateRoadGrid(center, zoom, W, H);
      ctx.strokeStyle = ROAD_COLOR;
      ctx.lineWidth = 2;
      for (const road of roads) {
        ctx.beginPath();
        ctx.moveTo(road.x1, road.y1);
        ctx.lineTo(road.x2, road.y2);
        ctx.stroke();
      }

      const pinX = W / 2;
      const pinY = H / 2;

      const dropShadow = ctx.createRadialGradient(pinX, pinY + 28, 0, pinX, pinY + 28, 14);
      dropShadow.addColorStop(0, "rgba(0,0,0,0.4)");
      dropShadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = dropShadow;
      ctx.beginPath();
      ctx.ellipse(pinX, pinY + 28, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pinX, pinY - 2, 14, 0, Math.PI);
      ctx.fillStyle = "#3ECB8E";
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(pinX - 14, pinY - 2);
      ctx.lineTo(pinX, pinY + 18);
      ctx.lineTo(pinX + 14, pinY - 2);
      ctx.fillStyle = "#3ECB8E";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pinX, pinY - 2, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`, W / 2, H - 20);

      pulseRef.current += 0.03;
      animFrameRef.current = requestAnimationFrame(render);
    }
    render();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [center, zoom]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(20, Math.max(10, z + (e.deltaY > 0 ? -0.5 : 0.5))));
  }, []);

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
    const cY = mercatorY(center.lat);
    const newLng = center.lng - dx / scale;
    const newLatMerc = cY + dy / scale;
    const newLat = 360 * Math.atan(Math.exp(newLatMerc)) / Math.PI - 90;
    setPanStart({ x: e.clientX, y: e.clientY });
    setCenter({ lat: newLat, lng: newLng });
  }, [isPanning, panStart, zoom, center]);

  const handleMouseUp = useCallback(() => setPanning(false), []);

  const goToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => { setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setZoom(15); },
      () => {}
    );
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      let address = selectedAddress;
      if (!address) {
        address = await mobilityEngine.getAddress(center);
      }
      onConfirm({ ...center, address });
    } catch {
      onConfirm({ ...center, address: `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}` });
    }
    setIsLoading(false);
  }, [center, selectedAddress, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f0f1a]">
      <div className="relative z-10 px-4 pt-4 pb-2 flex gap-3 items-center">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onCancel}
          className="w-10 h-10 rounded-xl bg-card-bg/90 backdrop-blur-sm border border-card-border flex items-center justify-center text-foreground flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar endereço ou local..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-card-bg/90 backdrop-blur-sm border border-card-border text-foreground placeholder-gray-500 focus:outline-none focus:border-primary/50 text-sm"
          />
          <AnimatePresence>
            {showResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full mt-1 left-0 right-0 bg-card-bg border border-card-border rounded-xl overflow-hidden shadow-xl max-h-60 overflow-y-auto"
              >
                {searchResults.map(place => (
                  <button
                    key={place.id}
                    onClick={() => selectPlace(place)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{place.name}</p>
                      <p className="text-xs text-gray-500 truncate">{place.address}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goToCurrentLocation}
          className="absolute right-4 bottom-24 w-10 h-10 rounded-xl bg-card-bg/90 backdrop-blur-sm border border-card-border flex items-center justify-center text-foreground hover:bg-card-bg transition-colors shadow-lg"
        >
          <Crosshair className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="px-4 py-3 border-t border-card-border bg-card-bg/90 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0 flex-1 mr-3">
            <p className="text-xs text-gray-500">Local selecionado</p>
            <p className="text-sm font-medium text-foreground truncate">
              {selectedAddress || `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`}
            </p>
          </div>
          <div className="text-xs text-gray-500 tabular-nums">Zoom: {zoom.toFixed(1)}</div>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-card-border text-foreground text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Cancelar
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl bg-primary text-background text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Confirmar local
          </motion.button>
        </div>
      </div>
    </div>
  );
}
