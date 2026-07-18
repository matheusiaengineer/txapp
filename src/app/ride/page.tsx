"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Navigation, ArrowLeft, ChevronDown,
  Clock, DollarSign, User, Star, Shield, Car, Phone,
  X, Route, Loader2, Zap, GripVertical, CheckCircle, Wallet,
} from "lucide-react";
import { ServiceCard } from "@/lib/components/service-card";
import { SERVICE_CATEGORIES } from "@/lib/mobility/service-categories";
import { pricingEngine } from "@/lib/mobility/pricing-engine";
import type { PriceEstimate } from "@/lib/mobility/pricing-engine";

type PageState = "search" | "selecting" | "confirming" | "searching" | "found" | "tracking" | "no_drivers";

interface MockPlace {
  display: string;
  address: string;
  lat: number;
  lng: number;
}

const MOCK_PLACES: MockPlace[] = [
  { display: "Av. Paulista, 1000", address: "Av. Paulista, 1000 - Bela Vista, São Paulo", lat: -23.561, lng: -46.656 },
  { display: "Praça da Sé", address: "Praça da Sé - Sé, São Paulo", lat: -23.550, lng: -46.633 },
  { display: "Shopping Morumbi", address: "Av. Roque Petroni Jr., 1089 - Brooklin, São Paulo", lat: -23.624, lng: -46.699 },
  { display: "Congonhas Airport", address: "Av. Washington Luís, s/n - Campo Belo, São Paulo", lat: -23.626, lng: -46.655 },
  { display: "Faria Lima, 3000", address: "Av. Brigadeiro Faria Lima, 3000 - Itaim Bibi, São Paulo", lat: -23.581, lng: -46.681 },
];

function formatCurrency(v: number): string {
  return `R$ ${v.toFixed(2)}`;
}

import { TxdGoogleMap } from "@/components/map/GoogleMap";

