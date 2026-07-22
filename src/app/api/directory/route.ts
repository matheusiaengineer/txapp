import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get("lat") || "0")
  const lng = parseFloat(searchParams.get("lng") || "0")
  const radiusKm = parseFloat(searchParams.get("radius") || "10")
  const profession = searchParams.get("profession")
  const type = searchParams.get("type") || "all"

  const supabase = await createClient()

  let companies: any[] = []
  let professionals: any[] = []

  if (type === "all" || type === "companies") {
    if (lat && lng) {
      const { data } = await supabase.rpc("nearby_companies", {
        p_lat: lat,
        p_lng: lng,
        p_radius_km: radiusKm,
      })
      companies = (data as any) || []
    } else {
      const { data } = await supabase.from("companies").select("*").limit(50)
      companies = data || []
    }
  }

  if (type === "all" || type === "professionals") {
    if (lat && lng) {
      const { data } = await supabase.rpc("nearby_professionals", {
        p_lat: lat,
        p_lng: lng,
        p_radius_km: radiusKm,
        p_profession: profession || null,
      })
      professionals = (data as any) || []
    } else {
      let query = supabase.from("professional_directory").select("*, profiles!inner(full_name, avatar_url)").eq("is_available", true)
      if (profession) query = query.eq("profession", profession)
      const { data } = await query.limit(50)
      professionals = data || []
    }
  }

  return NextResponse.json({ companies, professionals })
}
