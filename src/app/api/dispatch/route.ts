import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const VEHICLE_CATEGORY_MAP: Record<string, string[]> = {
  moto: ["moto", "mototaxi", "motoboy"],
  carro: ["carro"],
  van: ["van", "entregas"],
  truck: ["truck", "caminhao", "fretes", "carga"],
};

const VEHICLE_TO_CATEGORY_ID: Record<string, string> = {
  moto: "moto",
  carro: "car",
  van: "van",
  truck: "truck",
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreDriver(driver: any, originLat: number, originLng: number): number {
  const dist = haversineDistance(originLat, originLng, driver.lat, driver.lng);
  const distScore = Math.max(0, 100 - dist * 10);
  const ratingScore = (driver.rating || 5.0) * 10;
  const acceptanceScore = (driver.acceptance_rate || 100) * 0.3;
  const tripScore = Math.min(50, (driver.total_trips || 0) * 0.5);
  return distScore + ratingScore + acceptanceScore + tripScore;
}

const handler = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      origin_lat, origin_lng, origin_address,
      dest_lat, dest_lng, dest_address,
      vehicle_type = "carro",
      estimated_distance_km, estimated_duration_min, estimated_fare,
    } = body;

    if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
      return NextResponse.json({ error: "Origem e destino obrigatórios" }, { status: 400 });
    }

    const dist = estimated_distance_km || haversineDistance(origin_lat, origin_lng, dest_lat, dest_lng);
    const dur = estimated_duration_min || Math.round(dist * 2);

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        passenger_id: user.id,
        vehicle_category_id: VEHICLE_TO_CATEGORY_ID[vehicle_type] || "car",
        origin_lat, origin_lng, origin_address: origin_address || "Origem",
        dest_lat, dest_lng, dest_address: dest_address || "Destino",
        estimated_distance_km: dist,
        estimated_duration_min: dur,
        estimated_fare: estimated_fare || Math.round(dist * 2.5 * 100) / 100,
        metadata: body.metadata || {},
      })
      .select("id, estimated_fare, estimated_distance_km, estimated_duration_min")
      .single();

    if (tripError) {
      return NextResponse.json({ error: tripError.message }, { status: 500 });
    }

    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    const { data: heartbeats } = await supabase
      .from("driver_heartbeats")
      .select("driver_id, lat, lng, heading, speed, status, last_updated_at")
      .neq("status", "OFFLINE")
      .gte("last_updated_at", thirtySecondsAgo);

    let candidates: any[] = [];

    if (heartbeats && heartbeats.length > 0) {
      const driverIds = heartbeats.map((h: any) => h.driver_id);
      const { data: profiles } = await supabase
        .from("driver_profiles")
        .select("id, modalities, rating, acceptance_rate, total_trips")
        .in("id", driverIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const allowedModalities = VEHICLE_CATEGORY_MAP[vehicle_type] || [vehicle_type];

      candidates = heartbeats
        .map((h: any) => {
          const p = profileMap.get(h.driver_id);
          if (!p) return null;
          const modalities: string[] = p.modalities || [];
          const matchesModality = modalities.length === 0 || modalities.some((m: string) => allowedModalities.includes(m));
          if (!matchesModality) return null;
          return {
            driverId: h.driver_id,
            lat: h.lat,
            lng: h.lng,
            heading: h.heading || 0,
            speed: h.speed || 0,
            rating: p.rating || 5.0,
            acceptance_rate: p.acceptance_rate || 100,
            total_trips: p.total_trips || 0,
          };
        })
        .filter(Boolean) as any[];
    }

    const scored = candidates
      .map((d: any) => ({
        ...d,
        score: scoreDriver(d, origin_lat, origin_lng),
        distanceKm: haversineDistance(origin_lat, origin_lng, d.lat, d.lng),
      }))
      .filter((d: any) => d.distanceKm <= 20)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5);

    const offerExpiresAt = new Date(Date.now() + 15000).toISOString();
    const offers = scored.map((d: any) => ({
      trip_id: trip.id,
      driver_id: d.driverId,
      status: "PENDING",
      score_calculated: Math.round(d.score * 100) / 100,
      expires_at: offerExpiresAt,
    }));

    if (offers.length > 0) {
      await supabase.from("trip_offers").insert(offers);
    }

    return NextResponse.json({
      tripId: trip.id,
      estimatedFare: trip.estimated_fare,
      estimatedDistance: trip.estimated_distance_km,
      estimatedDuration: trip.estimated_duration_min,
      matchedDrivers: scored.map((d: any) => ({
        driverId: d.driverId,
        distanceKm: Math.round(d.distanceKm * 10) / 10,
        rating: d.rating,
        score: d.score,
      })),
      totalCandidates: candidates.length,
      offersCreated: offers.length,
      expiresAt: offerExpiresAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no dispatch" }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'dispatch');
