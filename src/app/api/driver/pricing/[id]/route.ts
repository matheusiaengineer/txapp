import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const handler = async (req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = params instanceof Promise ? await params : params;

    if (req.method === "PUT") {
      const body = await req.json();
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };

      if (body.min_price_per_km !== undefined) updates.min_price_per_km = body.min_price_per_km;
      if (body.suggested_price_per_km !== undefined) updates.suggested_price_per_km = body.suggested_price_per_km;
      if (body.min_trip_value !== undefined) updates.min_trip_value = body.min_trip_value;
      if (body.is_active !== undefined) updates.is_active = body.is_active;

      if (updates.min_price_per_km !== undefined && updates.min_price_per_km < 25) {
        return NextResponse.json({ error: "Preço mínimo por km deve ser no mínimo R$ 25,00" }, { status: 400 });
      }

      if (updates.suggested_price_per_km !== undefined && updates.min_price_per_km !== undefined && updates.suggested_price_per_km < updates.min_price_per_km) {
        return NextResponse.json({ error: "Preço sugerido não pode ser menor que o mínimo" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("driver_pricing")
        .update(updates)
        .eq("id", id)
        .eq("driver_id", user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    if (req.method === "DELETE") {
      const { error } = await supabase
        .from("driver_pricing")
        .delete()
        .eq("id", id)
        .eq("driver_id", user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
};

export const PUT = withRateLimit(handler, "default");
export const DELETE = withRateLimit(handler, "default");