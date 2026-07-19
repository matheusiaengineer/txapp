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

    if (req.method === "GET") {
      const { data: pricing } = await supabase
        .from("driver_pricing")
        .select("*")
        .eq("driver_id", user.id)
        .order("service_type");

      return NextResponse.json(pricing || []);
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { service_type, min_price_per_km, suggested_price_per_km, min_trip_value } = body;

      if (!service_type || !min_price_per_km || !suggested_price_per_km) {
        return NextResponse.json({ error: "service_type, min_price_per_km e suggested_price_per_km obrigatórios" }, { status: 400 });
      }

      if (min_price_per_km < 25) {
        return NextResponse.json({ error: "Preço mínimo por km deve ser no mínimo R$ 25,00" }, { status: 400 });
      }

      if (suggested_price_per_km < min_price_per_km) {
        return NextResponse.json({ error: "Preço sugerido não pode ser menor que o mínimo" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("driver_pricing")
        .upsert({
          driver_id: user.id,
          service_type,
          min_price_per_km,
          suggested_price_per_km,
          min_trip_value: min_trip_value || 0,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "driver_id, service_type",
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
};

export const GET = withRateLimit(handler, "default");
export const POST = withRateLimit(handler, "default");