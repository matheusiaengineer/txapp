import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const cutoff = new Date(Date.now() - 30000).toISOString();
    const { error } = await supabase
      .from("driver_heartbeats")
      .delete()
      .eq("status", "OFFLINE")
      .lt("last_updated_at", cutoff);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { count: remaining } = await supabase
      .from("driver_heartbeats")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      ok: true,
      remaining: remaining || 0,
      cutoff,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
