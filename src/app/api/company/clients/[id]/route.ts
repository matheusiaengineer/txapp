import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const handler = async (req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = params instanceof Promise ? await params : params;

    if (req.method === "PUT") {
      const body = await req.json();
      const updates: Record<string, any> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.phone !== undefined) updates.phone = body.phone;
      if (body.email !== undefined) updates.email = body.email;
      if (body.notes !== undefined) updates.notes = body.notes;
      if (body.tags !== undefined) updates.tags = body.tags;

      const { data, error } = await supabase
        .from("company_clients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    if (req.method === "DELETE") {
      const { error } = await supabase
        .from("company_clients")
        .delete()
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
};

export const PUT = withRateLimit(handler, "default");
export const DELETE = withRateLimit(handler, "default");
