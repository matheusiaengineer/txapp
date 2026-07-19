import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

function generateCode(): string {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

const postHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const code = generateCode();

    const { error } = await supabase.from("freight_tracking").insert({
      load_id: body.load_id,
      code,
      status: body.status || "pending",
      description: `Carga registrada em ${body.origin || "origem"}`,
      updated_by: user.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ code, url: `/rastreio/${code}` });
  } catch {
    return NextResponse.json({ error: "Erro ao criar rastreamento" }, { status: 500 });
  }
};

const getHandler = async (request: NextRequest) => {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("freight_tracking")
      .select("id, load_id, code, lat, lng, status, description, updated_by, created_at, updated_at")
      .eq("code", code)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const { data: load } = await supabase
      .from("loads")
      .select("origin_address, dest_address")
      .eq("id", data.load_id)
      .single();

    return NextResponse.json({
      id: data.id,
      code: data.code,
      loadId: data.load_id,
      status: data.status,
      origin: load?.origin_address || "",
      destination: load?.dest_address || "",
      currentLocation: data.lat && data.lng ? `${data.lat},${data.lng}` : "",
      events: [{
        status: data.description || "Registrado",
        location: load?.origin_address || "",
        time: new Date(data.created_at).toLocaleString("pt-BR"),
      }],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar rastreamento" }, { status: 500 });
  }
};

export const POST = withRateLimit(postHandler, 'default');
export const GET = withRateLimit(getHandler, 'default');
