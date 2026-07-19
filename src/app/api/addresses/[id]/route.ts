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

      if (body.full_address !== undefined) updates.full_address = body.full_address;
      if (body.type !== undefined) updates.type = body.type;
      if (body.lat !== undefined) updates.lat = body.lat;
      if (body.lng !== undefined) updates.lng = body.lng;

      const { data, error } = await supabase
        .from("addresses")
        .update(updates)
        .eq("id", id)
        .eq("profile_id", user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    if (req.method === "DELETE") {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", id)
        .eq("profile_id", user.id);

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