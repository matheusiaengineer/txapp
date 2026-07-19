import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const handler = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });

    const body = await request.json();
    const { driverId, action, reason } = body;

    if (!driverId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "driverId e action (approve|reject) obrigatórios" }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    const { error } = await supabase
      .from("driver_profiles")
      .update({ status: newStatus })
      .eq("id", driverId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (reason) {
      await supabase.from("notifications").insert({
        user_id: driverId,
        type: "verification",
        title: action === "approve" ? "Documentos aprovados" : "Documentos rejeitados",
        message: reason || (action === "approve"
          ? "Seus documentos foram aprovados! Você já pode começar a dirigir."
          : "Seus documentos foram rejeitados. Envie novamente."),
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao processar verificação" }, { status: 500 });
  }
};

export const PATCH = withRateLimit(handler, "default");

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "pending";
  const search = url.searchParams.get("search") || "";

  let query = supabase
    .from("driver_profiles")
    .select("id, cpf, status, created_at, address, city, state")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`cpf.ilike.%${search}%,id.ilike.%${search}%`);
  }

  const { data: drivers } = await query.limit(50);

  const enriched = await Promise.all((drivers || []).map(async (d: any) => {
    const { data: p } = await supabase.from("profiles").select("full_name, email, phone").eq("id", d.id).single();
    const { data: docs } = await supabase.from("documents").select("*").eq("profile_id", d.id);
    return {
      id: d.id,
      name: p?.full_name || "Desconhecido",
      email: p?.email,
      phone: p?.phone,
      cpf: d.cpf,
      status: d.status,
      city: d.city,
      state: d.state,
      createdAt: d.created_at,
      documents: docs || [],
    };
  }));

  return NextResponse.json({ drivers: enriched, total: enriched.length });
}
