"use client";

import React, {
  useState, useEffect, useCallback, useRef, useMemo,
  Suspense, memo, startTransition,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/browser";
import { useUser } from "@/lib/hooks/use-user";
import { usePassengerData } from "@/lib/hooks/use-passenger-data";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { useMediaQuery, useIsDesktop } from "@/lib/hooks/use-media-query";
import { useWalletStore } from "@/lib/store/wallet-store";
import { useRideStore } from "@/lib/store/ride-store";
import { useUIStore } from "@/lib/store/ui-store";
import { useToast, Toast } from "@/components/ui/toast";
import SosButton from "@/components/safety/SosButton";

const IcnBell = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);
const IcnUser = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IcnSearch = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>);
const IcnHome = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const IcnBriefcase = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>);
const IcnPlane = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>);
const IcnHeart = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>);
const IcnMapPin = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>);
const IcnCar = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-3-4h-6l-3 4-2.5 1.1C3.7 11.3 3 12.1 3 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>);
const IcnBike = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9V3h-3"/><path d="m21 6-5 5-3-3-4 5"/></svg>);
const IcnSparkles = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 6 6 0 0 0-9-9"/><path d="M20 11c0 4.4-2 8-6 8"/><path d="M4 13c0 3.3 2 6 5 6"/></svg>);
const IcnNavigation = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>);
const IcnX = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>);
const IcnMenu = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>);
const IcnEye = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>);
const IcnEyeOff = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>);
const IcnArrowRight = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>);
const IcnChevronRight = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>);
const IcnWallet = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>);
const IcnUsers = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const IcnLoader = ({ className = "" }: { className?: string }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);
const IcnStar = ({ className = "" }: { className?: string }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IcnClock = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const IcnDollar = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const IcnGift = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>);
const IcnPlus = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>);
const IcnCrosshair = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>);
const IcnAlert = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IcnCheck = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>);
const IcnCopy = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
const IcnShield = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const IcnBuilding = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="10" y2="6"/><line x1="14" y1="6" x2="16" y2="6"/></svg>);
const IcnTruck = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><circle cx="19" cy="18" r="2"/><circle cx="5" cy="18" r="2"/><path d="M14 18h1a1 1 0 0 0 1-1v-4l-3-5h4"/></svg>);
const IcnPackage = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>);
const IcnArrowLeft = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>);
const IcnPhone = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);

const animStyles = `
@keyframes txd-skeleton{0%{opacity:0.6}50%{opacity:1}100%{opacity:0.6}}
@keyframes txd-pulse-border{0%,100%{border-color:rgba(62,203,142,0.3)}50%{border-color:rgba(62,203,142,0.7)}}
@keyframes txd-bounce{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes txd-fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes txd-slideLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}
@keyframes txd-slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes txd-slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}
@keyframes txd-spin{to{transform:rotate(360deg)}}
`;

type UserRole = "passenger" | "driver" | "company" | "transporter" | "employee" | "admin";
type BalanceModalType = "hidden" | "insufficient";
type FreightStep = "carga" | "endereco" | "confirmacao";

interface ServiceOption { id: string; name: string; icon: React.FC; color: string; priceRange: string; eta: string; badge?: string; }
interface NearbyDriver { id: string; lat: number; lng: number; name?: string; modality?: string; photo_url?: string; }
interface AddressItem { id?: string; type: string; full_address?: string; lat?: number; lng?: number; }
interface NotificationItem { id: string; title: string; body: string; is_read: boolean; created_at: string; }

const services: ServiceOption[] = [
  { id: "moto", name: "TXD Moto", icon: IcnBike, color: "#FF6B35", priceRange: "R$ 7,50", eta: "2 min", badge: "Chega Rapido" },
  { id: "pop", name: "TXD Pop", icon: IcnCar, color: "#3ECB8E", priceRange: "R$ 12,50", eta: "3 min", badge: "Mais Pedido" },
  { id: "comfort", name: "TXD Comfort", icon: IcnSparkles, color: "#8B5CF6", priceRange: "R$ 25,00", eta: "5 min" },
  { id: "black", name: "TXD Black", icon: IcnShield, color: "#1a1a2e", priceRange: "R$ 42,00", eta: "7 min" },
];

