"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const TxdMapInner = dynamic(() => import("./txd-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0d12] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface TxdMapProps {
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

export default function TxdMap(props: TxdMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <TxdMapInner {...props} />;
}