export default function RidePage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("search");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState<MockPlace[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<MockPlace[]>([]);
  const [activeInput, setActiveInput] = useState<"pickup" | "destination" | null>(null);
  const [estimates, setEstimates] = useState<PriceEstimate[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [step, setStep] = useState(1);
  const [qualified, setQualified] = useState<{ checked: boolean; isQualified: boolean; balance: number; required: number }>({
    checked: false, isQualified: false, balance: 0, required: 25,
  });

  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<any>(null);

  const [driverInfo, setDriverInfo] = useState({
    name: "Carlos Silva",
    rating: 4.9,
    car: "Toyota Corolla 2025",
    plate: "ABC-1D23",
    color: "Preto",
    phone: "(11) 99999-8888",
    photo: "CS",
  });
  const [eta, setEta] = useState(8);
  const [elapsed, setElapsed] = useState(0);
  const [noDrivers, setNoDrivers] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const nearbyPollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const selectedCategory = SERVICE_CATEGORIES.find(c => c.id === selectedId);
  const selectedEstimate = estimates.find(e => e.categoryId === selectedId);

  function handleInputChange(value: string, field: "pickup" | "destination") {
    if (field === "pickup") setPickup(value);
    else setDestination(value);

    if (value.length < 2) {
      if (field === "pickup") setPickupSuggestions([]);
      else setDestSuggestions([]);
      return;
    }

    const filtered = MOCK_PLACES.filter(p =>
      p.display.toLowerCase().includes(value.toLowerCase())
    );
    if (field === "pickup") setPickupSuggestions(filtered);
    else setDestSuggestions(filtered);
  }

  function selectPlace(place: MockPlace, field: "pickup" | "destination") {
    if (field === "pickup") {
      setPickup(place.address);
      setPickupSuggestions([]);
      setPickupCoords({ lat: place.lat, lng: place.lng });
    } else {
      setDestination(place.address);
      setDestSuggestions([]);
      setDestCoords({ lat: place.lat, lng: place.lng });
    }
    setActiveInput(null);
  }

  async function handleSearchRide() {
    if (!pickup || !destination) return;

    // Optional: Fetch directions from Directions API if loaded

    const distKm = 5 + Math.random() * 10;
    const durMin = 10 + Math.random() * 30;
    const surge = pricingEngine.calculateSurgeMultiplier("medium");
    const all = await pricingEngine.estimateAllCategories(distKm, durMin, surge);
    setEstimates(all);
    setPageState("selecting");
  }

  function handleSelectCategory(id: string) {
    setSelectedId(id);
    setStep(2);
  }

  useEffect(() => {
    async function checkQualification() {
      const serviceType = selectedCategory?.type === "freight" ? "freight" : selectedId === "moto" ? "moto" : "carro";
      const res = await fetch(`/api/freight/qualified?service=${serviceType}`);
      const data = await res.json();
      setQualified({ checked: true, isQualified: data.qualified, balance: data.balance, required: data.requiredDeposit });
    }
    if (pageState === "selecting") checkQualification();
  }, [pageState, selectedCategory, selectedId]);

  function handleConfirmBooking() {
    if (!qualified.isQualified && qualified.checked) {
      const serviceType = selectedCategory?.type === "freight" ? "freight" : selectedId === "moto" ? "moto" : "carro";
      router.push(`/deposit?service=${serviceType}`);
      return;
    }
    setNoDrivers(false);
    setPageState("searching");

    const lat = pickupCoords?.lat || -23.561;
    const lng = pickupCoords?.lng || -46.656;
    const modality = selectedId === "moto" ? "mototaxi" : selectedCategory?.type === "freight" ? "fretes" : "carro";
    let pollCount = 0;

    nearbyPollRef.current = setInterval(async () => {
      pollCount++;
      try {
        const res = await fetch(`/api/location/nearby?lat=${lat}&lng=${lng}&radius=15&modality=${modality}`);
        const data = await res.json();
        if (data.drivers && data.drivers.length > 0) {
          clearInterval(nearbyPollRef.current);
          nearbyPollRef.current = undefined;

          const d = data.drivers[0];
          setDriverInfo({
            name: d.driverId.slice(0, 8),
            rating: 4.8,
            car: "Veículo disponível",
            plate: d.driverId.slice(0, 7).toUpperCase(),
            color: "Prata",
            phone: "(11) 99999-0000",
            photo: d.driverId.charAt(0).toUpperCase(),
          });

          setPageState("found");
          let etaCount = 8;
          setEta(etaCount);
          timerRef.current = setInterval(() => {
            etaCount--;
            setEta(prev => Math.max(0, prev - 1));
            setElapsed(prev => prev + 1);
            if (etaCount <= 0 && timerRef.current) {
              clearInterval(timerRef.current);
              setPageState("tracking");
            }
          }, 1000);
        } else if (pollCount > 20) {
          clearInterval(nearbyPollRef.current);
          nearbyPollRef.current = undefined;
          setNoDrivers(true);
          setPageState("no_drivers");
        }
      } catch {
        if (pollCount > 20) {
          clearInterval(nearbyPollRef.current);
          nearbyPollRef.current = undefined;
          setNoDrivers(true);
          setPageState("no_drivers");
        }
      }
    }, 2000);
  }

  const startTracking = useCallback(() => {
    setPageState("tracking");
    setEta(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (nearbyPollRef.current) clearInterval(nearbyPollRef.current);
    };
  }, []);

  function reset() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (nearbyPollRef.current) { clearInterval(nearbyPollRef.current); nearbyPollRef.current = undefined; }
    setPageState("search");
    setPickup("");
    setDestination("");
    setPickupCoords(null);
    setDestCoords(null);
    setDirections(null);
    setEstimates([]);
    setSelectedId("");
    setStep(1);
    setElapsed(0);
    setNoDrivers(false);
  }

  return (
    <main className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Map area */}
      <div className="relative w-full flex-1 min-h-[300px]">
        <TxdGoogleMap pickupCoords={pickupCoords} destinationCoords={destCoords} directions={directions} />
        
        {pageState !== "search" && pickup && (
          <div className="absolute top-6 left-6 right-6 glass-panel p-3 flex items-center gap-3 z-10">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="truncate max-w-[40vw]">{pickup}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="truncate max-w-[200px]">{destination}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div className="relative z-20 mt-[-2rem] rounded-t-3xl bg-background border-t border-card-border flex-1 flex flex-col max-h-[75vh]">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">
          <AnimatePresence mode="wait">
            {pageState === "search" && (
              <motion.div
                key="search" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <h1 className="text-xl font-bold text-white">Para onde vamos?</h1>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input
                    value={pickup} onChange={e => handleInputChange(e.target.value, "pickup")}
                    onFocus={() => setActiveInput("pickup")}
                    placeholder="Local de partida"
                    className="w-full bg-card-bg border border-card-border rounded-xl py-3.5 pl-11 pr-4 text-white text-sm placeholder-gray-500 outline-none focus:border-primary/50 transition"
                  />
                  {activeInput === "pickup" && pickupSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 glass-panel rounded-xl overflow-hidden z-20">
                      {pickupSuggestions.map((p, i) => (
                        <button key={i} onClick={() => selectPlace(p, "pickup")}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3 transition"
                        >
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          {p.display}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                  <input
                    value={destination} onChange={e => handleInputChange(e.target.value, "destination")}
                    onFocus={() => setActiveInput("destination")}
                    placeholder="Para onde você vai?"
                    className="w-full bg-card-bg border border-card-border rounded-xl py-3.5 pl-11 pr-4 text-white text-sm placeholder-gray-500 outline-none focus:border-primary/50 transition"
                    onKeyDown={e => { if (e.key === "Enter") handleSearchRide(); }}
                  />
                  {activeInput === "destination" && destSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 glass-panel rounded-xl overflow-hidden z-20">
                      {destSuggestions.map((p, i) => (
                        <button key={i} onClick={() => selectPlace(p, "destination")}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3 transition"
                        >
                          <Navigation className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          {p.display}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSearchRide}
                  disabled={!pickup || !destination}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed text-background font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-base"
                >
                  Buscar corrida
                </button>
              </motion.div>
            )}

            {pageState === "selecting" && (
              <motion.div
                key="selecting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <button onClick={() => { setPageState("search"); setSelectedId(""); setStep(1); }}>
                    <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white transition" />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-white">Escolha a categoria</h2>
                    <p className="text-xs text-gray-500">Selecione o tipo de viagem</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {estimates.map((est, i) => {
                    const cat = SERVICE_CATEGORIES.find(c => c.id === est.categoryId);
                    if (!cat) return null;
                    return (
                      <ServiceCard
                        key={cat.id}
                        category={cat}
                        price={est.totalFare}
                        etaMinutes={Math.round(est.etaMinutes)}
                        selected={selectedId === cat.id}
                        onSelect={() => handleSelectCategory(cat.id)}
                        index={i}
                      />
                    );
                  })}
                </div>

                {step === 2 && selectedEstimate && selectedCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-4 space-y-3"
                  >
                    <h3 className="font-semibold text-white text-sm">Detalhamento do preço</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Tarifa base</span>
                        <span>{formatCurrency(selectedEstimate.baseFare)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Distância ({selectedEstimate.distanceKm.toFixed(1)} km)</span>
                        <span>{formatCurrency(selectedEstimate.distanceFare)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Tempo ({Math.round(selectedEstimate.durationMin)} min)</span>
                        <span>{formatCurrency(selectedEstimate.timeFare)}</span>
                      </div>
                      {selectedEstimate.surgeMultiplier > 1 && (
                        <div className="flex justify-between text-amber-400">
                          <span>Multiplicador ×{selectedEstimate.surgeMultiplier.toFixed(1)}</span>
                          <span>{formatCurrency(selectedEstimate.totalFare - (selectedEstimate.baseFare + selectedEstimate.distanceFare + selectedEstimate.timeFare))}</span>
                        </div>
                      )}
                      <div className="border-t border-card-border pt-2 flex justify-between text-white font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(selectedEstimate.totalFare)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Comissão TXD (25%)</span>
                        <span>{formatCurrency(selectedEstimate.commission)}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleConfirmBooking}
                      className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-base mt-2"
                    >
                      Confirmar corrida
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {pageState === "searching" && (
              <motion.div
                key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 space-y-6"
              >
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                  <Zap className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white">Procurando motorista</h2>
                  <p className="text-sm text-gray-500 mt-2">Aguarde enquanto encontramos o melhor motorista para você</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span>{pickup.slice(0, 30)}</span>
                  <Navigation className="w-3 h-3 ml-2" />
                  <span>{destination.slice(0, 30)}</span>
                </div>
              </motion.div>
            )}

            {(pageState === "found" || pageState === "tracking") && (
              <motion.div
                key="tracking" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {pageState === "found" && (
                  <>
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-semibold">Motorista a caminho</span>
                    </div>
                    <div className="glass-panel p-4 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                        {driverInfo.photo}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{driverInfo.name}</span>
                          <div className="flex items-center gap-1 text-xs text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {driverInfo.rating}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">{driverInfo.car} • {driverInfo.color}</p>
                        <p className="text-xs text-gray-500">{driverInfo.plate}</p>
                      </div>
                      <button className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition">
                        <Phone className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="glass-panel p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>Chega em {eta} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Car className="w-4 h-4 text-primary" />
                          <span>{driverInfo.plate}</span>
                        </div>
                      </div>
                      <div className="relative h-1.5 bg-card-border rounded-full overflow-hidden">
                        <motion.div
                          className="absolute left-0 top-0 h-full bg-primary rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: `${Math.max(0, (1 - eta / 8) * 100)}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{pickup.slice(0, 25)}</span>
                        <span>{destination.slice(0, 25)}</span>
                      </div>
                    </div>
                    {selectedEstimate && (
                      <div className="flex justify-between items-center glass-panel p-3">
                        <span className="text-sm text-gray-400">{selectedCategory?.name}</span>
                        <span className="font-bold text-white">{formatCurrency(selectedEstimate.totalFare)}</span>
                      </div>
                    )}
                    <button
                      onClick={startTracking}
                      className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all text-sm"
                    >
                      Acompanhar em tempo real
                    </button>
                  </>
                )}

                {pageState === "tracking" && (
                  <>
                    <div className="flex items-center gap-2 text-primary">
                      <Route className="w-5 h-5" />
                      <span className="text-sm font-semibold">Viagem em andamento</span>
                    </div>
                    <div className="glass-panel p-4 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                        {driverInfo.photo}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{driverInfo.name}</span>
                          <div className="flex items-center gap-1 text-xs text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {driverInfo.rating}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">{driverInfo.car} • {driverInfo.plate}</p>
                      </div>
                    </div>
                    <div className="glass-panel p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          <div className="w-0.5 h-8 bg-primary/30" />
                          <div className="w-3 h-3 rounded-full bg-red-400" />
                        </div>
                        <div className="flex-1 text-sm space-y-4">
                          <div>
                            <p className="text-white font-medium">Partida</p>
                            <p className="text-gray-500 text-xs truncate">{pickup}</p>
                          </div>
                          <div>
                            <p className="text-white font-medium">Destino</p>
                            <p className="text-gray-500 text-xs truncate">{destination}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {selectedEstimate && (
                      <div className="glass-panel p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="text-sm text-gray-300">Valor estimado</span>
                        </div>
                        <span className="font-bold text-white">{formatCurrency(selectedEstimate.totalFare)}</span>
                      </div>
                    )}
                    <button
                      onClick={reset}
                      className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all text-sm"
                    >
                      Finalizar viagem
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {pageState === "no_drivers" && (
              <motion.div
                key="no_drivers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Navigation className="w-8 h-8 text-amber-400" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white">Nenhum motorista disponível</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Não encontramos motoristas próximos para esta categoria. Tente novamente em alguns minutos ou escolha outra modalidade.
                  </p>
                </div>
                <button onClick={() => { setPageState("selecting"); setStep(1); }}
                  className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 rounded-xl transition-all text-sm"
                >
                  Escolher outra categoria
                </button>
                <button onClick={reset}
                  className="w-full bg-card-bg border border-card-border hover:border-primary/30 text-gray-300 font-semibold py-3.5 rounded-xl transition-all text-sm"
                >
                  Nova busca
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