const Skeleton = memo(function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl bg-white/5 ${className}`} style={{ animation: "txd-skeleton 1.5s ease-in-out infinite" }} aria-hidden="true" />;
});

function getGreeting(): string {
  const h = new Date().getHours();
  return h < 6 ? "Boa madrugada" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const id = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return debounced;
}

function logEvent(action: string, payload?: Record<string, unknown>) {
  try { if (typeof window !== "undefined" && (window as any).gtag) (window as any).gtag("event", action, payload); } catch { /* */ }
}

function luhnCheck(card: string): boolean {
  let sum = 0, alt = false;
  for (let i = card.length - 1; i >= 0; i--) {
    let d = parseInt(card[i], 10); if (isNaN(d)) return false;
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d; alt = !alt;
  }
  return sum % 10 === 0;
}

const LazyMap = dynamic(() => import("@/components/txd/txd-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[200px] rounded-2xl flex items-center justify-center" style={{ background: "#121212" }} aria-label="Carregando mapa">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full" style={{ animation: "txd-spin 0.8s linear infinite" }} />
    </div>
  ),
});

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const supabase = createClient();
  useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return;
      supabase.from("notifications").select("*").eq("profile_id", u.id).order("created_at", { ascending: false }).limit(10)
        .then(({ data }) => { if (data) setItems(data as NotificationItem[]); }, () => {});
    }, () => {});
  }, []);
  const handleClick = useCallback(async (n: NotificationItem) => {
    try {
      if (!n.is_read) { await supabase.from("notifications").update({ is_read: true }).eq("id", n.id); setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x)); }
    } catch { /* */ }
    onClose();
  }, [supabase, onClose]);
  return (
    <div ref={ref} role="menu" className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden z-50" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", animation: "txd-fadeIn 0.2s ease-out" }}>
      <div className="px-4 py-3 border-b border-white/10"><p className="text-sm font-semibold text-white">Notificacoes</p></div>
      {items.length === 0 && <p className="text-sm text-gray-500 text-center py-6">Nenhuma notificacao</p>}
      {items.map(n => (
        <button key={n.id} type="button" onClick={() => handleClick(n)} className="w-full px-4 py-3 text-left hover:bg-white/5 transition flex items-start gap-3" aria-label={n.title}>
          {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
          {n.is_read && <span className="w-2 h-2 shrink-0 mt-1.5" />}
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{n.title}</p><p className="text-xs text-gray-500">{n.body}</p></div>
        </button>
      ))}
    </div>
  );
}

function AddressModal({ open, onClose, addressType, userId, onSaved }: {
  open: boolean; onClose: () => void; addressType: string; userId: string; onSaved: () => void;
}) {
  const [query, setQuery] = useState(""); const [suggestions, setSuggestions] = useState<{ display: string; lat: number; lng: number }[]>([]);
  const [searching, setSearching] = useState(false); const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<{ display: string; lat: number; lng: number } | null>(null);
  const [type, setType] = useState(addressType || "home"); const [label, setLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null); const debouncedQuery = useDebounce(query, 400);
  const typeLabels: Record<string, string> = { home: "Casa", work: "Trabalho", favorite: "Favorito", other: "Outro" };
  useEffect(() => { if (open) { setQuery(""); setSuggestions([]); setSelected(null); setLabel(""); setType(addressType || "home"); setTimeout(() => inputRef.current?.focus(), 100); } }, [open, addressType]);
  useEffect(() => {
    if (debouncedQuery.length < 3) { setSuggestions([]); return; }
    let cancelled = false; setSearching(true);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedQuery)}&limit=5&accept-language=pt`, { headers: { "User-Agent": "TXDAPP/1.0" } })
      .then(r => r.json()).then(data => { if (!cancelled) setSuggestions(data.map((r: any) => ({ display: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) }))); })
      .catch(() => { if (!cancelled) setSuggestions([]); }).finally(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);
  const handleSave = useCallback(async () => {
    if (!selected) return; setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("saved_locations").upsert({ profile_id: userId, type, full_address: selected.display, lat: selected.lat, lng: selected.lng, label: label || undefined }, { onConflict: "profile_id, type" });
      if (error) throw error;
      onSaved(); onClose();
    } catch { /* */ }
    setSaving(false);
  }, [selected, userId, type, label, onSaved, onClose]);
  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=pt`, { headers: { "User-Agent": "TXDAPP/1.0" } });
        const data = await res.json();
        if (data.display_name) { setSelected({ display: data.display_name, lat: pos.coords.latitude, lng: pos.coords.longitude }); setQuery(data.display_name); setSuggestions([]); }
      } catch { /* */ }
    }, () => {}, { enableHighAccuracy: true, timeout: 10000 });
  }, []);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Adicionar endereco">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-y-auto" style={{ maxHeight: "85vh", background: "#121212", border: "1px solid rgba(255,255,255,0.06)", animation: "txd-slideUp 0.25s ease-out" }}>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(62,203,142,0.1)" }}><span style={{ color: "#3ECB8E" }}><IcnMapPin /></span></div>
              <div><h2 className="text-lg font-bold text-white">Adicionar endereco</h2><p className="text-xs text-gray-500">{typeLabels[type] || "Local"}</p></div>
            </div>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ background: "rgba(255,255,255,0.1)" }} aria-label="Fechar modal"><span className="text-gray-400 w-4 h-4"><IcnX /></span></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {["home", "work", "favorite", "other"].map(t => (
              <button key={t} type="button" onClick={() => setType(t)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition min-h-[44px]" style={{ background: type === t ? "#3ECB8E" : "rgba(255,255,255,0.05)", color: type === t ? "#000" : "#9CA3AF" }}>
                {t === "home" ? <span className="w-3.5 h-3.5"><IcnHome /></span> : t === "work" ? <span className="w-3.5 h-3.5"><IcnBriefcase /></span> : t === "favorite" ? <span className="w-3.5 h-3.5"><IcnHeart /></span> : <span className="w-3.5 h-3.5"><IcnMapPin /></span>}
                {typeLabels[t]}
              </button>
            ))}
          </div>
          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4">{searching ? <span style={{ animation: "txd-spin 0.8s linear infinite" }} className="block w-4 h-4"><IcnLoader /></span> : <IcnSearch />}</span>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Digite o endereco..." inputMode="text" autoComplete="off" className="w-full border rounded-xl py-3.5 pl-10 pr-4 text-white text-sm placeholder-gray-600 outline-none transition" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} aria-label="Buscar endereco" />
          </div>
          <button type="button" onClick={handleUseLocation} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-primary font-medium transition mb-3 min-h-[44px]" style={{ background: "rgba(62,203,142,0.1)" }} aria-label="Usar localizacao atual"><span className="w-4 h-4"><IcnCrosshair /></span> Usar localizacao atual</button>
          <div className="space-y-1 max-h-48 overflow-y-auto mb-4" role="listbox" aria-label="Sugestoes de endereco">
            {suggestions.map((s, i) => (
              <button key={i} type="button" role="option" aria-selected={selected?.lat === s.lat} onClick={() => { setSelected(s); setQuery(s.display); setSuggestions([]); }} className="w-full text-left px-4 py-3 rounded-xl text-sm flex items-start gap-3 transition min-h-[44px]" style={{ color: selected?.lat === s.lat ? "#3ECB8E" : "#D1D5DB", background: selected?.lat === s.lat ? "rgba(62,203,142,0.1)" : "transparent" }}><span className="w-4 h-4 mt-0.5 shrink-0 text-red-400"><IcnMapPin /></span><span className="line-clamp-2">{s.display}</span></button>
            ))}
            {query.length >= 3 && suggestions.length === 0 && !searching && <p className="text-sm text-gray-500 text-center py-4">Nenhum endereco encontrado</p>}
          </div>
          {selected && <div className="mb-4"><input value={label} onChange={e => setLabel(e.target.value)} placeholder="Apelido (ex: Casa da vo)" className="w-full border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} aria-label="Apelido do endereco" /></div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 font-medium py-3 rounded-xl transition text-sm min-h-[44px]" style={{ background: "rgba(255,255,255,0.05)", color: "#D1D5DB" }}>Cancelar</button>
            <button type="button" onClick={handleSave} disabled={!selected || saving} className="flex-1 font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 min-h-[44px]" style={{ background: !selected || saving ? "rgba(62,203,142,0.3)" : "#3ECB8E", color: "#000", opacity: !selected ? 0.5 : 1 }} aria-label="Salvar endereco">
              {saving ? <span className="w-4 h-4" style={{ animation: "txd-spin 0.8s linear infinite" }}><IcnLoader /></span> : null} Salvar endereco
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ open, onClose, userName, userAvatar, role, kycStatus, onKYCAlert }: {
  open: boolean; onClose: () => void; userName: string; userAvatar?: string | null; role: UserRole; kycStatus?: string; onKYCAlert: () => void;
}) {
  const router = useRouter();
  const ringColor = kycStatus === "approved" ? "#3ECB8E" : kycStatus === "pending" ? "#EAB308" : "#EF4444";
  const links = role === "company" ? [
    { label: "Fretes Ativos", href: "/dashboard/company", icon: IcnPackage },
    { label: "Historico", href: "/dashboard/company", icon: IcnClock },
    { label: "Carteira", href: "/dashboard/passenger/wallet", icon: IcnWallet },
    { label: "Funcionarios", href: "/dashboard/company", icon: IcnUsers },
    { label: "Configuracoes", href: "/settings", icon: null },
  ] : [
    { label: "Historico", href: "/dashboard/passenger/history", icon: IcnClock },
    { label: "Carteira", href: "/dashboard/passenger/wallet", icon: IcnWallet },
    { label: "Favoritos", href: "/dashboard/passenger/favorites", icon: IcnHeart },
    { label: "Indique e Ganhe", href: "/social", icon: IcnGift },
    { label: "Configuracoes", href: "/settings", icon: null },
  ];
  const handleNav = useCallback((href: string) => { onClose(); startTransition(() => router.push(href)); }, [onClose, router]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose} role="presentation">
      <nav role="navigation" aria-label="Menu lateral" className="h-full flex flex-col" style={{ width: "80%", maxWidth: "320px", background: "#121212", borderRight: "1px solid rgba(255,255,255,0.06)", animation: "txd-slideLeft 0.2s ease-out" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { if (kycStatus === "approved") handleNav("/dashboard/verificacao"); else onKYCAlert(); }} className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shrink-0 transition-all" style={{ background: "rgba(62,203,142,0.2)", border: "2px solid " + ringColor, outline: "none" }} aria-label="Perfil do usuario">
              {userAvatar ? <img src={userAvatar} alt="" className="w-full h-full object-cover" /> : <span className="w-6 h-6" style={{ color: "#3ECB8E" }}><IcnUser /></span>}
            </button>
            <div><p className="font-semibold text-white text-sm truncate max-w-[160px]">{userName}</p><p className="text-xs text-gray-500 capitalize">{role || "Usuario"}</p></div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ background: "rgba(255,255,255,0.1)" }} aria-label="Fechar menu"><span className="w-4 h-4 text-gray-400"><IcnX /></span></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {links.map(link => (
            <button key={link.label} type="button" onClick={() => handleNav(link.href)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition min-h-[48px] text-left" aria-label={link.label}>
              {link.icon && <span className="w-5 h-5 shrink-0">{React.createElement(link.icon as React.FC)}</span>}
              {link.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-white/10 space-y-1">
          <button type="button" onClick={() => handleNav("/support")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition min-h-[44px]" aria-label="Ajuda"><span className="w-5 h-5"><IcnAlert /></span>Ajuda</button>
          <button type="button" onClick={() => { onClose(); localStorage.clear(); router.push("/"); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition min-h-[44px]" aria-label="Sair"><span className="w-5 h-5"><IcnAlert /></span>Sair</button>
        </div>
      </nav>
    </div>
  );
}

function InsufficientBalanceModal({ open, onClose, onDeposit }: { open: boolean; onClose: () => void; onDeposit: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Saldo insuficiente">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-6 space-y-4" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)", animation: "txd-fadeIn 0.2s ease-out" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(239,68,68,0.1)" }}><span className="w-7 h-7 text-red-400"><IcnAlert /></span></div>
        <div className="text-center"><h3 className="text-lg font-bold text-white">Saldo insuficiente</h3><p className="text-sm text-gray-400 mt-1">Recarregue sua carteira para solicitar a corrida.</p></div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 font-medium py-3 rounded-xl transition text-sm min-h-[44px]" style={{ background: "rgba(255,255,255,0.05)", color: "#D1D5DB" }}>Agora nao</button>
          <button type="button" onClick={onDeposit} className="flex-1 font-bold py-3 rounded-xl transition text-sm min-h-[44px]" style={{ background: "#3ECB8E", color: "#000" }}>Recarregar</button>
        </div>
      </div>
    </div>
  );
}

function DepositModal({ open, onClose, userId }: { open: boolean; onClose: () => void; userId: string }) {
  const [amount, setAmount] = useState(25); const [customAmount, setCustomAmount] = useState("");
  const [step, setStep] = useState<"select" | "pix">("select");
  const [pixCode, setPixCode] = useState(""); const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null); const [countdown, setCountdown] = useState(900);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const presets = [10, 25, 50, 100];
  const finalAmount = customAmount ? Math.max(5, Math.ceil(parseFloat(customAmount) / 5) * 5) : amount;
  useEffect(() => { if (!open) { setStep("select"); setCopied(false); setPixCode(""); setExpiresAt(null); setCustomAmount(""); setAmount(25); } }, [open]);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => { const left = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)); setCountdown(left); if (left <= 0) onClose(); };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [expiresAt, onClose]);
  const handleGeneratePix = useCallback(async () => {
    setLoading(true);
    try {
      logEvent("generate_pix", { amount: finalAmount });
      const res = await fetch("/api/pix/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: finalAmount, userId }) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.pixCode) setPixCode(data.pixCode);
      if (data.expiresAt) setExpiresAt(new Date(data.expiresAt));
      setStep("pix");
    } catch { toast.show("Erro ao gerar PIX. Tente novamente.", "error"); }
    setLoading(false);
  }, [finalAmount, userId, toast]);
  const handleCopyPix = useCallback(async () => {
    try { await navigator.clipboard.writeText(pixCode); } catch { const ta = document.createElement("textarea"); ta.value = pixCode; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); }
    setCopied(true); setTimeout(() => setCopied(false), 2000); logEvent("copy_pix");
  }, [pixCode]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Deposito via PIX">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl overflow-y-auto" style={{ maxHeight: "90vh", background: "#121212", borderTop: "1px solid rgba(255,255,255,0.06)", animation: "txd-slideUp 0.25s ease-out" }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{step === "select" ? "Adicionar Saldo" : "PIX na hora"}</h2>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }} aria-label="Fechar"><span className="w-4 h-4 text-gray-400"><IcnX /></span></button>
          </div>
          {step === "select" && (
            <>
              <div className="flex gap-3 justify-center mb-6">
                {presets.map(v => (
                  <button key={v} type="button" onClick={() => { setAmount(v); setCustomAmount(""); }} className="px-5 py-3 rounded-2xl text-sm font-bold transition min-h-[44px]" style={{ background: finalAmount === v && !customAmount ? "#3ECB8E" : "rgba(255,255,255,0.05)", color: finalAmount === v && !customAmount ? "#000" : "#FFF" }}>R$ {v}</button>
                ))}
              </div>
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-1 text-center">Ou digite um valor</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">R$</span>
                  <input value={customAmount} onChange={e => setCustomAmount(e.target.value.replace(/\D/g, ""))} placeholder="25" inputMode="numeric" className="w-full text-center text-3xl font-bold py-4 rounded-2xl outline-none transition" style={{ background: "rgba(255,255,255,0.05)", color: "#FFF", border: "1px solid rgba(255,255,255,0.1)" }} aria-label="Valor do deposito" />
                </div>
                {finalAmount < 5 && <p className="text-xs text-red-400 text-center mt-1">Valor minimo: R$ 5</p>}
              </div>
              <button type="button" onClick={handleGeneratePix} disabled={finalAmount < 5 || loading} className="w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 min-h-[56px] text-base" style={{ background: finalAmount >= 5 && !loading ? "#3ECB8E" : "rgba(62,203,142,0.3)", color: "#000", opacity: finalAmount < 5 ? 0.5 : 1 }} aria-label="Gerar PIX">
                {loading ? <span className="w-5 h-5" style={{ animation: "txd-spin 0.8s linear infinite" }}><IcnLoader /></span> : null}
                {loading ? "Gerando..." : "Pagar R$ " + finalAmount.toFixed(2)}
              </button>
            </>
          )}
          {step === "pix" && (
            <>
              {expiresAt && countdown > 0 && <div className="text-center mb-4"><p className="text-xs text-red-400 font-bold">Expira em {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}</p></div>}
              <div className="flex justify-center mb-6"><div style={{ background: "#FFF", padding: "16px", borderRadius: "16px" }}><div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-800 text-xs">QR CODE AQUI</div></div></div>
              <button type="button" onClick={handleCopyPix} className="w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 min-h-[56px] text-base" style={{ background: "#3ECB8E", color: "#000" }} aria-label={copied ? "Copiado" : "Copiar codigo PIX"}>
                <span className="w-5 h-5">{copied ? <IcnCheck /> : <IcnCopy />}</span>{copied ? "Copiado!" : "Copiar codigo PIX"}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">Apos o pagamento, o saldo sera atualizado automaticamente.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KYCAlertModal({ open, onClose, onVerify }: { open: boolean; onClose: () => void; onVerify: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Verificacao pendente">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-6 space-y-4" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)", animation: "txd-fadeIn 0.2s ease-out" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(234,179,8,0.15)" }}><span className="w-7 h-7 text-yellow-400"><IcnAlert /></span></div>
        <div className="text-center"><h3 className="text-lg font-bold text-white">Verificacao pendente</h3><p className="text-sm text-gray-400 mt-1">Complete seu cadastro para acessar todos os recursos.</p></div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 font-medium py-3 rounded-xl transition text-sm min-h-[44px]" style={{ background: "rgba(255,255,255,0.05)", color: "#D1D5DB" }}>Depois</button>
          <button type="button" onClick={onVerify} className="flex-1 font-bold py-3 rounded-xl transition text-sm min-h-[44px]" style={{ background: "#3ECB8E", color: "#000" }}>Verificar agora</button>
        </div>
      </div>
    </div>
  );
}

function RatingModal({ open, onClose, rideId, onSubmit }: {
  open: boolean; onClose: () => void; rideId: string; onSubmit: (rating: number, comment: string) => Promise<void>;
}) {
  const [rating, setRating] = useState(0); const [comment, setComment] = useState(""); const [saving, setSaving] = useState(false);
  const handleSubmit = useCallback(async () => {
    if (rating < 1) return; setSaving(true);
    try { await onSubmit(rating, comment); onClose(); } catch { /* */ }
    setSaving(false);
  }, [rating, comment, onSubmit, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Avaliar corrida">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-6 space-y-5" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)", animation: "txd-fadeIn 0.2s ease-out" }}>
        <h3 className="text-lg font-bold text-white text-center">Avalie sua corrida</h3>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} type="button" onClick={() => setRating(s)} className="p-1 transition min-h-[44px] min-w-[44px]" aria-label={"Nota " + s}>
              <span className={"w-10 h-10 block " + (s <= rating ? "text-yellow-400" : "text-gray-600")} style={{ fill: s <= rating ? "#EAB308" : "none" }}><IcnStar /></span>
            </button>
          ))}
        </div>
        <textarea value={comment} onChange={e => setComment(e.target.value.slice(0, 200))} placeholder="Comentario (opcional)" className="w-full border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition resize-none h-20" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} aria-label="Comentario" />
        <p className="text-xs text-gray-500 text-right">{comment.length}/200</p>
        <button type="button" onClick={handleSubmit} disabled={rating < 1 || saving} className="w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px]" style={{ background: rating >= 1 && !saving ? "#3ECB8E" : "rgba(62,203,142,0.3)", color: "#000", opacity: rating < 1 ? 0.5 : 1 }} aria-label="Confirmar avaliacao">
          {saving ? <span className="w-4 h-4" style={{ animation: "txd-spin 0.8s linear infinite" }}><IcnLoader /></span> : null}Confirmar
        </button>
      </div>
    </div>
  );
}

function FreightModal({ open, onClose, companyId }: { open: boolean; onClose: () => void; companyId: string }) {
  const [step, setStep] = useState<FreightStep>("carga"); const [vehicleType, setVehicleType] = useState("caminhao");
  const [description, setDescription] = useState(""); const [weight, setWeight] = useState("");
  const [photos, setPhotos] = useState<File[]>([]); const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false); const [uploadProgress, setUploadProgress] = useState(0);
  const [pickupAddress, setPickupAddress] = useState(""); const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupLat, setPickupLat] = useState(0); const [pickupLng, setPickupLng] = useState(0);
  const [deliveryLat, setDeliveryLat] = useState(0); const [deliveryLng, setDeliveryLng] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState(0); const [saving, setSaving] = useState(false);
  const toast = useToast(); const router = useRouter();
  const vehicleOptions = [
    { id: "caminhao", label: "Caminhao", icon: IcnTruck, basePrice: 400 },
    { id: "van", label: "Van", icon: IcnTruck, basePrice: 250 },
    { id: "fiorino", label: "Fiorino", icon: IcnCar, basePrice: 150 },
  ];
  useEffect(() => { if (!open) { setStep("carga"); setDescription(""); setWeight(""); setPhotos([]); setPhotoUrls([]); setPickupAddress(""); setDeliveryAddress(""); setEstimatedPrice(0); } }, [open]);
  const handlePhotoUpload = useCallback(async () => {
    if (photos.length === 0) return; setUploading(true); setUploadProgress(0);
    const supabase = createClient(); const urls: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      try {
        const ext = photos[i].name.split(".").pop(); const path = "freights/" + companyId + "/" + Date.now() + "_" + i + "." + ext;
        const { error } = await supabase.storage.from("company-freights").upload(path, photos[i]);
        if (error) throw error;
        const { data: url } = supabase.storage.from("company-freights").getPublicUrl(path);
        urls.push(url.publicUrl); setUploadProgress(Math.round(((i + 1) / photos.length) * 100));
      } catch { toast.show("Erro ao enviar foto", "error"); }
    }
    setPhotoUrls(urls); setUploading(false);
  }, [photos, companyId, toast]);
  const selectedVehicle = vehicleOptions.find(v => v.id === vehicleType);
  const handleConfirm = useCallback(async () => {
    if (!pickupAddress || !deliveryAddress || photoUrls.length === 0 || !weight) { toast.show("Preencha todos os campos", "error"); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const pinCode = String(Math.floor(100000 + Math.random() * 900000));
      const { data, error } = await supabase.from("freights").insert({
        company_id: companyId, vehicle_type: vehicleType, description, weight: parseFloat(weight),
        photo_urls: photoUrls, pickup_address: pickupAddress, pickup_lat: pickupLat, pickup_lng: pickupLng,
        delivery_address: deliveryAddress, delivery_lat: deliveryLat, delivery_lng: deliveryLng,
        estimated_price: estimatedPrice, pin_code: pinCode, status: "open",
      }).select().single();
      if (error) throw error;
      logEvent("create_freight", { freightId: data?.id });
      toast.show("Frete solicitado com sucesso!", "success");
      startTransition(() => router.push("/freight-tracking?id=" + data?.id));
    } catch { toast.show("Erro ao solicitar frete", "error"); }
    setSaving(false);
  }, [pickupAddress, deliveryAddress, photoUrls, weight, companyId, vehicleType, description, pickupLat, pickupLng, deliveryLat, deliveryLng, estimatedPrice, toast, router]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Solicitar frete">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-lg rounded-t-3xl overflow-y-auto" style={{ maxHeight: "90vh", background: "#121212", borderTop: "1px solid rgba(255,255,255,0.06)", animation: "txd-slideUp 0.25s ease-out" }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => { if (step === "carga") onClose(); else if (step === "endereco") setStep("carga"); else setStep("endereco"); }} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }} aria-label="Voltar"><span className="w-4 h-4 text-gray-400"><IcnArrowLeft /></span></button>
            <h2 className="text-lg font-bold text-white">Solicitar Frete</h2>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }} aria-label="Fechar"><span className="w-4 h-4 text-gray-400"><IcnX /></span></button>
          </div>
          <div className="flex gap-1 mb-6">
            {(["carga", "endereco", "confirmacao"] as FreightStep[]).map((s, i) => (
              <div key={s} className="flex-1 h-1 rounded-full" style={{ background: ["carga", "endereco", "confirmacao"].indexOf(step) >= i ? "#3ECB8E" : "rgba(255,255,255,0.1)" }} />
            ))}
          </div>
          {step === "carga" && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-400">Passo 1: Tipo de Carga</p>
              <div className="grid grid-cols-3 gap-3">
                {vehicleOptions.map(v => (
                  <button key={v.id} type="button" onClick={() => setVehicleType(v.id)} className="flex flex-col items-center gap-2 p-4 rounded-2xl transition min-h-[80px]" style={{ background: vehicleType === v.id ? "rgba(62,203,142,0.15)" : "rgba(255,255,255,0.05)", border: vehicleType === v.id ? "2px solid #3ECB8E" : "1px solid rgba(255,255,255,0.06)" }} aria-label={v.label}>
                    <span className="w-6 h-6" style={{ color: vehicleType === v.id ? "#3ECB8E" : "#9CA3AF" }}>{React.createElement(v.icon as React.FC)}</span>
                    <span className="text-xs font-medium text-white">{v.label}</span>
                  </button>
                ))}
              </div>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descricao da carga" className="w-full border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} aria-label="Descricao" />
              <input value={weight} onChange={e => setWeight(e.target.value.replace(/\D/g, ""))} placeholder="Peso estimado (kg)" inputMode="numeric" className="w-full border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} aria-label="Peso" />
              <div>
                <label className="block w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition" style={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)" }}>
                  <span className="w-8 h-8 block mx-auto mb-2 text-gray-500"><IcnPlus /></span>
                  <p className="text-sm text-gray-400 font-medium">{uploading ? "Enviando... " + uploadProgress + "%" : photoUrls.length > 0 ? photoUrls.length + " foto(s) anexada(s)" : "Adicionar foto da carga"}</p>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) setPhotos(Array.from(e.target.files)); }} />
                </label>
                {photos.length > 0 && !uploading && <button type="button" onClick={handlePhotoUpload} className="w-full mt-2 py-2 rounded-xl text-sm font-medium" style={{ background: "rgba(62,203,142,0.1)", color: "#3ECB8E" }}>Enviar fotos</button>}
              </div>
              <button type="button" onClick={() => { if (description && weight) setStep("endereco"); else toast.show("Preencha descricao e peso", "error"); }} className="w-full font-bold py-3 rounded-xl min-h-[44px]" style={{ background: "#3ECB8E", color: "#000" }}>Proximo</button>
            </div>
          )}
          {step === "endereco" && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-400">Passo 2: Enderecos</p>
              <input value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} placeholder="Endereco de coleta" className="w-full border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} aria-label="Coleta" />
              <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Endereco de entrega" className="w-full border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} aria-label="Entrega" />
              <button type="button" onClick={() => { if (pickupAddress && deliveryAddress) setStep("confirmacao"); else toast.show("Preencha ambos enderecos", "error"); }} className="w-full font-bold py-3 rounded-xl min-h-[44px]" style={{ background: "#3ECB8E", color: "#000" }}>Proximo</button>
            </div>
          )}
          {step === "confirmacao" && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-400">Passo 3: Confirmacao</p>
              <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                <p className="text-sm text-white"><strong>Veiculo:</strong> {selectedVehicle?.label}</p>
                <p className="text-sm text-white mt-1"><strong>Carga:</strong> {description} ({weight}kg)</p>
                <p className="text-sm text-white mt-1"><strong>Coleta:</strong> {pickupAddress}</p>
                <p className="text-sm text-white mt-1"><strong>Entrega:</strong> {deliveryAddress}</p>
                <p className="text-lg font-bold mt-2" style={{ color: "#FFD700" }}>Preco: R$ {estimatedPrice.toFixed(2)}</p>
              </div>
              <button type="button" onClick={handleConfirm} disabled={saving} className="w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 min-h-[56px]" style={{ background: !saving ? "#3ECB8E" : "rgba(62,203,142,0.3)", color: "#000" }} aria-label="Confirmar frete">
                {saving ? <span className="w-5 h-5" style={{ animation: "txd-spin 0.8s linear infinite" }}><IcnLoader /></span> : null}
                {saving ? "Solicitando..." : "Confirmar Frete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AddressCardProps { label: string; icon: React.FC; address: string; hasSaved: boolean; loading?: boolean; onClick: () => void; }
const AddressCard = memo(function AddressCard({ label, icon: Icon, address, hasSaved, loading, onClick }: AddressCardProps) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl transition-all min-h-[88px] min-w-[100px] shrink-0 w-[120px] sm:w-[130px]" style={{ background: "#11151c", border: hasSaved ? "1px solid rgba(255,255,255,0.06)" : "1px dashed rgba(255,255,255,0.2)", animation: "txd-fadeIn 0.3s ease-out" }} aria-label={hasSaved ? (label + ": " + address) : ("Adicionar " + label)}>
      {loading ? <Skeleton className="w-8 h-8 rounded-lg" /> : <span className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#3ECB8E" }}><Icon /></span>}
      {loading ? <Skeleton className="h-3 w-16" /> : <span className="text-xs font-medium text-white">{hasSaved ? label : "+ " + label}</span>}
      {loading ? <Skeleton className="h-2.5 w-20" /> : <span className="text-[10px] text-gray-500 text-center leading-tight truncate w-full px-1" style={{ fontSize: "0.7rem" }}>{hasSaved ? address : "Adicionar " + label.toLowerCase()}</span>}
    </button>
  );
});

interface VehicleCardProps { service: ServiceOption; isSelected: boolean; onSelect: () => void; isDesktop: boolean; }
const VehicleCard = memo(function VehicleCard({ service, isSelected, onSelect, isDesktop }: VehicleCardProps) {
  const Icon = service.icon;
  return (
    <button type="button" onClick={onSelect} className={"flex items-center gap-3 p-3 rounded-2xl border transition-all shrink-0 min-h-[72px] " + (isDesktop ? "w-full" : "min-w-[140px]")} style={{ background: isSelected ? "rgba(62,203,142,0.1)" : "#11151c", borderColor: isSelected ? "rgba(62,203,142,0.5)" : "rgba(255,255,255,0.06)", willChange: "transform", transform: "translateZ(0)" }} aria-label={service.name + " - " + service.priceRange} title={isDesktop ? (service.name + ": Carro rapido, ar condicionado") : undefined} onMouseEnter={e => { if (isDesktop) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }} onMouseLeave={e => { if (isDesktop) e.currentTarget.style.background = isSelected ? "rgba(62,203,142,0.1)" : "#11151c"; }}>
      {isDesktop && <input type="radio" name="vehicle" checked={isSelected} onChange={onSelect} className="accent-primary w-4 h-4 shrink-0" aria-label={service.name} />}
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: service.color + "20" }}><span className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: service.color }}><Icon /></span></div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5"><span className="text-sm font-bold text-white truncate">{service.name}</span>{service.badge && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: service.badge === "Mais Pedido" ? "#3ECB8E" : "#FF6B35", color: "#000" }}>{service.badge}</span>}</div>
        <div className="flex items-center gap-2 mt-0.5"><span className="text-xs font-bold" style={{ color: "#FFD700" }}>{service.priceRange}</span><span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(62,203,142,0.15)", color: "#3ECB8E" }}>{service.eta}</span></div>
      </div>
    </button>
  );
});

async function checkUserProfile(): Promise<{ role: UserRole; kycStatus: string; redirect: string | null }> {
  try {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { role: "passenger", kycStatus: "pending", redirect: "/auth/login" };
    const { data: profile } = await supabase.from("profiles").select("role, kyc_status").eq("id", authUser.id).single();
    const role = (profile?.role || "passenger") as UserRole;
    const kycStatus = profile?.kyc_status || "pending";
    if (role === "driver") return { role, kycStatus, redirect: "/dashboard/driver" };
    return { role, kycStatus, redirect: null };
  } catch { return { role: "passenger" as UserRole, kycStatus: "pending", redirect: null }; }
}

async function upsertGpsLocation(userId: string, lat: number, lng: number) {
  try { const supabase = createClient(); await supabase.from("user_locations").upsert({ profile_id: userId, lat, lng, updated_at: new Date().toISOString() }, { onConflict: "profile_id" }); } catch { /* */ }
}

async function calculateRidePrice(distanceKm: number, vehicleType: string): Promise<number> {
  try { const supabase = createClient(); const { data } = await supabase.rpc("calculate_ride_price", { distance: distanceKm, vehicle_type: vehicleType }); return data || 0; } catch { return 0; }
}

function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<{ kyc_status: string; company_id: string | null } | null>(null);
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase.from("profiles").select("kyc_status, company_id").eq("id", userId).single().then(({ data }) => { if (data) setProfile(data); }, () => {});
  }, [userId]);
  return profile;
}

function CompanyDashboard() {
  const { user, loading: userLoading } = useUser();
  const profile = useProfile(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"fretes" | "historico" | "relatorio">("fretes");
  const [freights, setFreights] = useState<any[]>([]);
  const [freightModalOpen, setFreightModalOpen] = useState(false);
  const toast = useToast();
  useEffect(() => {
    if (!profile?.company_id) return;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("freights").select("*").eq("company_id", profile.company_id).order("created_at", { ascending: false }).limit(20);
      if (data) setFreights(data);
    })();
  }, [profile?.company_id]);
  if (userLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0D14" }}><span className="w-8 h-8" style={{ animation: "txd-spin 0.8s linear infinite", color: "#3ECB8E" }}><IcnLoader /></span></div>;
  return (
    <div className="min-h-screen flex" style={{ background: "#0A0D14" }}>
      <button type="button" onClick={() => setSidebarOpen(true)} className="sm:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#11151c" }} aria-label="Abrir menu"><span className="w-5 h-5 text-white"><IcnMenu /></span></button>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role="company" userName={user?.email || ""} kycStatus={profile?.kyc_status || "pending"} onKYCAlert={() => {}} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 ml-0 sm:ml-64 min-h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Painel Empresarial</h1>
              <p className="text-sm text-gray-400 mt-1">Gerencie seus fretes e entregas</p>
            </div>
            <button type="button" onClick={() => setFreightModalOpen(true)} className="flex items-center gap-2 font-bold py-3 px-5 rounded-xl text-sm min-h-[44px]" style={{ background: "#3ECB8E", color: "#000" }} aria-label="Solicitar frete"><span className="w-4 h-4"><IcnPlus /></span>Novo frete</button>
          </div>
          <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            {(["fretes", "historico", "relatorio"] as const).map(t => (
              <button key={t} type="button" onClick={() => setActiveTab(t)} className={"flex-1 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] " + (activeTab === t ? "text-black" : "text-gray-400")} style={{ background: activeTab === t ? "#3ECB8E" : "transparent" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
          {activeTab === "fretes" && (
            <div className="space-y-3">
              {freights.length === 0 ? (
                <div className="text-center py-12"><p className="text-gray-500">Nenhum frete ativo</p></div>
              ) : freights.map(f => (
                <div key={f.id} className="p-4 rounded-2xl flex items-center justify-between" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="text-sm font-medium text-white">{f.pickup_address} → {f.delivery_address}</p>
                    <p className="text-xs text-gray-400 mt-1">{f.weight}kg · R$ {f.estimated_price?.toFixed(2)}</p>
                  </div>
                  <span className={"text-xs font-bold px-3 py-1 rounded-full " + (f.status === "open" ? "text-green-400 bg-green-400/10" : f.status === "in_progress" ? "text-blue-400 bg-blue-400/10" : "text-gray-400 bg-gray-400/10")}>{f.status}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === "historico" && <p className="text-gray-500 text-center py-12">Historico de fretes</p>}
          {activeTab === "relatorio" && <p className="text-gray-500 text-center py-12">Relatorios financeiros</p>}
        </div>
        <FreightModal open={freightModalOpen} onClose={() => setFreightModalOpen(false)} companyId={profile?.company_id || ""} />
      </main>
    </div>
  );
}

function PassengerDashboard() {
  const { user, loading: userLoading } = useUser();
  const profile = useProfile(user?.id);
  const { realBalance: walletBalance, isLoading: walletLoading, initializeWallet, subscribeToTransactions } = useWalletStore();
  const { isRequestingRide, setLocation } = useRideStore();
  const { addresses } = usePassengerData(user?.id);
  const { latitude: gpsLat, longitude: gpsLng, error: gpsError } = useGeolocation({ watch: true });
  const isDesktop = useIsDesktop();
  const toast = useToast();
  const router = useRouter();
  const supabase = createClient();

  const [greeting, setGreeting] = useState(getGreeting());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showKYCAlert, setShowKYCAlert] = useState(!profile?.kyc_status || profile?.kyc_status === "pending");
  const [showRating, setShowRating] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState("txd");
  const [pickupAddress, setPickupAddress] = useState<AddressItem | null>(null);
  const [destination, setDestination] = useState("");
  const [isRideSearching, setIsRideSearching] = useState(false);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [profileData, setProfileData] = useState<{ kyc_status: string; company_id: string | null } | null>(null);

  const storedVehicle = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const s = createClient();
    s.from("profiles").select("kyc_status, company_id").eq("id", user.id).single().then(({ data }) => { if (data) setProfileData(data); }, () => {});
  }, [user?.id]);

  const serviceOptions = useMemo<ServiceOption[]>(() => [
    { id: "txd", name: "TXD", icon: IcnCar, priceRange: "R$ 8,00 - R$ 25,00", eta: "3 min", color: "#3ECB8E", badge: "Mais Pedido" },
    { id: "txd-prime", name: "TXD Prime", icon: IcnSparkles, priceRange: "R$ 15,00 - R$ 40,00", eta: "5 min", color: "#FFD700" },
    { id: "txd-moto", name: "TXD Moto", icon: IcnBike, priceRange: "R$ 4,00 - R$ 15,00", eta: "2 min", color: "#FF6B35" },
    { id: "txd-pet", name: "TXD Pet", icon: IcnHeart, priceRange: "R$ 10,00 - R$ 30,00", eta: "7 min", color: "#E91E63" },
    { id: "txd-freight", name: "Frete", icon: IcnTruck, priceRange: "A partir de R$ 50,00", eta: "10 min", color: "#8B5CF6" },
  ], []);

  const kycStatus = profileData?.kyc_status || profile?.kyc_status || "pending";

  // Restore selected vehicle from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("txd_selected_vehicle");
      if (saved && serviceOptions.some(s => s.id === saved)) setSelectedVehicle(saved);
    } catch { /* */ }
  }, [serviceOptions]);

  // Persist selected vehicle
  useEffect(() => {
    if (selectedVehicle !== storedVehicle.current) {
      storedVehicle.current = selectedVehicle;
      try { localStorage.setItem("txd_selected_vehicle", selectedVehicle); } catch { /* */ }
    }
  }, [selectedVehicle]);

  // Update greeting at minute boundaries
  useEffect(() => {
    const now = new Date(); const msToNextMin = (60 - now.getSeconds()) * 1000;
    const t = setTimeout(() => { setGreeting(getGreeting()); }, msToNextMin);
    return () => clearTimeout(t);
  }, []);

  // Initialize wallet
  useEffect(() => { if (user) initializeWallet(user.id); }, [user, initializeWallet]);

  // Subscribe to wallet transactions
  useEffect(() => { if (user) { const unsub = subscribeToTransactions(user.id); return unsub; } }, [user, subscribeToTransactions]);

  // Upsert GPS location
  useEffect(() => {
    if (user && gpsLat && gpsLng) {
      setLocation({ lat: gpsLat, lng: gpsLng });
      upsertGpsLocation(user.id, gpsLat, gpsLng);
      const interval = setInterval(() => upsertGpsLocation(user.id, gpsLat, gpsLng), 120000);
      return () => clearInterval(interval);
    }
  }, [user, gpsLat, gpsLng, setLocation]);

  // Subscribe to nearby drivers
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("nearby-drivers-" + user.id).on("postgres_changes", { event: "*", schema: "public", table: "driver_heartbeats", filter: "status=eq.online" }, (payload: any) => {
      if (payload.new && user) {
        const R = 6371; const dLat = (payload.new.lat - (gpsLat || 0)) * Math.PI / 180; const dLng = (payload.new.lng - (gpsLng || 0)) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((gpsLat || 0) * Math.PI / 180) * Math.cos(payload.new.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dist <= 5) setNearbyDrivers(prev => { const exists = prev.find(d => d.id === payload.new.id); return exists ? prev.map(d => d.id === payload.new.id ? { ...d, lat: payload.new.lat, lng: payload.new.lng } : d) : [...prev, { id: payload.new.id, lat: payload.new.lat, lng: payload.new.lng, driverId: payload.new.driver_id, vehicleType: payload.new.vehicle_type || "txd" }]; });
      }
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, gpsLat, gpsLng, supabase]);

  // Handle notifications
  const unreadNotifications = 0; // simplified

  // Handle ride creation
  const handleRequestRide = useCallback(async () => {
    if (isRideSearching || !pickupAddress) { toast.show("Selecione um endereco de partida", "error"); return; }
    if (!destination) { toast.show("Informe o destino", "error"); return; }
    if (!user) { toast.show("Faca login primeiro", "error"); return; }
    if (walletBalance !== undefined && walletBalance < 500) { setShowDepositModal(true); return; }
    setIsRideSearching(true);
    try {
      const { data: ride, error } = await supabase.from("rides").insert({
        passenger_id: user.id, pickup_address: pickupAddress.full_address || pickupAddress.type || "",
        pickup_lat: pickupAddress.lat, pickup_lng: pickupAddress.lng,
        destination_address: destination, vehicle_type: selectedVehicle, status: "searching_driver",
        estimated_price: 0, payment_method: "wallet",
      }).select().single();
      if (error) throw error;
      setCurrentRideId(ride.id);
      logEvent("ride_requested", { rideId: ride.id, vehicleType: selectedVehicle });
      startTransition(() => router.push("/ride?id=" + ride.id));
    } catch (e) { toast.show("Erro ao solicitar corrida. Tente novamente.", "error"); logEvent("ride_request_error", { error: e }); }
    setIsRideSearching(false);
  }, [isRideSearching, pickupAddress, destination, user, walletBalance, selectedVehicle, supabase, toast, router]);

  // Handle rating submission
  const handleRatingSubmit = useCallback(async (rating: number, comment: string) => {
    if (!currentRideId || !user) return;
    try {
      const { error } = await supabase.from("ratings").insert({
        ride_id: currentRideId, rater_id: user.id, rating, comment,
        rater_role: "passenger",
      });
      if (error) throw error;
      await supabase.from("rides").update({ status: "rated" }).eq("id", currentRideId);
      toast.show("Avaliacao enviada!", "success");
      logEvent("ride_rated", { rideId: currentRideId, rating });
    } catch { toast.show("Erro ao enviar avaliacao", "error"); }
  }, [currentRideId, user, supabase, toast]);

  // Handle ride completion detection (simplified — check for completed rides on mount)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("rides").select("id,status").eq("passenger_id", user.id).eq("status", "completed").order("created_at", { ascending: false }).limit(1).single();
      if (data && !currentRideId) { setCurrentRideId(data.id); setShowRating(true); }
    })();
  }, [user, supabase, currentRideId]);

  if (userLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0D14" }}>
      <div className="flex flex-col items-center gap-3"><span className="w-8 h-8" style={{ animation: "txd-spin 0.8s linear infinite", color: "#3ECB8E" }}><IcnLoader /></span><p className="text-sm text-gray-500">Carregando...</p></div>
    </div>
  );
  const kycColor = useMemo(() => {
    const s = kycStatus;
    if (s === "approved") return { bg: "rgba(62,203,142,0.08)", border: "rgba(62,203,142,0.3)", text: "#3ECB8E" };
    if (s === "pending") return { bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.3)", text: "#EAB308" };
    if (s === "rejected") return { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", text: "#EF4444" };
    return { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", text: "#9CA3AF" };
  }, [kycStatus]);

  const fareSummary = useMemo(() => {
    if (!selectedVehicle || !pickupAddress) return null;
    const base: Record<string, number> = { "txd": 8, "txd-prime": 15, "txd-moto": 4, "txd-pet": 10, "txd-freight": 50 };
    const kmPrice: Record<string, number> = { "txd": 2.5, "txd-prime": 4, "txd-moto": 1.5, "txd-pet": 3, "txd-freight": 6 };
    const baseValue = base[selectedVehicle] || 8;
    const distanceKm = destination ? 5 : 0;
    const est = baseValue + distanceKm * (kmPrice[selectedVehicle] || 2.5);
    return { baseValue, distanceKm, estimatedTotal: est };
  }, [selectedVehicle, pickupAddress, destination]);

  const sortedAddresses = useMemo(() => {
    const order: Record<string, number> = { home: 0, work: 1, favorite: 2, other: 3 };
    return [...(addresses || [])].sort((a, b) => (order[a.type] ?? 99) - (order[b.type] ?? 99));
  }, [addresses]);

  return (<div className="min-h-screen flex" style={{ background: "#0A0D14" }}>
      <button type="button" onClick={() => setSidebarOpen(true)} className="sm:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#11151c" }} aria-label="Abrir menu"><span className="w-5 h-5 text-white"><IcnMenu /></span></button>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role="passenger" userName={user?.email || ""} kycStatus={kycStatus} onKYCAlert={() => setShowKYCAlert(true)} />
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto ml-0 sm:ml-64" style={{ background: "#0A0D14" }}>
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3" style={{ background: "rgba(10,13,20,0.9)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#3ECB8E" }}><span className="w-5 h-5 text-black"><IcnCar /></span></div>
            <div>
              <h1 className="text-base font-bold text-white">{greeting}, {user?.email?.split("@")[0] || "viajante"}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={"w-1.5 h-1.5 rounded-full " + (kycStatus === "approved" ? "bg-green-500" : kycStatus === "pending" ? "bg-yellow-500" : "bg-red-500")} />
                <span className="text-[10px] text-gray-500">{kycStatus === "approved" ? "Verificado" : kycStatus === "pending" ? "Pendente" : "Rejeitado"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { if (walletBalance !== undefined) setShowDepositModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs min-h-[36px]" style={{ background: "rgba(62,203,142,0.1)", color: "#3ECB8E" }} aria-label={"Carteira: R$ " + (walletBalance ?? 0).toFixed(2) + ", clique para depositar"}>
              <span className="w-3.5 h-3.5"><IcnWallet /></span>R$ {(walletBalance ?? 0).toFixed(2)}
            </button>
            <button type="button" onClick={() => setShowNotifications(true)} className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }} aria-label="Notificacoes">
              <span className="w-4 h-4 text-gray-400"><IcnBell /></span>
              {unreadNotifications > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#EF4444" }} />}
            </button>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-5 max-w-4xl mx-auto w-full" style={{ paddingBottom: isDesktop ? "2rem" : "7rem" }}>
          {!gpsError && gpsLat && gpsLng && (
            <div className="rounded-2xl overflow-hidden" style={{ height: "160px", background: "#11151c", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><span className="w-6 h-6" style={{ animation: "txd-spin 0.8s linear infinite", color: "#3ECB8E" }}><IcnLoader /></span></div>}>
                <LazyMap center={[gpsLat, gpsLng]} zoom={15} />
              </Suspense>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <div className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)" }} onClick={() => setShowAddressModal(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") setShowAddressModal(true); }} aria-label="Selecionar endereco de partida">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: "#3ECB8E" }} />
                  <span className="w-px h-6" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <span className="w-2 h-2 rounded-full" style={{ background: "#FF6B35" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{pickupAddress ? (pickupAddress.full_address || pickupAddress.type) : "Sua localizacao"}</p>
                  <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Para onde vai?" className="w-full bg-transparent text-sm text-gray-400 placeholder-gray-600 outline-none mt-1" aria-label="Destino" />
                </div>
              </div>
            </div>
          </div>

          {!destination && sortedAddresses.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {sortedAddresses.slice(0, 6).map(addr => (
                <AddressCard key={addr.id} label={{ home: "Casa", work: "Trabalho", favorite: "Favorito", other: "Outro" }[addr.type] || addr.type} icon={{ home: IcnHome, work: IcnBriefcase, favorite: IcnHeart, other: IcnMapPin }[addr.type] || IcnMapPin} address={addr.full_address} hasSaved={true} onClick={() => { setPickupAddress({ id: addr.id, type: addr.type, full_address: addr.full_address, lat: addr.lat, lng: addr.lng }); setShowAddressModal(false); }} />
              ))}
              <AddressCard label="Novo" icon={IcnPlus} address="" hasSaved={false} onClick={() => setShowAddressModal(true)} />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Servicos</h2>
              {isDesktop && <span className="text-xs text-gray-500">{nearbyDrivers.length} motoristas proximos</span>}
            </div>
            <div className={"flex gap-3 " + (isDesktop ? "flex-col" : "overflow-x-auto pb-2 scrollbar-none")} style={isDesktop ? {} : { scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {serviceOptions.map(s => (
                <VehicleCard key={s.id} service={s} isSelected={selectedVehicle === s.id} onSelect={() => setSelectedVehicle(s.id)} isDesktop={isDesktop} />
              ))}
            </div>
            {destination && selectedVehicle && pickupAddress && fareSummary && (
              <div className="p-4 rounded-2xl space-y-2" style={{ background: "#11151c", border: "1px solid rgba(255,255,255,0.06)", animation: "txd-fadeIn 0.2s ease-out" }}>
                <div className="flex items-center justify-between text-sm"><span className="text-gray-400">Tarifa base</span><span className="text-white font-medium">R$ {fareSummary.baseValue.toFixed(2)}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-gray-400">Distancia</span><span className="text-white font-medium">{fareSummary.distanceKm} km</span></div>
                <div className="border-t pt-2 mt-2 flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}><span className="text-sm font-bold text-white">Total estimado</span><span className="text-base font-bold" style={{ color: "#FFD700" }}>R$ {fareSummary.estimatedTotal.toFixed(2)}</span></div>
              </div>
            )}
          </div>

          {destination && selectedVehicle && pickupAddress && (
            <button type="button" onClick={handleRequestRide} disabled={isRideSearching} className="w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base min-h-[56px]" style={{ background: !isRideSearching ? "#3ECB8E" : "rgba(62,203,142,0.3)", color: "#000" }} aria-label="Solicitar corrida">
              {isRideSearching ? <span className="w-5 h-5" style={{ animation: "txd-spin 0.8s linear infinite" }}><IcnLoader /></span> : null}
              {isRideSearching ? "Buscando motorista..." : "Solicitar " + (serviceOptions.find(s => s.id === selectedVehicle)?.name || "corrida")}
            </button>
          )}

          <SOSSection />
        </div>
      </main>

      {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
      <AddressModal open={showAddressModal} onClose={() => setShowAddressModal(false)} addressType="home" userId={user?.id || ""} onSaved={() => {}} />
      <KYCAlertModal open={showKYCAlert} onClose={() => setShowKYCAlert(false)} onVerify={() => { setShowKYCAlert(false); startTransition(() => router.push("/profile/verify")); }} />
      <DepositModal open={showDepositModal} onClose={() => setShowDepositModal(false)} userId={user?.id || ""} />
      <RatingModal open={showRating} onClose={() => setShowRating(false)} rideId={currentRideId || ""} onSubmit={handleRatingSubmit} />
      {showSOS && <SOSSection />}
    </div>
  );
}

function SOSSection() {
  const [expanded, setExpanded] = useState(false);
  if (!expanded) return (
    <button type="button" onClick={() => setExpanded(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition min-h-[44px]" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }} aria-label="Abrir opcoes de seguranca">
      <span className="w-4 h-4"><IcnAlert /></span>Seguranca
    </button>
  );
  return (
    <div className="p-4 rounded-2xl space-y-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", animation: "txd-fadeIn 0.2s ease-out" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Opcoes de Seguranca</h3>
        <button type="button" onClick={() => setExpanded(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }} aria-label="Fechar"><span className="w-3.5 h-3.5 text-gray-400"><IcnX /></span></button>
      </div>
      <button type="button" className="w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm min-h-[44px]" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }} aria-label="SOS emergencia"><span className="w-5 h-5"><IcnAlert /></span>SOS - Emergencia</button>
      <p className="text-xs text-gray-500 text-center">Compartilhe sua localizacao em tempo real com contatos de emergencia.</p>
    </div>
  );
}

function DashboardEntry() {
  const [state, setState] = useState<"loading" | "passenger" | "company" | "redirect">("loading");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await checkUserProfile();
      if (result.redirect) { setRedirectUrl(result.redirect); setState("redirect"); return; }
      setState(result.role === "company" ? "company" : "passenger");
    })();
  }, []);

  if (state === "loading") return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0D14" }}>
      <span className="w-8 h-8" style={{ animation: "txd-spin 0.8s linear infinite", color: "#3ECB8E" }}><IcnLoader /></span>
    </div>
  );

  if (state === "redirect") return <DashboardRedirect url={redirectUrl || "/auth/login"} />;

  if (state === "company") return <CompanyDashboard />;
  return <PassengerDashboard />;
}

function DashboardRedirect({ url }: { url: string }) {
  const router = useRouter();
  useEffect(() => { startTransition(() => router.push(url)); }, [router, url]);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0D14" }}>
      <span className="w-8 h-8" style={{ animation: "txd-spin 0.8s linear infinite", color: "#3ECB8E" }}><IcnLoader /></span>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Toast />
      <DashboardEntry />
    </>
  );
}
