import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const handler = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "50");
    const serviceType = searchParams.get("service_type") || "carro";
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabase = await createClient();
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();

    const { data: heartbeats } = await supabase
      .from("driver_heartbeats")
      .select("driver_id, lat, lng, heading, speed, status")
      .neq("status", "OFFLINE")
      .gte("last_updated_at", thirtySecondsAgo)
      .limit(100);

    if (!heartbeats || heartbeats.length === 0) {
      return NextResponse.json({ drivers: [], count: 0 });
    }

    const driverIds = heartbeats.map((h: any) => h.driver_id);

    const [profilesResult, pricingResult] = await Promise.all([
      supabase
        .from("driver_profiles")
        .select("id, rating, total_trips")
        .in("id", driverIds),
      supabase
        .from("driver_pricing")
        .select("driver_id, min_price_per_km, suggested_price_per_km, min_trip_value")
        .eq("service_type", serviceType)
        .eq("is_active", true)
        .in("driver_id", driverIds),
    ]);

    const profileMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p]));
    const pricingMap = new Map((pricingResult.data || []).map((p: any) => [p.driver_id, p]));

    const enriched = heartbeats
      .map((h: any) => {
        const dist = lat && lng ? haversineDistance(lat, lng, h.lat, h.lng) : 0;
        return {
          driverId: h.driver_id,
          lat: h.lat,
          lng: h.lng,
          heading: h.heading || 0,
          speed: h.speed || 0,
          distanceKm: Math.round(dist * 10) / 10,
          rating: profileMap.get(h.driver_id)?.rating || 5.0,
          totalTrips: profileMap.get(h.driver_id)?.total_trips || 0,
          pricing: pricingMap.get(h.driver_id) || null,
        };
      })
      .filter((d) => d.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return NextResponse.json({
      drivers: enriched,
      count: enriched.length,
      serviceType,
      radius,
    });
  } catch (err: any) {
    return NextResponse.json({ drivers: [], count: 0, error: err.message });
  }
};

export const GET = withRateLimit(handler, "nearby");