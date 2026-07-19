import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const body = await req.json();

    const { error_type, error_message, endpoint, metadata } = body;

    await supabase.from("app_errors").insert({
      profile_id: user?.id || null,
      error_type: error_type || "UNKNOWN",
      error_message: error_message?.slice(0, 500) || "",
      endpoint: endpoint?.slice(0, 200) || null,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ status: "success" });
  } catch {
    return NextResponse.json({ status: "error", error_message: "Erro ao registrar log" }, { status: 500 });
  }
}
