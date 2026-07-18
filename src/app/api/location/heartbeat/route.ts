import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rl = await rateLimit(`heartbeat:${ip}`, 15, 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Muitas requisições. Aguarde." }, { status: 429, headers: { "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": String(rl.resetAt) } });
  }

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
}
