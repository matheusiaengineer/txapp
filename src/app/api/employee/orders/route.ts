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

    const { data: employee } = await supabase
      .from("employee_profiles")
      .select("*, companies(*)")
      .eq("id", user.id)
      .single();

    if (!employee) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status");

      let query = supabase
        .from("loads")
        .select("*")
        .eq("customer_id", employee.company_id)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data: orders } = await query;

      const mapped = (orders || []).map((o: any) => ({
        id: o.id,
        title: o.description || o.origin_address?.split(",")[0] || "Pedido",
        origin: o.origin_address,
        destination: o.dest_address,
        status: o.status,
        amount: o.budget_min || o.budget_max || 0,
        createdAt: o.created_at,
        pickupDate: o.pickup_date,
        deliveryDate: o.delivery_date,
      }));

      return NextResponse.json(mapped);
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { origin_address, dest_address, description, weight_kg, vehicle_type, pickup_date, budget_min, budget_max } = body;

      if (!origin_address || !dest_address) {
        return NextResponse.json({ error: "origin_address e dest_address são obrigatórios" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("loads")
        .insert({
          customer_id: employee.company_id,
          origin_address,
          dest_address,
          description: description || "",
          weight_kg: weight_kg || null,
          vehicle_type: vehicle_type || "carro",
          pickup_date: pickup_date || null,
          budget_min: budget_min || null,
          budget_max: budget_max || null,
          status: "open",
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
