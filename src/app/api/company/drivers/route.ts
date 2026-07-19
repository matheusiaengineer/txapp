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

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search");

      let query = supabase
        .from("driver_profiles")
        .select("*, profiles!inner(full_name, email, phone), vehicles(*)")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`profiles.full_name.ilike.%${search}%,profiles.email.ilike.%${search}%`);
      }

      const { data: drivers } = await query;

      const mapped = (drivers || []).map((d: any) => ({
        id: d.id,
        name: d.profiles?.full_name || "—",
        email: d.profiles?.email || "—",
        phone: d.profiles?.phone || "—",
        status: d.status,
        rating: d.rating,
        total_trips: d.total_trips,
        acceptance_rate: d.acceptance_rate,
        current_live_status: d.current_live_status,
        vehicle: d.vehicles?.[0] || null,
        created_at: d.created_at,
      }));

      return NextResponse.json(mapped);
    }

    return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
};

export const GET = withRateLimit(handler, "default");
