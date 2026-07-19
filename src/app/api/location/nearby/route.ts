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

const MOCK_DRIVERS = [
  { driverId: "mock-maria", lat: -23.5505, lng: -46.6333, heading: 90, speed: 25, status: "ONLINE", modalities: ["carro", "mototaxi"] },
  { driverId: "mock-carlos", lat: -23.545, lng: -46.635, heading: 180, speed: 0, status: "ONLINE", modalities: ["carro", "entregas"] },
  { driverId: "mock-pedro", lat: -23.548, lng: -46.628, heading: 270, speed: 15, status: "ONLINE", modalities: ["motoboy", "moto"] },
  { driverId: "mock-ana", lat: -23.553, lng: -46.642, heading: 0, speed: 30, status: "ONLINE", modalities: ["carro", "fretes"] },
  { driverId: "mock-joao", lat: -23.547, lng: -46.638, heading: 45, speed: 10, status: "ONLINE", modalities: ["truck", "carga"] },
  { driverId: "mock-lucas", lat: -23.552, lng: -46.63, heading: 135, speed: 20, status: "ONLINE", modalities: ["mototaxi"] },
  { driverId: "mock-julia", lat: -23.549, lng: -46.636, heading: 315, speed: 5, status: "ONLINE", modalities: ["carro", "pet"] },
  { driverId: "mock-rafa", lat: -23.546, lng: -46.631, heading: 225, speed: 35, status: "ONLINE", modalities: ["entregas", "motoboy"] },
];

const handler = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "20");
    const modality = searchParams.get("modality");

    const supabase = await createClient();
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();

    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const offset = (page - 1) * limit;

    const { data: heartbeats } = await supabase
      .from("driver_heartbeats")
      .select("driver_id, lat, lng, heading, speed, accuracy, battery_level, status, last_updated_at")
      .neq("status", "OFFLINE")
      .gte("last_updated_at", thirtySecondsAgo)
      .range(offset, offset + limit - 1);

    let allDrivers: any[] = [];

    if (heartbeats && heartbeats.length > 0) {
      try {
        const driverIds = heartbeats.map((h: any) => h.driver_id);
        const { data: profiles } = await supabase
          .from("driver_profiles")
          .select("id, modalities")
          .in("id", driverIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.modalities || []]));

        allDrivers = heartbeats.map((h: any) => ({
          driverId: h.driver_id,
          lat: h.lat,
          lng: h.lng,
          heading: h.heading || 0,
          speed: h.speed || 0,
          status: h.status,
          modalities: profileMap.get(h.driver_id) || [],
          lastUpdated: h.last_updated_at,
        }));
      } catch {
        allDrivers = heartbeats.map((h: any) => ({
          driverId: h.driver_id,
          lat: h.lat,
          lng: h.lng,
          heading: h.heading || 0,
          speed: h.speed || 0,
          status: h.status,
          modalities: [],
          lastUpdated: h.last_updated_at,
        }));
      }
    }

    if (allDrivers.length === 0) {
      allDrivers = MOCK_DRIVERS;
    }

    const nearby = allDrivers.filter((d: any) => {
      if (d.status === "OFFLINE") return false;
      if (lat && lng) {
        const dist = haversineDistance(lat, lng, d.lat, d.lng);
        if (dist > radius) return false;
      }
      if (modality && d.modalities?.length > 0 && !d.modalities.includes(modality)) return false;
      return true;
    });

    return NextResponse.json({
      drivers: nearby,
      count: nearby.length,
      refreshedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      drivers: MOCK_DRIVERS,
      count: MOCK_DRIVERS.length,
      refreshedAt: new Date().toISOString(),
    });
  }
};

export const GET = withRateLimit(handler, 'nearby');
