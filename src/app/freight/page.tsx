"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, MapPin, Navigation, ArrowLeft, ArrowRight,
  Upload, Weight, Box, FileText, Shield, CheckCircle,
  Truck, Clock, DollarSign, Camera, X, Loader2,
  Percent, Scale, Ruler, Home, Phone, User,
} from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/mobility/service-categories";
import { freightEngine } from "@/lib/freight/freight-engine";
import type { FreightQuote, FreightShipment } from "@/lib/freight/freight-engine";
import { triggerHaptic } from "@/lib/haptics";

const TOTAL_STEPS = 5;

const MOCK_PLACES = [
  { display: "Av. Paulista, 1000", address: "Av. Paulista, 1000 - Bela Vista, São Paulo" },
  { display: "Rua Oscar Freire, 900", address: "Rua Oscar Freire, 900 - Jardins, São Paulo" },
  { display: "Av. Engenheiro Luís Carlos Berrini", address: "Av. Eng. Luís Carlos Berrini, 1500 - Brooklin, São Paulo" },
  { display: "Marginal Tietê, 2000", address: "Av. Marginal Tietê, 2000 - Vila Maria, São Paulo" },
];

function formatCurrency(v: number): string {
  return `R$ ${v.toFixed(2)}`;
}

export default function FreightPage() {
  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupContact, setPickupContact] = useState("");
  const [deliveryContact, setDeliveryContact] = useState("");
  const [weight, setWeight] = useState<number>(10);
  const [volume, setVolume] = useState<number>(0.5);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [declaredValue, setDeclaredValue] = useState<number>(0);
  const [insuranceOptIn, setInsuranceOptIn] = useState(true);
  const [quotes, setQuotes] = useState<FreightQuote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [shipment, setShipment] = useState<FreightShipment | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<typeof MOCK_PLACES>([]);
  const [destSuggestions, setDestSuggestions] = useState<typeof MOCK_PLACES>([]);

  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
  const freightCategories = SERVICE_CATEGORIES.filter(c => c.type === "freight");

  function handlePlaceSearch(value: string, field: "pickup" | "destination") {
    if (field === "pickup") setPickup(value);
    else setDestination(value);
    if (value.length < 2) {
      if (field === "pickup") setPickupSuggestions([]);
      else setDestSuggestions([]);
      return;
    }
    const filtered = MOCK_PLACES.filter(p => p.display.toLowerCase().includes(value.toLowerCase()));
    if (field === "pickup") setPickupSuggestions(filtered);
    else setDestSuggestions(filtered);
  }

  function selectPlace(place: typeof MOCK_PLACES[0], field: "pickup" | "destination") {
    triggerHaptic("light");
    if (field === "pickup") { setPickup(place.address); setPickupSuggestions([]); }
    else { setDestination(place.address); setDestSuggestions([]); }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) setPhotos(prev => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(f);
    });
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
  }

  async function generateQuotes() {
    triggerHaptic("medium");
    setLoading(true);
    const distKm = 5 + Math.random() * 30;
    const results = await Promise.all(
      freightCategories.map(cat =>
        freightEngine.calculateQuote(weight, volume, distKm, cat.id, declaredValue)
      )
    );
    setQuotes(results.sort((a, b) => a.total - b.total));
    setSelectedQuoteId(results[0]?.id || "");
    setLoading(false);
    triggerHaptic("success");
    setStep(3);
  }

  async function confirmShipment() {
    if (!selectedQuote) return;
    setLoading(true);
    const result = await freightEngine.createShipment(
      selectedQuote,
      { address: pickup, contact: pickupContact },
      { address: destination, contact: deliveryContact },
      description,
      insuranceOptIn ? declaredValue : 0
    );
    setShipment(result);
    setLoading(false);
    setStep(5);
  }

  function reset() {
    setStep(1);
    setPickup(""); setDestination("");
    setPickupContact(""); setDeliveryContact("");
    setWeight(10); setVolume(0.5);
    setDescription(""); setPhotos([]);
    setDeclaredValue(0); setInsuranceOptIn(true);
    setQuotes([]); setSelectedQuoteId("");
    setShipment(null);
  }

  const canProceedStep1 = pickup && destination && pickupContact && deliveryContact;
  const canProceedStep2 = weight > 0 && volume > 0 && description.length > 0;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-card-border px-5 py-4">
        <div className="flex items-center gap-3">
          {step > 1 ? (
            <button onClick={() => setStep(prev => Math.max(1, prev - 1))}>
              <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white transition" />
            </button>
          ) : null}
          <div className="flex-1">
            <h1 className="font-bold text-white text-lg">TXD Frete</h1>
            <p className="text-xs text-gray-500">Transporte de cargas e mercadorias</p>
          </div>
          <Truck className="w-6 h-6 text-primary" />
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mt-3">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
              i + 1 <= step ? "bg-primary" : "bg-card-border"
            }`} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Endereços</span>
          <span>Carga</span>
          <span>Cotação</span>
          <span>Seguro</span>
          <span>Rastrear</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Addresses */}
          {step === 1 && (
            <motion.div
              key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-white">Endereços</h2>
              <div className="space-y-3">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input value={pickup} onChange={e => handlePlaceSearch(e.target.value, "pickup")}
                    placeholder="Endereço de coleta"
                    className="w-full bg-card-bg border border-card-border rounded-xl py-3.5 pl-11 pr-4 text-white text-sm placeholder-gray-500 outline-none focus:border-primary/50 transition"
                  />
                  {pickupSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 glass-panel rounded-xl overflow-hidden z-20">
                      {pickupSuggestions.map((p, i) => (
                        <button key={i} onClick={() => selectPlace(p, "pickup")}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3 transition"
                        ><MapPin className="w-3.5 h-3.5 text-primary shrink-0" />{p.display}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center -my-1">
                  <div className="w-8 h-8 rounded-full bg-card-bg border border-card-border flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
                <div className="relative">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                  <input value={destination} onChange={e => handlePlaceSearch(e.target.value, "destination")}
                    placeholder="Endereço de entrega"
                    className="w-full bg-card-bg border border-card-border rounded-xl py-3.5 pl-11 pr-4 text-white text-sm placeholder-gray-500 outline-none focus:border-primary/50 transition"
                  />
                  {destSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 glass-panel rounded-xl overflow-hidden z-20">
                      {destSuggestions.map((p, i) => (
                        <button key={i} onClick={() => selectPlace(p, "destination")}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3 transition"
                        ><Navigation className="w-3.5 h-3.5 text-red-400 shrink-0" />{p.display}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Contato coleta</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input value={pickupContact} onChange={e => setPickupContact(e.target.value)}
                        placeholder="Telefone"
                        className="w-full bg-card-bg border border-card-border rounded-xl py-3 pl-10 pr-3 text-white text-sm placeholder-gray-500 outline-none focus:border-primary/50 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Contato entrega</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input value={deliveryContact} onChange={e => setDeliveryContact(e.target.value)}
                        placeholder="Telefone"
                        className="w-full bg-card-bg border border-card-border rounded-xl py-3 pl-10 pr-3 text-white text-sm placeholder-gray-500 outline-none focus:border-primary/50 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setStep(2)} disabled={!canProceedStep1}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed text-background font-bold py-3.5 rounded-xl transition-all text-base"
              >
                Continuar
              </button>
            </motion.div>
          )}

          {/* Step 2: Cargo details */}
          {step === 2 && (
            <motion.div
              key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-white">Detalhes da carga</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Peso (kg)
                  </label>
                  <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))}
                    min={0} step={0.1}
                    className="w-full bg-card-bg border border-card-border rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Ruler className="w-3 h-3" /> Volume (m³)
                  </label>
                  <input type="number" value={volume} onChange={e => setVolume(Number(e.target.value))}
                    min={0} step={0.01}
                    className="w-full bg-card-bg border border-card-border rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50 transition"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Descrição da carga
                </label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Caixas de equipamentos eletrônicos, 5 unidades..."
                  rows={3}
                  className="w-full bg-card-bg border border-card-border rounded-xl py-3 px-4 text-white text-sm placeholder-gray-500 outline-none focus:border-primary/50 transition resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Fotos da carga
                </label>
                <input ref={fileInputRef} type="file" accept="image/*" multiple
                  onChange={handlePhotoUpload} className="hidden" />
                <div className="flex flex-wrap gap-2">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-card-border flex flex-col items-center justify-center text-gray-500 hover:border-primary/50 hover:text-primary transition"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-xs mt-1">Add</span>
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => generateQuotes()} disabled={!canProceedStep2}
                  className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed text-background font-bold py-3.5 rounded-xl transition-all text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Calculando...
                    </span>
                  ) : "Ver cotações"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Quotes */}
          {step === 3 && (
            <motion.div
              key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-white">Cotações disponíveis</h2>
              <p className="text-sm text-gray-500">Selecione a melhor opção para sua carga</p>
              <div className="space-y-2">
                {quotes.map((q, i) => {
                  const cat = freightCategories.find(c => c.id === q.categoryId);
                  const selected = selectedQuoteId === q.id;
                  return (
                    <motion.button
                      key={q.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => { triggerHaptic("light"); setSelectedQuoteId(q.id); }}
                      className={`relative w-full text-left rounded-2xl p-4 transition-all cursor-pointer overflow-hidden ${
                        selected
                          ? "border border-primary bg-primary/10 shadow-[0_0_20px_rgba(62,203,142,0.2)]"
                          : "border border-card-border bg-card-bg hover:border-white/20"
                      }`}
                    >
                      {selected && (
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -skew-x-12"
                          initial={{ x: "-100%" }}
                          animate={{ x: "200%" }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: (cat?.color || "#E74C3C") + "20" }}>
                          <Package className="w-6 h-6" style={{ color: cat?.color || "#E74C3C" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{q.categoryName}</span>
                            <span className="font-bold text-white text-lg">{formatCurrency(q.total)}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{cat?.descriptionPt}</p>
                          <div className="flex gap-3 mt-2 text-xs text-gray-500">
                            <span>Distância: {q.distanceKm.toFixed(1)} km</span>
                            {cat?.maxWeight && <span>Max: {cat.maxWeight}kg</span>}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(4)} disabled={!selectedQuoteId}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed text-background font-bold py-3.5 rounded-xl transition-all text-base"
                >
                  Continuar com a Seleção
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Insurance */}
          {step === 4 && selectedQuote && (
            <motion.div
              key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-white">Seguro e confirmação</h2>
              <div className="glass-panel p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">Detalhes do frete</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>{selectedQuote.categoryName}</span>
                    <span className="text-white">{formatCurrency(selectedQuote.basePrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Taxa por peso ({selectedQuote.weight}kg × R$0,50)</span>
                    <span className="text-white">{formatCurrency(selectedQuote.weightPrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Taxa por volume ({selectedQuote.volume}m³ × R$10)</span>
                    <span className="text-white">{formatCurrency(selectedQuote.volumePrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Distância ({selectedQuote.distanceKm.toFixed(1)} km)</span>
                    <span className="text-white">{formatCurrency(selectedQuote.distancePrice)}</span>
                  </div>
                  {insuranceOptIn && (
                    <div className="flex justify-between text-amber-400">
                      <span>Seguro (1% do valor declarado)</span>
                      <span>{formatCurrency(selectedQuote.insurance)}</span>
                    </div>
                  )}
                  <div className="border-t border-card-border pt-2 flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(selectedQuote.total)}</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Seguro
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${
                    insuranceOptIn ? "bg-primary" : "bg-card-border"
                  }`}
                    onClick={() => setInsuranceOptIn(!insuranceOptIn)}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      insuranceOptIn ? "translate-x-[18px]" : "translate-x-0.5"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-white">Ativar seguro</span>
                    <p className="text-xs text-gray-500">Cobre danos e extravios da carga</p>
                  </div>
                </label>
                {insuranceOptIn && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Valor declarado</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input type="number" value={declaredValue}
                        onChange={e => setDeclaredValue(Number(e.target.value))} min={0}
                        placeholder="Valor da mercadoria"
                        className="w-full bg-background border border-card-border rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-gray-500 outline-none focus:border-primary/50 transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedQuote.requiresSpecialPermit && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-400">
                  Esta carga exige licença especial para transporte.
                </div>
              )}

              <button onClick={confirmShipment} disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-bold py-3.5 rounded-xl transition-all text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Confirmando...
                  </span>
                ) : "Confirmar frete"}
              </button>
            </motion.div>
          )}

          {/* Step 5: Tracking */}
          {step === 5 && shipment && (
            <motion.div
              key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="w-6 h-6" />
                <h2 className="text-lg font-bold text-white">Frete confirmado!</h2>
              </div>

              <div className="glass-panel p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">ID do envio</span>
                  <span className="text-xs font-mono text-primary">{shipment.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className="text-xs font-semibold text-amber-400 uppercase">{shipment.status.replace("_", " ")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Código de coleta</span>
                  <span className="text-xs font-mono text-white font-bold">{shipment.pickupCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Código de entrega</span>
                  <span className="text-xs font-mono text-white font-bold">{shipment.deliveryCode}</span>
                </div>
              </div>

              <div className="glass-panel p-4 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Rastreamento
                </h3>
                <div className="relative pl-6 space-y-5">
                  {shipment.trackingEvents.map((evt, i) => (
                    <div key={i} className="relative">
                      <div className="absolute left-[-18px] top-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      {i < shipment.trackingEvents.length - 1 && (
                        <div className="absolute left-[-14px] top-4 w-0.5 bottom-[-24px] bg-card-border" />
                      )}
                      <p className="text-sm text-white capitalize">{evt.status.replace(/_/g, " ")}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{evt.location}</p>
                      <p className="text-xs text-gray-600">{new Date(evt.timestamp).toLocaleString("pt-BR")}</p>
                    </div>
                  ))}
                  <div className="relative animate-pulse">
                    <div className="absolute left-[-18px] top-0.5 w-3 h-3 rounded-full bg-primary/50" />
                    <p className="text-sm text-gray-400">Próxima atualização...</p>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span className="truncate">{shipment.pickupAddress}</span>
                    </div>
                    <div className="my-2 border-l-2 border-dashed border-card-border ml-1.5 h-4" />
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span className="truncate">{shipment.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={reset}
                  className="flex-1 bg-card-bg border border-card-border hover:border-white/20 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
                >
                  Novo frete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
