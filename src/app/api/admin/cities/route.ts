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

  const { data } = await supabase.from("cities").select("*").order("name");
  return NextResponse.json({ cities: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });

  const body = await request.json();
  const { name, state, country, currency, unit, timezone } = body;

  if (!name || !state) {
    return NextResponse.json({ error: "name e state são obrigatórios" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cities")
    .insert({ name, state, country: country || "BR", currency: currency || "BRL", unit: unit || "km", timezone: timezone || "America/Sao_Paulo" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ city: data });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });

  const body = await request.json();
  const { id, name, state, country, currency, unit, timezone, is_active } = body;

  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

  const { data, error } = await supabase
    .from("cities")
    .update({ name, state, country, currency, unit, timezone, is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ city: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

  const { error } = await supabase.from("cities").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
