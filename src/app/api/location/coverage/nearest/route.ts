import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const lat = parseFloat(req.nextUrl.searchParams.get("lat") || "0");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") || "0");

  if (!lat || !lng) {
    return NextResponse.json({ status: "error", error_message: "lat e lng obrigatórios" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.rpc("find_nearest_city", {
      p_lat: lat,
      p_lng: lng,
    });

    if (!error && data) {
      return NextResponse.json({ status: "success", data: { city: data } });
    }
  } catch {}

  return NextResponse.json({ status: "success", data: { city: null } });
}
