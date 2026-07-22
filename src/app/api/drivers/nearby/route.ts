import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get("lat") || "0")
    const lng = parseFloat(searchParams.get("lng") || "0")
    const radius = parseFloat(searchParams.get("radius") || "5")
    const vehicleType = searchParams.get("vehicleType")

    if (!lat || !lng) {
      return NextResponse.json({ error: "Latitude e longitude obrigatorios" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc("nearby_drivers", {
      user_lat: lat,
      user_lng: lng,
      search_radius: radius * 1000,
      v_type: vehicleType || null,
    })

    if (error) {
      const { data: fallback, error: fallbackError } = await supabase
        .from("driver_profiles")
        .select("id, profiles!inner(full_name, lat, lng, rating, is_online), vehicle_type, price_per_km")
        .eq("status", "approved")
        .limit(20)

      if (fallbackError) throw fallbackError

      const drivers = (fallback || []).map((d: any) => ({
        id: d.id,
        name: d.profiles?.full_name || "Motorista",
        lat: d.profiles?.lat || lat,
        lng: d.profiles?.lng || lng,
        vehicleType: d.vehicle_type || "carro",
        rating: d.profiles?.rating || 4.5,
        pricePerKm: d.price_per_km || 3.00,
        isOnline: d.profiles?.is_online || false,
      }))

      return NextResponse.json({ success: true, drivers, count: drivers.length })
    }

    return NextResponse.json({ success: true, drivers: data || [], count: data?.length || 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
