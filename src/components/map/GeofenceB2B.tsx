"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Circle, Trash2, Save, ToggleLeft, ToggleRight, Navigation, AlertTriangle } from "lucide-react";

interface GeofenceZone {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number;
  active: boolean;
  color: string;
}

interface GeofenceB2BProps {
  companyId?: string;
  onZoneChange?: (zones: GeofenceZone[]) => void;
  onCheckLocation?: (lat: number, lng: number) => boolean;
  className?: string;
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isInsideGeofence(
  userLat: number,
  userLng: number,
  zones: GeofenceZone[]
): { inside: boolean; zoneName?: string } {
  for (const zone of zones) {
    if (!zone.active) continue;
    const distance = getDistanceFromLatLonInKm(userLat, userLng, zone.center.lat, zone.center.lng) * 1000;
    if (distance <= zone.radius) {
      return { inside: true, zoneName: zone.name };
    }
  }
  return { inside: false };
}

const COLORS = ["#3ECB8E", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899"];

export default function GeofenceB2B({
  companyId,
  onZoneChange,
  className = "",
}: GeofenceB2BProps) {
  const [zones, setZones] = useState<GeofenceZone[]>([
    {
      id: "1",
      name: "Matriz",
      center: { lat: -23.5505, lng: -46.6333 },
      radius: 500,
      active: true,
      color: COLORS[0],
    },
  ]);
  const [showPanel, setShowPanel] = useState(false);
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [newZone, setNewZone] = useState({ name: "", radius: 500 });
  const [dragging, setDragging] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const toggleZone = useCallback((id: string) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, active: !z.active } : z))
    );
  }, []);

  const deleteZone = useCallback((id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
  }, []);

  const addZone = useCallback(() => {
    if (!newZone.name.trim()) return;
    const zone: GeofenceZone = {
      id: Date.now().toString(),
      name: newZone.name,
      center: {
        lat: -23.5505 + (Math.random() - 0.5) * 0.02,
        lng: -46.6333 + (Math.random() - 0.5) * 0.02,
      },
      radius: newZone.radius,
      active: true,
      color: COLORS[zones.length % COLORS.length],
    };
    setZones((prev) => [...prev, zone]);
    setNewZone({ name: "", radius: 500 });
  }, [newZone, zones.length]);

  useEffect(() => {
    onZoneChange?.(zones);
  }, [zones, onZoneChange]);

  return (
    <div className={className}>
      {/* Botão toggle do painel */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowPanel(!showPanel)}
        className="glass-panel p-3 rounded-full shadow-lg"
        title="Geofence B2B"
      >
        <Circle className="w-5 h-5 text-primary" />
      </motion.button>

      {/* Painel de Geofence */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 glass-panel p-4 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm">Zonas Geofence</h3>
              </div>
              <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                {zones.filter((z) => z.active).length} ativas
              </span>
            </div>

            {/* Lista de zonas */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center gap-3 p-3 bg-background rounded-xl border border-card-border"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: zone.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{zone.name}</p>
                    <p className="text-[10px] text-gray-500">{zone.radius}m de raio</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleZone(zone.id)}
                      className="p-1 hover:bg-white/5 rounded transition-colors"
                    >
                      {zone.active ? (
                        <ToggleRight className="w-4 h-4 text-primary" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteZone(zone.id)}
                      className="p-1 hover:bg-white/5 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Adicionar nova zona */}
            <div className="space-y-2 border-t border-card-border pt-3">
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                Adicionar zona
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da zona (ex: Escritório, Fábrica)"
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  className="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-primary/50"
                />
                <select
                  value={newZone.radius}
                  onChange={(e) => setNewZone({ ...newZone, radius: Number(e.target.value) })}
                  className="bg-background border border-card-border rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-primary/50"
                >
                  <option value="100">100m</option>
                  <option value="300">300m</option>
                  <option value="500">500m</option>
                  <option value="1000">1km</option>
                  <option value="2000">2km</option>
                </select>
              </div>
              <button
                onClick={addZone}
                disabled={!newZone.name.trim()}
                className="w-full bg-primary text-background text-xs font-bold py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 transition"
              >
                Adicionar zona
              </button>
            </div>

            {/* Dica */}
            <div className="mt-3 pt-3 border-t border-card-border">
              <div className="flex items-start gap-2 text-[10px] text-gray-500">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>
                  Funcionários só podem solicitar corridas corporativas se estiverem dentro de uma zona ativa.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
