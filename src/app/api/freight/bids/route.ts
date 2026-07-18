import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { searchParams } = new URL(request.url);
  const loadId = searchParams.get("load_id");
  const mine = searchParams.get("mine");
  const limit = parseInt(searchParams.get("limit") || "20");
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("bids")
    .select("*, load:loads(description, origin_address, dest_address, vehicle_type)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (loadId) query = query.eq("load_id", loadId);
  if (mine === "true" && user) query = query.eq("transporter_id", user.id);

  const { data: bids, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    bids: bids || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.load_id || !body.amount) {
      return NextResponse.json({ error: "load_id e amount são obrigatórios" }, { status: 400 });
    }

    const { data: bid, error } = await supabase
      .from("bids")
      .insert({
        load_id: body.load_id,
        transporter_id: user.id,
        amount: body.amount,
        message: body.message || "",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bid });
  } catch {
    return NextResponse.json({ error: "Erro ao criar lance" }, { status: 500 });
  }
}