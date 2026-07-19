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
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      return NextResponse.json(campaigns || []);
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { name, segment, channel, template, coupon_code, scheduled_at } = body;

      if (!name || !segment || !channel || !template) {
        return NextResponse.json({ error: "name, segment, channel e template são obrigatórios" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          company_id: company.id,
          name,
          segment,
          channel,
          template,
          coupon_code,
          scheduled_at: scheduled_at || null,
          stats: {},
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
