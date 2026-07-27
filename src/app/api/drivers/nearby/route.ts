import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

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
      let query = supabase
        .from("drivers_online")
        .select("driver_id, lat, lng, vehicle_category, status")
        .eq("status", "ONLINE")

      if (vehicleType) {
        query = query.eq("vehicle_category", vehicleType)
      }

      const { data: onlineDrivers, error: onlineErr } = await query

      if (onlineErr || !onlineDrivers || onlineDrivers.length === 0) {
        return NextResponse.json({ success: true, drivers: [], count: 0 })
      }

      const driverIds = onlineDrivers.map((d) => d.driver_id)

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", driverIds)

      const { data: pricing } = await supabase
        .from("driver_pricing")
        .select("driver_id, min_price_per_km, service_type")
        .in("driver_id", driverIds)
        .eq("is_active", true)

      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("driver_id, category")
        .in("driver_id", driverIds)

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]))
      const pricingMap = new Map(
        (pricing || []).map((p) => [`${p.driver_id}_${p.service_type}`, p])
      )
      const vehicleMap = new Map((vehicles || []).map((v) => [v.driver_id, v]))

      const drivers = onlineDrivers
        .map((d) => {
          const R = 6371
          const dLat = ((d.lat - lat) * Math.PI) / 180
          const dLng = ((d.lng - lng) * Math.PI) / 180
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((d.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2)
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

          if (dist > radius) return null

          const p = profileMap.get(d.driver_id)
          const vType = vehicleType || d.vehicle_category || "car"
          const pr = pricingMap.get(`${d.driver_id}_${vType}`) || pricingMap.get(`${d.driver_id}_carro`) || pricingMap.get(`${d.driver_id}_car`)
          const v = vehicleMap.get(d.driver_id)

          return {
            id: d.driver_id,
            name: p?.full_name || "Motorista",
            lat: d.lat,
            lng: d.lng,
            vehicle_type: v?.category || d.vehicle_category || "car",
            rating: 4.5,
            price_per_km: pr?.min_price_per_km || 3.0,
            isOnline: d.status === "ONLINE",
            distance_meters: Math.round(dist * 1000),
          }
        })
        .filter(Boolean)
        .sort((a, b) => a!.distance_meters - b!.distance_meters)

      return NextResponse.json({ success: true, drivers, count: drivers.length })
    }

    return NextResponse.json({ success: true, drivers: data || [], count: data?.length || 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
