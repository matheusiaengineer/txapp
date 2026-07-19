import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const roleFilter = url.searchParams.get("role") || "all";
  const statusFilter = url.searchParams.get("status") || "all";
  const page = parseInt(url.searchParams.get("page") || "1");
  const perPage = 10;

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at, country, language", { count: "exact" });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (roleFilter !== "all") {
    query = query.eq("role", roleFilter);
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data: profiles, count, error } = await query.order("created_at", { ascending: false }).range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all((profiles || []).map(async (p: any) => {
    let extra: any = { totalTrips: 0, totalSpent: 0, rating: null, driverStatus: null, documentsCount: 0 };

    if (p.role === "driver") {
      const [dpRes, tripsRes, docsRes] = await Promise.all([
        supabase.from("driver_profiles").select("status, cpf").eq("id", p.id).single(),
        supabase.from("trips").select("estimated_fare", { count: "exact" }).eq("driver_id", p.id),
        supabase.from("documents").select("id", { count: "exact" }).eq("profile_id", p.id),
      ]);
      extra.driverStatus = dpRes.data?.status || "pending";
      extra.totalTrips = tripsRes.count || 0;
      extra.documentsCount = docsRes.count || 0;
    } else {
      const tripsRes = await supabase.from("trips").select("estimated_fare", { count: "exact" }).eq("passenger_id", p.id);
      extra.totalTrips = tripsRes.count || 0;
    }

    return {
      id: p.id,
      name: p.full_name,
      email: p.email,
      phone: p.phone || "—",
      role: p.role,
      language: p.language,
      country: p.country,
      status: extra.driverStatus || (p.role === "passenger" ? "active" : "active"),
      joinDate: new Date(p.created_at).toLocaleDateString("pt-BR"),
      totalTrips: extra.totalTrips,
      documentsCount: extra.documentsCount,
    };
  }));

  return NextResponse.json({
    users: enriched,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / perPage),
  });
}
