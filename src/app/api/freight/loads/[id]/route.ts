import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const handler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const supabase = await createClient();
  const { data: load, error } = await supabase
    .from("loads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !load) {
    return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ load });
};

export const GET = withRateLimit(handler, 'default');
