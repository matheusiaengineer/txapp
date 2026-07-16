"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

export interface TripRow {
  id: string;
  origin_address: string;
  dest_address: string;
  status: string;
  estimated_fare: number;
  created_at: string;
  driver_id?: string;
}

export interface AddressRow {
  id: string;
  type: string;
  full_address: string;
  lat?: number;
  lng?: number;
}

export function usePassengerData(userId: string | undefined) {
  const supabase = createClient();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [stats, setStats] = useState({ total_trips: 0, total_spent: 0, rating: 0, rating_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    Promise.all([
      supabase.from("trips")
        .select("id, origin_address, dest_address, status, estimated_fare, created_at, driver_id")
        .eq("passenger_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase.from("addresses")
        .select("*")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false }),

      supabase.from("ratings")
        .select("score")
        .eq("ratee_id", userId),
    ]).then(([tripsRes, addrRes, ratingsRes]) => {
      if (tripsRes.data) setTrips(tripsRes.data);
      if (addrRes.data) setAddresses(addrRes.data);

      const totalTrips = tripsRes.data?.length || 0;
      const totalSpent = tripsRes.data?.reduce((acc, t) => acc + (t.estimated_fare || 0), 0) || 0;
      const scores = ratingsRes.data?.map(r => r.score) || [];
      const avgRating = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      setStats({
        total_trips: totalTrips,
        total_spent: totalSpent,
        rating: Math.round(avgRating * 10) / 10,
        rating_count: scores.length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  return { trips, addresses, stats, loading };
}
