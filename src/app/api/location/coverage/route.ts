import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const lat = parseFloat(req.nextUrl.searchParams.get("lat") || "0");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") || "0");

  if (!lat || !lng) {
    return NextResponse.json({ status: "error", error_message: "lat e lng são obrigatórios" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.rpc("is_point_in_coverage", {
      p_lat: lat,
      p_lng: lng,
    });

    if (!error) {
      return NextResponse.json({ status: "success", data: { in_coverage: !!data } });
    }
  } catch {}

  const { data: areas } = await supabase
    .from("coverage_areas")
    .select("city, state")
    .limit(1);

  return NextResponse.json({
    status: "success",
    data: { in_coverage: true, fallback: true, areas_configured: (areas?.length || 0) > 0 },
  });
}
