import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return user;
}

export async function GET() {
  const supabase = await createClient();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });

  const { data } = await supabase
    .from("pricing_rules")
    .select("*, cities(name, state)")
    .order("vehicle_category");

  return NextResponse.json({ pricing: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });

  const body = await request.json();
  const { city_id, vehicle_category, base_fare, price_per_unit, price_per_minute, min_fare, platform_fee_percent, surge_multiplier } = body;

  if (!city_id || !vehicle_category || base_fare === undefined) {
    return NextResponse.json({ error: "city_id, vehicle_category e base_fare obrigatórios" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pricing_rules")
    .insert({
      city_id,
      vehicle_category,
      base_fare,
      price_per_unit: price_per_unit || 0,
      price_per_minute: price_per_minute || 0,
      min_fare: min_fare || base_fare,
      platform_fee_percent: platform_fee_percent || 15,
      surge_multiplier: surge_multiplier || 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pricing: data });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });

  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

  const { data, error } = await supabase
    .from("pricing_rules")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pricing: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

  const { error } = await supabase.from("pricing_rules").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
