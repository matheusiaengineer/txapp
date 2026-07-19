import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const postHandler = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();

    const { data: load, error } = await supabase
      .from("loads")
      .insert({
        customer_id: user.id,
        origin_address: body.origin_address,
        origin_lat: body.origin_lat || null,
        origin_lng: body.origin_lng || null,
        dest_address: body.dest_address,
        dest_lat: body.dest_lat || null,
        dest_lng: body.dest_lng || null,
        description: body.description,
        weight_kg: body.weight_kg || null,
        volume_m3: body.volume_m3 || null,
        vehicle_type: body.vehicle_type || "carro",
        photos: body.photos || [],
        pickup_date: body.pickup_date || null,
        delivery_date: body.delivery_date || null,
        budget_min: body.budget_min || null,
        budget_max: body.budget_max || null,
        customer_name: body.customer_name || user.email || "Cliente",
        customer_phone: body.customer_phone || "",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ load });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao criar carga" }, { status: 500 });
  }
};

const getHandler = async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const limit = parseInt(searchParams.get("limit") || "20");
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("loads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (customerId) query = query.eq("customer_id", customerId);

  const { data: loads, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    loads: loads || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
};

export const POST = withRateLimit(postHandler, 'default');
export const GET = withRateLimit(getHandler, 'default');
