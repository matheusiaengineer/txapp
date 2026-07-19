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
        .from("company_clients")
        .select("*")
        .eq("company_id", company.id)
        .order("total_spent", { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data: clients } = await query;
      return NextResponse.json(clients || []);
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { name, phone, email, notes } = body;

      if (!name) {
        return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("company_clients")
        .insert({ company_id: company.id, name, phone, email, notes, tags: body.tags || [] })
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
