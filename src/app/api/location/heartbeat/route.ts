import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const handler = async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { driverId, lat, lng, heading, speed, accuracy, batteryLevel, status, modalities } = body;

    if (!driverId || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: "driverId, lat e lng são obrigatórios" }, { status: 400 });
    }

    if (driverId !== user.id) {
      return NextResponse.json({ error: "driverId não corresponde ao usuário autenticado" }, { status: 403 });
    }

    const { error } = await supabase.from("driver_heartbeats").upsert({
      driver_id: driverId,
      lat,
      lng,
      heading: heading ?? 0,
      speed: speed ?? 0,
      accuracy: accuracy ?? 0,
      battery_level: batteryLevel ?? null,
      status: status === "OFFLINE" ? "OFFLINE" : "ONLINE",
      last_updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'heartbeat');
