"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface TripOffer {
  id: string;
  tripId: string;
  driverId: string;
  status: string;
  scoreCalculated: number;
  expiresAt: string;
  pickup: string;
  destination: string;
  estimatedFare: number;
  distance: string;
  estimatedTime: string;
  passengerName: string;
  passengerRating: number;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

export function useTripOffers(driverId: string | undefined, online: boolean) {
  const [offer, setOffer] = useState<TripOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const fetchOfferDetails = useCallback(async (offerId: string, tripId: string, driverIdVal: string): Promise<TripOffer | null> => {
    try {
      const { data: offerData } = await supabase
        .from("trip_offers")
        .select("id, trip_id, driver_id, status, score_calculated, expires_at")
        .eq("id", offerId)
        .single();

      if (!offerData || offerData.status !== "PENDING") return null;

      const { data: tripData } = await supabase
        .from("trips")
        .select("id, passenger_id, origin_address, dest_address, estimated_fare, estimated_distance_km, estimated_duration_min, origin_lat, origin_lng, dest_lat, dest_lng")
        .eq("id", tripId)
        .single();

      if (!tripData) return null;

      let passengerName = "Passageiro";
      let passengerRating = 5.0;
      if (tripData.passenger_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", tripData.passenger_id)
          .single();
        if (profile) passengerName = profile.full_name;
      }

      return {
        id: offerData.id,
        tripId: offerData.trip_id,
        driverId: offerData.driver_id,
        status: offerData.status,
        scoreCalculated: offerData.score_calculated || 0,
        expiresAt: offerData.expires_at,
        pickup: tripData.origin_address,
        destination: tripData.dest_address,
        estimatedFare: tripData.estimated_fare,
        distance: `${tripData.estimated_distance_km?.toFixed(1) || "?"} km`,
        estimatedTime: `${tripData.estimated_duration_min || "?"} min`,
        passengerName,
        passengerRating,
        originLat: tripData.origin_lat,
        originLng: tripData.origin_lng,
        destLat: tripData.dest_lat,
        destLng: tripData.dest_lng,
      };
    } catch {
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    if (!driverId || !online) {
      setOffer(null);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    setLoading(true);

    channelRef.current = supabase
      .channel(`driver-offers-${driverId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "trip_offers",
        filter: `driver_id=eq.${driverId}`,
      }, async (payload) => {
        const newOffer = payload.new as any;
        if (newOffer.status !== "PENDING") return;
        const details = await fetchOfferDetails(newOffer.id, newOffer.trip_id, driverId);
        if (details) {
          setOffer(details);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setLoading(false);
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [driverId, online, supabase, fetchOfferDetails]);

  const acceptOffer = useCallback(async () => {
    if (!offer) return false;
    try {
      const res = await fetch("/api/dispatch/offer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_id: offer.id, action: "accept" }),
      });
      const data = await res.json();
      if (data.success) {
        setOffer(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [offer]);

  const rejectOffer = useCallback(async () => {
    if (!offer) return;
    try {
      await fetch("/api/dispatch/offer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_id: offer.id, action: "reject" }),
      });
    } catch {}
    setOffer(null);
  }, [offer]);

  return { offer, loading, acceptOffer, rejectOffer };
}
