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
      const updates: Record<string, any> = {};
      if (body.origin_address !== undefined) updates.origin_address = body.origin_address;
      if (body.dest_address !== undefined) updates.dest_address = body.dest_address;
      if (body.description !== undefined) updates.description = body.description;
      if (body.weight_kg !== undefined) updates.weight_kg = body.weight_kg;
      if (body.vehicle_type !== undefined) updates.vehicle_type = body.vehicle_type;
      if (body.pickup_date !== undefined) updates.pickup_date = body.pickup_date;
      if (body.budget_min !== undefined) updates.budget_min = body.budget_min;
      if (body.budget_max !== undefined) updates.budget_max = body.budget_max;
      if (body.status !== undefined) updates.status = body.status;

      const { data, error } = await supabase
        .from("loads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    if (req.method === "DELETE") {
      const { error } = await supabase
        .from("loads")
        .delete()
        .eq("id", id);

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
