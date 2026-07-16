"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

export interface DriverProfile {
  id: string;
  cpf: string;
  status: string;
  current_live_status: string;
  acceptance_rate: number;
  cancellation_rate: number;
  rating: number;
  total_trips: number;
  online_time_hours: number;
}

export interface VehicleRow {
  id: string;
  category: string;
  license_plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
}

export interface TripOfferRow {
  id: string;
  trip_id: string;
  status: string;
  score_calculated: number;
  created_at: string;
  expires_at: string;
}

export function useDriverData(userId: string | undefined) {
  const supabase = createClient();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [vehicle, setVehicle] = useState<VehicleRow | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    Promise.all([
      supabase.from("driver_profiles").select("*").eq("id", userId).single(),
      supabase.from("vehicles").select("*").eq("driver_id", userId).limit(1),
      supabase.from("trips").select("*").eq("driver_id", userId).order("created_at", { ascending: false }).limit(10),
    ]).then(([profRes, vehRes, tripsRes]) => {
      if (profRes.data) setProfile(profRes.data as DriverProfile);
      if (vehRes.data && vehRes.data.length > 0) setVehicle(vehRes.data[0] as VehicleRow);
      if (tripsRes.data) {
        setTrips(tripsRes.data);
        const completed = tripsRes.data.filter((t: any) => t.status === "PAYMENT_CONFIRMED" || t.status === "COMPLETED");
        const now = new Date();
        const today = completed.filter((t: any) => new Date(t.created_at).toDateString() === now.toDateString());
        const week = completed.filter((t: any) => {
          const d = new Date(t.created_at);
          const diff = now.getTime() - d.getTime();
          return diff < 7 * 24 * 60 * 60 * 1000;
        });
        setEarnings({
          today: today.reduce((acc: number, t: any) => acc + (t.final_fare || t.estimated_fare || 0), 0),
          week: week.reduce((acc: number, t: any) => acc + (t.final_fare || t.estimated_fare || 0), 0),
          month: completed.reduce((acc: number, t: any) => acc + (t.final_fare || t.estimated_fare || 0), 0),
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  return { profile, vehicle, trips, earnings, loading };
}
