"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/browser";

export interface ActiveTrip {
  id: string;
  passengerId: string;
  status: string;
  originLat: number;
  originLng: number;
  originAddress: string;
  destLat: number;
  destLng: number;
  destAddress: string;
  estimatedFare: number;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  passengerName: string;
  passengerRating: number;
  createdAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
}

const ACTIVE_STATUSES = [
  "DRIVER_ACCEPTED",
  "GOING_TO_PICKUP",
  "ARRIVED",
  "PASSENGER_ON_BOARD",
  "IN_PROGRESS",
  "FINISHING",
];

export function useActiveTrip(driverId: string | undefined) {
  const [trip, setTrip] = useState<ActiveTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchActiveTrip = useCallback(async () => {
    if (!driverId) {
      setTrip(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("driver_id", driverId)
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      let passengerName = "Passageiro";
      let passengerRating = 5.0;
      if (data.passenger_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, rating")
          .eq("id", data.passenger_id)
          .single();
        if (profile) {
          passengerName = profile.full_name;
          passengerRating = profile.rating || 5.0;
        }
      }
      setTrip({
        id: data.id,
        passengerId: data.passenger_id,
        status: data.status,
        originLat: data.origin_lat,
        originLng: data.origin_lng,
        originAddress: data.origin_address,
        destLat: data.dest_lat,
        destLng: data.dest_lng,
        destAddress: data.dest_address,
        estimatedFare: data.estimated_fare,
        estimatedDistanceKm: data.estimated_distance_km,
        estimatedDurationMin: data.estimated_duration_min,
        passengerName,
        passengerRating,
        createdAt: data.created_at,
        acceptedAt: data.accepted_at,
        startedAt: data.started_at,
      });
    } else {
      setTrip(null);
    }
    setLoading(false);
  }, [driverId, supabase]);

  useEffect(() => {
    fetchActiveTrip();

    if (!driverId) return;

    const channel = supabase
      .channel(`active-trip-${driverId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "trips",
        filter: `driver_id=eq.${driverId}`,
      }, (payload) => {
        const newRow = payload.new as any;
        if (!newRow || !ACTIVE_STATUSES.includes(newRow.status)) {
          setTrip(null);
          return;
        }
        fetchActiveTrip();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, supabase, fetchActiveTrip]);

  const updateStatus = useCallback(async (newStatus: string): Promise<boolean> => {
    if (!trip) return false;
    try {
      const res = await fetch("/api/trip/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: trip.id, newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTrip(prev => prev ? { ...prev, status: newStatus } : null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [trip]);

  return { trip, loading, updateStatus, refetch: fetchActiveTrip };
}
