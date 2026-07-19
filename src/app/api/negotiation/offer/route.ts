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
    const {
      driver_id, service_type, origin_lat, origin_lng,
      dest_lat, dest_lng, distance_km, requested_price, message,
    } = body;

    if (!driver_id || !service_type || !origin_lat || !origin_lng || !dest_lat || !dest_lng) {
      return NextResponse.json({ error: "driver_id, service_type, origem e destino obrigatórios" }, { status: 400 });
    }

    if (!requested_price || requested_price <= 0) {
      return NextResponse.json({ error: "Preço ofertado inválido" }, { status: 400 });
    }

    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("negotiations")
      .insert({
        driver_id,
        passenger_id: user.id,
        service_type,
        origin_lat,
        origin_lng,
        dest_lat,
        dest_lng,
        distance_km: distance_km || null,
        requested_price,
        passenger_message: message || null,
        status: "pending",
        expires_at: fiveMinutesFromNow,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao criar oferta" }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, "default");