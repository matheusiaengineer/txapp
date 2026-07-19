"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Navigation, ArrowLeft, Clock, DollarSign, User, Star,
  Car, Phone, X, Route, Loader2, CheckCircle, Crosshair,
  Bike, Truck, LocateFixed, MessageSquare, Send, Image, Mic, MicOff, Play,
} from "lucide-react";
import { pricingEngine } from "@/lib/mobility/pricing-engine";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { calculateRoute } from "@/lib/routing/osrm";
import { notificationService } from "@/lib/notification/notification-service";
import { useTripChat } from "@/lib/chat/use-trip-chat";
import { NegotiationSheet } from "@/components/negotiation/NegotiationSheet";
import { ActionButton } from "@/components/ui/action-button";
import { useRideStore } from "@/lib/store/ride-store";
import { useWalletStore } from "@/lib/store/wallet-store";
import { socketService } from "@/lib/services/socket-service";
import { haversineDistance, hasMovedSignificantly, isDriverNearby } from "@/lib/utils/geo";
import { formatCurrency } from "@/lib/utils/financial";
import dynamic from "next/dynamic";

const OpenStreetMap = dynamic(
  () => import("@/components/map/OpenStreetMap").then(m => m.OpenStreetMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#1a1a2e]" /> }
);

type PageState = "idle" | "route" | "booking" | "searching" | "found" | "tracking" | "no_drivers";
type VehicleType = "moto" | "carro" | "frete";

function shortenAddress(addr: string): string {
  const parts = addr.split(",");
  if (parts.length >= 3) return `${parts[0].trim()}, ${parts[1].trim()} - ${parts[2].trim().split("-")[0]?.trim() || parts[2].trim()}`;
  return addr.slice(0, 50);
}

const VEHICLES: { id: VehicleType; label: string; icon: any; desc: string; color: string }[] = [
  { id: "moto", label: "Moto", icon: Bike, desc: "Rápido e econômico", color: "#FF6B35" },
  { id: "carro", label: "Carro", icon: Car, desc: "Conforto e segurança", color: "#3ECB8E" },
  { id: "frete", label: "Frete", icon: Truck, desc: "Cargas e entregas", color: "#8B5CF6" },
];

const CATEGORY_MAP: Record<VehicleType, string> = {
  moto: "moto",
  carro: "pop",
  frete: "carga_leve",
};

export default function RidePage() {
  const router = useRouter();
  const { latitude, longitude, loading: geoLoading, requestPermission } = useGeolocation({ watch: false });
  const [pageState, setPageState] = useState<PageState>("idle");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [destSuggestions, setDestSuggestions] = useState<{ display: string; lat: number; lng: number }[]>([]);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ coordinates: [number, number][]; distanceKm: number; durationMin: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>("carro");
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [expandedSearch, setExpandedSearch] = useState(false);
  const [destFocused, setDestFocused] = useState(false);
  const destInputRef = useRef<HTMLInputElement>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showNegotiation, setShowNegotiation] = useState(false);

  const [driverInfo, setDriverInfo] = useState({ name: "Motorista", rating: 4.9, car: "Veículo", plate: "ABC-1234", color: "Prata", phone: "(11) 99999-0000", photo: "M" });
  const [eta, setEta] = useState(8);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const tripChannelRef = useRef<any>(null);
  const dispatchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const heartbeatChannelRef = useRef<any>(null);
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number; heading?: number } | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [recording, setRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { messages: chatMessages, send: sendChat, sendFile: sendFileChat, emitTyping, isTyping, typingLabel } = useTripChat(tripId, currentUserId);

  const rideStore = useRideStore();
  const walletStore = useWalletStore();
  const [isRequesting, setIsRequesting] = useState(false);

  // Sync ride store with local state
  useEffect(() => {
    if (pickupCoords) rideStore.setOrigin(pickupCoords);
  }, [pickupCoords]);
  useEffect(() => {
    if (destCoords) rideStore.setDestination(destCoords);
  }, [destCoords]);
  useEffect(() => {
    if (routeInfo) rideStore.setDistance(routeInfo.distanceKm);
  }, [routeInfo]);

  useEffect(() => {
    if (latitude && longitude) {
      setPickupCoords({ lat: latitude, lng: longitude });
      reverseGeocode(latitude, longitude).then(addr => {
        if (addr) setPickup(addr);
      });
    }
  }, [latitude, longitude]);

  async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt`,
        { headers: { "User-Agent": "TXDAPP/1.0" } }
      );
      const data = await res.json();
      return data?.display_name ? shortenAddress(data.display_name) : null;
    } catch { return null; }
  }

  async function searchDestinations(query: string) {
    if (query.length < 3) { setDestSuggestions([]); return; }
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=pt`;
      if (pickupCoords && !expandedSearch) {
        const viewbox = [
          pickupCoords.lng - 0.36,
          pickupCoords.lat - 0.36,
          pickupCoords.lng + 0.36,
          pickupCoords.lat + 0.36,
        ].join(",");
        url += `&viewbox=${viewbox}&bounded=1`;
      }
      const res = await fetch(url, { headers: { "User-Agent": "TXDAPP/1.0" } });
      const data = await res.json();
      setDestSuggestions(data.map((r: any) => ({
        display: shortenAddress(r.display_name),
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      })));
    } catch { setDestSuggestions([]); }
  }

  function handleDestChange(value: string) {
    setDestination(value);
    searchDestinations(value);
  }

  async function selectDest(suggestion: { display: string; lat: number; lng: number }) {
    setDestination(suggestion.display);
    setDestCoords({ lat: suggestion.lat, lng: suggestion.lng });
    setDestSuggestions([]);
    setExpandedSearch(false);
    setRouteLoading(true);
    setPageState("route");

    const route = await calculateRoute(
      pickupCoords || { lat: latitude || -23.561, lng: longitude || -46.656 },
      { lat: suggestion.lat, lng: suggestion.lng }
    );

    if (route) {
      setRouteInfo(route);
      const distKm = route.distanceKm;
      const durMin = route.durationMin;
      const surge = pricingEngine.calculateSurgeMultiplier("medium");
      const estimates = await pricingEngine.estimateAllCategories(distKm, durMin, surge);
      const catId = CATEGORY_MAP[selectedVehicle];
      const est = estimates.find(e => e.categoryId === catId);
      setEstimatedFare(est?.totalFare || (distKm * 2.5));

      if (pickupCoords) {
        fetchNearbyDrivers(pickupCoords.lat, pickupCoords.lng, distKm);
      }
    }
    setRouteLoading(false);
  }

  const fetchNearbyDrivers = useCallback(async (lat: number, lng: number, distKm: number) => {
    setDriversLoading(true);
    try {
      const res = await fetch(`/api/marketplace/nearby?lat=${lat}&lng=${lng}&radius=${Math.max(5, Math.ceil(distKm * 1.5))}&service_type=${selectedVehicle}`);
      const data = await res.json();
      setNearbyDrivers(data.drivers || []);
    } catch {
      setNearbyDrivers([]);
    }
    setDriversLoading(false);
  }, [selectedVehicle]);

  useEffect(() => {
    if (routeInfo && selectedVehicle) {
      const dist = routeInfo.distanceKm;
      const dur = routeInfo.durationMin;
      const rates = { moto: { base: 3, perKm: 1.5, perMin: 0.3 }, carro: { base: 5, perKm: 1.8, perMin: 0.4 }, frete: { base: 10, perKm: 2.5, perMin: 0.5 } };
      const r = rates[selectedVehicle];
      const fare = Math.max(r.base + dist * r.perKm + dur * r.perMin, selectedVehicle === "moto" ? 7 : selectedVehicle === "carro" ? 10 : 15);
      setEstimatedFare(Math.round(fare * 100) / 100);
      if (pickupCoords) {
        fetchNearbyDrivers(pickupCoords.lat, pickupCoords.lng, dist);
      }
    }
  }, [selectedVehicle, routeInfo, pickupCoords, fetchNearbyDrivers]);

  function handleMapClick(coord: { lat: number; lng: number }) {
    if (pageState !== "idle" && pageState !== "route") return;
    setDestCoords(coord);
    reverseGeocode(coord.lat, coord.lng).then(async (addr) => {
      if (addr) {
        setDestination(addr);
        setDestSuggestions([]);
        setPageState("route");
        setRouteLoading(true);
        const route = await calculateRoute(
          pickupCoords || { lat: latitude || -23.561, lng: longitude || -46.656 },
          coord
        );
        if (route) {
          setRouteInfo(route);
          const surge = pricingEngine.calculateSurgeMultiplier("medium");
          const estimates = await pricingEngine.estimateAllCategories(route.distanceKm, route.durationMin, surge);
          const catId = CATEGORY_MAP[selectedVehicle];
          const est = estimates.find(e => e.categoryId === catId);
          setEstimatedFare(est?.totalFare || (route.distanceKm * 2.5));
          if (pickupCoords) {
            fetchNearbyDrivers(pickupCoords.lat, pickupCoords.lng, route.distanceKm);
          }
        }
        setRouteLoading(false);
      }
    });
  }

  function useCurrentLocation() {
    requestPermission();
  }

  async function handleBooking() {
    if (!pickupCoords || !destCoords) return;
    // Check wallet balance before booking (rule 123)
    if (!walletStore.hasSufficientFunds(Math.round(estimatedFare * 100))) {
      alert("Saldo insuficiente para esta corrida. Adicione fundos na Carteira.");
      return;
    }
    setIsRequesting(true);
    rideStore.setRequesting(true);
    setPageState("searching");

    fetch("/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin_lat: pickupCoords.lat, origin_lng: pickupCoords.lng,
        origin_address: pickup,
        dest_lat: destCoords.lat, dest_lng: destCoords.lng,
        dest_address: destination,
        vehicle_type: selectedVehicle,
        estimated_distance_km: routeInfo?.distanceKm,
        estimated_duration_min: routeInfo?.durationMin,
        estimated_fare: estimatedFare,
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (!data.tripId) { setPageState("no_drivers"); return; }
      setTripId(data.tripId);

      const { createClient } = await import("@/lib/supabase/browser");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      const channel = supabase.channel(`trip-${data.tripId}`);
      tripChannelRef.current = channel;

      channel.on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "trips",
        filter: `id=eq.${data.tripId}`,
      }, async (payload) => {
        const trip = payload.new as any;
        if (trip.status === "DRIVER_ACCEPTED" && trip.driver_id) {
          const { data: profile } = await supabase.from("driver_profiles").select("id, rating").eq("id", trip.driver_id).single();
          const { data: vehicle } = await supabase.from("vehicles").select("brand, model, color, license_plate").eq("driver_id", trip.driver_id).maybeSingle();
          setDriverInfo({
            name: "Motorista",
            rating: profile?.rating || 4.8,
            car: vehicle ? `${vehicle.brand || ""} ${vehicle.model || ""}`.trim() || "Veículo" : "Veículo",
            plate: vehicle?.license_plate || "XXX-0000",
            color: vehicle?.color || "Prata",
            phone: "(11) 99999-0000", photo: "M",
          });

          const hbChannel = supabase.channel(`driver-hb-${trip.driver_id}`);
          heartbeatChannelRef.current = hbChannel;
          hbChannel.on("postgres_changes", {
            event: "*", schema: "public", table: "driver_heartbeats",
            filter: `driver_id=eq.${trip.driver_id}`,
          }, (hbPayload: any) => {
            const hb = hbPayload.new as any;
            if (!hb?.lat || !hb?.lng) return;
            setDriverPosition({ lat: hb.lat, lng: hb.lng, heading: hb.heading });
            const target = pageState === "tracking" ? destCoords : pickupCoords;
            if (target) {
            const dist = haversineDistance({ lat: hb.lat, lng: hb.lng }, target);
            setEta(Math.max(1, Math.round(dist / 1000 / 35 * 60)));
          }
        }).subscribe();

        setPageState("found");
        if (pickupCoords) {
          setEta(1);
          }
          timerRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
          }, 1000);

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await notificationService.create(user.id, "trip", "Motorista a caminho",
              `${driverInfo.car} • ${driverInfo.plate} está indo até você`, "/ride");
          }
        } else if (trip.status === "IN_PROGRESS") {
          setPageState("tracking");
          if (destCoords && driverPosition) {
            const dist = haversineDistance(driverPosition, destCoords);
            setEta(Math.max(1, Math.round(dist / 1000 / 35 * 60)));
          }

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await notificationService.create(user.id, "trip", "Viagem em andamento",
              `Seguindo para ${destination.slice(0, 40)}`, "/ride");
          }
        } else if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
          channel.unsubscribe();
          if (heartbeatChannelRef.current) {
            heartbeatChannelRef.current.unsubscribe();
            heartbeatChannelRef.current = null;
          }

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const notifType = trip.status === "COMPLETED" ? "Viagem concluída" : "Viagem cancelada";
            const notifBody = trip.status === "COMPLETED"
              ? `Chegou ao destino • R$ ${(trip.final_fare || trip.estimated_fare)?.toFixed(2)}`
              : "A viagem foi cancelada";
            await notificationService.create(user.id, "trip", notifType, notifBody, "/dashboard/passenger");
          }
        }
      }).subscribe();

      dispatchTimeoutRef.current = setTimeout(() => {
        if (pageState === "searching") { setPageState("no_drivers"); }
      }, 45000);
    }).catch(() => setPageState("no_drivers"));
  }

  function reset() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (tripChannelRef.current) { tripChannelRef.current.unsubscribe(); tripChannelRef.current = null; }
    if (heartbeatChannelRef.current) { heartbeatChannelRef.current.unsubscribe(); heartbeatChannelRef.current = null; }
    if (dispatchTimeoutRef.current) { clearTimeout(dispatchTimeoutRef.current); dispatchTimeoutRef.current = undefined; }
    // Cleanup socket service channels (rule 80)
    if (tripId) socketService.unsubscribe(`trip-${tripId}`);
    // Reset ride store (rule 26)
    rideStore.resetRide();
    setIsRequesting(false);
    setPageState("idle");
    setDestination("");
    setDestCoords(null);
    setRouteInfo(null);
    setEstimatedFare(0);
    setElapsed(0);
    setDriverPosition(null);
    setNearbyDrivers([]);
    setSelectedDriver(null);
    setShowNegotiation(false);
    setTripId(null);
    setCurrentUserId(null);
    setChatOpen(false);
    setChatInput("");
    setUploadingFile(false);
    setRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    await sendFileChat(file);
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size > 0) {
          setUploadingFile(true);
          await sendFileChat(new File([blob], `audio_${Date.now()}.webm`, { type: "audio/webm" }));
          setUploadingFile(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {}
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (tripChannelRef.current) { tripChannelRef.current.unsubscribe(); }
      if (heartbeatChannelRef.current) { heartbeatChannelRef.current.unsubscribe(); }
      if (dispatchTimeoutRef.current) clearTimeout(dispatchTimeoutRef.current);
      // Cleanup all socket channels on unmount (rule 80)
      socketService.unsubscribeAll();
    };
  }, []);

  return (
    <main className="relative w-full h-dvh bg-background overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        <OpenStreetMap
          pickup={pickupCoords}
          destination={destCoords}
          route={routeInfo}
          showUserLocation={!!(latitude && longitude)}
          userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : null}
          drivers={driverPosition ? [{
            id: "assigned-driver",
            lat: driverPosition.lat,
            lng: driverPosition.lng,
            label: "Motorista",
            heading: driverPosition.heading,
          }] : []}
          interactive={true}
          height="100%"
          onMapClick={handleMapClick}
          onPickupDrag={(coord) => {
            setPickupCoords(coord);
            reverseGeocode(coord.lat, coord.lng).then(addr => {
              if (addr) setPickup(addr);
            });
          }}
          onDestDrag={(coord) => {
            setDestCoords(coord);
            reverseGeocode(coord.lat, coord.lng).then(async (addr) => {
              if (addr) {
                setDestination(addr);
                setRouteLoading(true);
                const route = await calculateRoute(
                  pickupCoords || { lat: latitude || -23.561, lng: longitude || -46.656 },
                  coord
                );
                if (route) {
                  setRouteInfo(route);
                  if (pickupCoords) {
                    fetchNearbyDrivers(pickupCoords.lat, pickupCoords.lng, route.distanceKm);
                  }
                }
                setRouteLoading(false);
              }
            });
          }}
        />
        {/* Price/time translucent overlay */}
        {routeInfo && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center gap-4 shadow-lg">
              <div className="flex items-center gap-1.5">
                <Route className="w-4 h-4 text-primary" />
                <span className="text-white text-sm font-semibold">{routeInfo.distanceKm} km</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-white text-sm font-semibold">{routeInfo.durationMin} min</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-white text-sm font-bold">{formatCurrency(estimatedFare)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top bar — back + location */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-safe pointer-events-none">
        <button onClick={() => router.back()} className="pointer-events-auto w-12 h-12 glass-panel rounded-full flex items-center justify-center hover:bg-white/10 transition active:scale-95">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Floating locate button */}
      <div className="absolute top-20 right-4 z-20 pointer-events-none">
        <button onClick={() => { requestPermission(); if (latitude && longitude) { setPickupCoords({ lat: latitude, lng: longitude }); } }}
          className="pointer-events-auto w-12 h-12 glass-panel rounded-full flex items-center justify-center hover:bg-white/10 transition active:scale-95 shadow-lg">
          <LocateFixed className="w-5 h-5 text-primary" />
        </button>
      </div>

      {/* Search inputs */}
      <div className="absolute top-14 left-0 right-0 z-20 px-4 space-y-2 pointer-events-none">
        <div className="pointer-events-auto glass-panel rounded-xl p-0.5 flex items-center gap-2 bg-background/80 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-0.5 pl-3">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="w-0.5 h-5 bg-primary/40" />
            <div className="w-2 h-2 rounded-full bg-red-400" />
          </div>
          <div className="flex-1 min-w-0 space-y-1 py-2 pr-3">
            <input
              value={pickup}
              readOnly
              onClick={useCurrentLocation}
               placeholder={geoLoading ? "Obtendo localização..." : "Sua localização"}
              className="w-full bg-transparent text-white text-sm font-medium placeholder-gray-400 outline-none cursor-pointer truncate"
            />
            <input
              ref={destInputRef}
              value={destination}
              onChange={e => handleDestChange(e.target.value)}
              onFocus={() => setDestFocused(true)}
              placeholder="Para onde vamos?"
              className="w-full bg-transparent text-white text-sm placeholder-gray-500 outline-none"
            />
          </div>
          {geoLoading ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin mr-3" />
          ) : latitude ? (
            <button onClick={useCurrentLocation} className="mr-3 text-primary hover:text-primary-hover" title="Atualizar localização">
              <LocateFixed className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Autocomplete dropdown */}
        <AnimatePresence>
          {destSuggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="pointer-events-auto glass-panel rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-background/95 backdrop-blur-xl">
              {destSuggestions.map((s, i) => (
                <button key={i} onClick={() => selectDest(s)}
                  className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3 transition border-b border-white/5 last:border-0">
                  <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="line-clamp-1">{s.display}</span>
                </button>
              ))}
              {pickupCoords && !expandedSearch && destSuggestions.length < 5 && (
                <button onClick={() => { setExpandedSearch(true); searchDestinations(destination); }}
                  className="w-full px-4 py-3 text-center text-xs text-primary hover:bg-white/5 transition">
                  Expandir busca para todo o país
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-safe pointer-events-none">
        <AnimatePresence mode="wait">
          {/* Route info + category select */}
          {(pageState === "route" || pageState === "idle") && (
            <motion.div key="route" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="pointer-events-auto glass-panel rounded-2xl p-4 space-y-4 bg-background/90 backdrop-blur-xl">
              {routeLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" /> Calculando rota...
                </div>
              ) : routeInfo ? (
                <>
                  {/* Route summary */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                      <Route className="w-4 h-4 text-primary" />
                      <span className="text-white font-medium">{routeInfo.distanceKm} km</span>
                      <span className="text-gray-500">•</span>
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-300">{routeInfo.durationMin} min</span>
                    </div>
                    <div className="text-lg font-bold text-primary">{formatCurrency(estimatedFare)}</div>
                  </div>

                  {/* Vehicle selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {VEHICLES.map(v => {
                      const Icon = v.icon;
                      const isSelected = selectedVehicle === v.id;
                      return (
                        <button key={v.id} onClick={() => setSelectedVehicle(v.id)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                            isSelected ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-gray-400 hover:border-white/30"
                          }`}>
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-semibold">{v.label}</span>
                          <span className={`text-[10px] ${isSelected ? "text-primary/80" : "text-gray-500"}`}>{v.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Nearby drivers with marketplace pricing */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {driversLoading ? "Buscando motoristas..." : `Motoristas disponíveis (${nearbyDrivers.length})`}
                      </h3>
                      {driversLoading && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {driversLoading && nearbyDrivers.length === 0 ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-white/10" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 bg-white/10 rounded w-24" />
                              <div className="h-2.5 bg-white/5 rounded w-32" />
                            </div>
                          </div>
                        ))
                      ) : nearbyDrivers.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-2">Nenhum motorista encontrado com preço para {VEHICLES.find(v => v.id === selectedVehicle)?.label}</p>
                      ) : (
                        nearbyDrivers.slice(0, 5).map((d: any) => (
                          <button key={d.driverId} onClick={() => { setSelectedDriver(d); setShowNegotiation(true); }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-left">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                              {d.rating >= 4.8 ? "★" : "M"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">Motorista</span>
                                <span className="text-xs text-amber-400 flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-400" />{d.rating.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {d.distanceKm} km • {d.totalTrips} corridas
                                {d.pricing && ` • R$ ${d.pricing.min_price_per_km}/km`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {d.pricing ? (
                                <span className="text-primary text-sm font-bold">
                                  R$ {Math.max(Math.round(routeInfo.distanceKm * d.pricing.suggested_price_per_km * 100) / 100, d.pricing.min_trip_value || 0).toFixed(0)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-500">—</span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Booking button */}
                  <ActionButton
                    variant="primary"
                    loading={isRequesting}
                    onAction={handleBooking}
                    disabled={!pickupCoords || !destCoords || !routeInfo}
                    className="w-full py-3.5 text-sm"
                  >
                    Buscar {selectedVehicle === "moto" ? "moto" : selectedVehicle === "carro" ? "carro" : "frete"} (preço fixo)
                  </ActionButton>
                </>
              ) : (
                /* Pickup/dest summary when no route yet */
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="truncate max-w-[200px]">{pickup ? `${pickup.slice(0, 40)}...` : "Sua localização"}</span>
                  </div>
                  {destCoords && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span className="truncate max-w-[150px]">{destination.slice(0, 30)}...</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Searching */}
          {pageState === "searching" && (
            <motion.div key="searching" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="pointer-events-auto glass-panel rounded-2xl p-5 flex flex-col items-center gap-3 bg-background/90 backdrop-blur-xl">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-white font-semibold">Procurando motorista...</p>
              <p className="text-xs text-gray-500">{pickup.slice(0, 25)} → {destination.slice(0, 25)}</p>
            </motion.div>
          )}

          {/* Found / Tracking */}
          {(pageState === "found" || pageState === "tracking") && (
            <motion.div key="tracking" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="pointer-events-auto glass-panel rounded-2xl p-4 space-y-3 bg-background/90 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                <CheckCircle className="w-5 h-5" />
                {pageState === "found" ? "Motorista a caminho" : "Viagem em andamento"}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{driverInfo.photo}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{driverInfo.name}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-amber-400">{driverInfo.rating}</span>
                  </div>
                  <p className="text-sm text-gray-400">{driverInfo.car} • {driverInfo.plate}</p>
                </div>
              </div>
              {pageState === "found" && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-gray-300">Chega em {eta} min</span>
                </div>
              )}
              <div className="text-xs text-gray-500">
                {pickup.slice(0, 30)} → {destination.slice(0, 30)}
              </div>

              {/* Chat toggle */}
              <button onClick={() => setChatOpen(!chatOpen)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 text-sm text-gray-300 hover:border-primary/30 hover:text-primary transition-all">
                <MessageSquare className="w-4 h-4" />
                {chatOpen ? "Fechar mensagens" : `Mensagem${chatMessages.length > 0 ? ` (${chatMessages.length})` : ""}`}
              </button>

              {/* Chat panel */}
              <AnimatePresence>
                {chatOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="max-h-48 overflow-y-auto space-y-2 mb-3 pt-1">
                      {uploadingFile && (
                        <div className="flex justify-center py-2">
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        </div>
                      )}
                      {chatMessages.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-3">Nenhuma mensagem ainda</p>
                      ) : (
                        chatMessages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                              msg.senderId === currentUserId
                                ? "bg-primary text-background rounded-br-md"
                                : "bg-white/10 text-white rounded-bl-md"
                            }`}>
                              {msg.fileType === "image" && msg.fileUrl ? (
                                <img src={msg.fileUrl} alt="Foto" className="rounded-xl max-w-full max-h-40 mb-1 object-cover cursor-pointer"
                                  onClick={() => window.open(msg.fileUrl, "_blank")} />
                              ) : msg.fileType === "audio" && msg.fileUrl ? (
                                <audio controls src={msg.fileUrl} className="max-w-full h-8" />
                              ) : null}
                              <p>{msg.content}</p>
                              <p className={`text-[10px] mt-0.5 ${msg.senderId === currentUserId ? "text-background/60" : "text-gray-500"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white/10 px-4 py-2 rounded-2xl rounded-bl-md text-xs text-gray-400 italic flex items-center gap-2">
                            <span className="flex gap-0.5">{typingLabel}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!chatInput.trim()) return;
                      await sendChat(chatInput);
                      setChatInput("");
                    }} className="flex gap-2">
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary/30 transition shrink-0 disabled:opacity-30">
                        <Image className="w-4 h-4 text-gray-400" />
                      </button>
                      <button type="button" onClick={toggleRecording} disabled={uploadingFile}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition shrink-0 disabled:opacity-30 ${
                          recording ? "bg-red-500 border-red-500 animate-pulse" : "bg-white/5 border-white/10 hover:border-primary/30"
                        }`}>
                        {recording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-gray-400" />}
                      </button>
                      <input value={chatInput} onChange={e => { setChatInput(e.target.value); emitTyping(); }}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/50 transition"
                      />
                      <button type="submit" disabled={!chatInput.trim() || uploadingFile}
                        className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-30 shrink-0">
                        <Send className="w-4 h-4 text-background" />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {pageState === "tracking" && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-gray-300">Chegada prevista: {eta} min</span>
                  </div>
                  <ActionButton variant="primary" onAction={reset} className="w-full py-3 text-sm">
                    Finalizar viagem
                  </ActionButton>
                </>
              )}
            </motion.div>
          )}

          {/* No drivers */}
          {pageState === "no_drivers" && (
            <motion.div key="no_drivers" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="pointer-events-auto glass-panel rounded-2xl p-5 text-center space-y-3 bg-background/90 backdrop-blur-xl">
              <Navigation className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-white font-semibold">Nenhum motorista disponível</p>
              <p className="text-xs text-gray-500">Tente novamente em alguns minutos</p>
              <ActionButton variant="primary" onAction={reset} className="w-full py-3 text-sm">
                Tentar novamente
              </ActionButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Negotiation Sheet */}
      <AnimatePresence>
        {showNegotiation && selectedDriver && pickupCoords && destCoords && routeInfo && (
          <NegotiationSheet
            driver={{
              driverId: selectedDriver.driverId,
              distanceKm: selectedDriver.distanceKm,
              rating: selectedDriver.rating,
              pricing: selectedDriver.pricing,
            }}
            distanceKm={routeInfo.distanceKm}
            originLat={pickupCoords.lat}
            originLng={pickupCoords.lng}
            destLat={destCoords.lat}
            destLng={destCoords.lng}
            serviceType={selectedVehicle}
            onClose={() => { setShowNegotiation(false); setSelectedDriver(null); }}
            onSuccess={(negotiation) => {
              setShowNegotiation(false);
              setSelectedDriver(null);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
