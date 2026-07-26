import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

    const body = await req.json()
    const {
      driver_id,
      from_lat,
      from_lng,
      to_lat,
      to_lng,
      from_address,
      to_address,
      vehicle_type,
      estimated_price,
    } = body

    if (!driver_id || from_lat == null || from_lng == null || to_lat == null || to_lng == null || !from_address || !to_address) {
      return NextResponse.json({ error: "Campos obrigatorios faltando" }, { status: 400 })
    }

    const vehicleName = vehicle_type === "carro" ? "car" : (vehicle_type || "car")
    const { data: vehicleCat, error: catError } = await supabase
      .from("vehicle_categories")
      .select("id")
      .eq("name", vehicleName)
      .single()

    if (catError || !vehicleCat) {
      return NextResponse.json({ error: "Categoria de veiculo nao encontrada" }, { status: 400 })
    }

    const R = 6371
    const dLat = ((to_lat || 0) - (from_lat || 0)) * Math.PI / 180
    const dLon = ((to_lng || 0) - (from_lng || 0)) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((from_lat || 0) * Math.PI / 180) * Math.cos((to_lat || 0) * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const durationMin = Math.round(distanceKm / 30 * 60)

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        passenger_id: user.id,
        driver_id,
        vehicle_category_id: vehicleCat.id,
        origin_lat: from_lat,
        origin_lng: from_lng,
        origin_address: from_address,
        dest_lat: to_lat,
        dest_lng: to_lng,
        dest_address: to_address,
        status: "SEARCHING_DRIVER",
        estimated_distance_km: Math.round(distanceKm * 100) / 100,
        estimated_duration_min: durationMin,
        estimated_fare: estimated_price || 0,
        metadata: { vehicle_type: vehicleName },
      })
      .select()
      .single()

    if (tripError) return NextResponse.json({ error: tripError.message }, { status: 500 })

    await supabase.from("trip_offers").insert({
      trip_id: trip.id,
      driver_id,
      status: "PENDING",
      expires_at: new Date(Date.now() + 30000).toISOString(),
    })

    return NextResponse.json({ success: true, tripId: trip.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
