import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Apenas admin pode executar seed" }, { status: 403 })
    }

    const vehicleCategories = [
      { name: "car", display_name: "Carro", max_passengers: 4, icon_url: null },
      { name: "moto", display_name: "Moto", max_passengers: 1, icon_url: null },
      { name: "van", display_name: "Van", max_passengers: 8, icon_url: null },
      { name: "truck", display_name: "Caminhão", max_passengers: 1, max_load_weight_kg: 5000, icon_url: null },
      { name: "fiorino", display_name: "Fiorino", max_passengers: 2, max_load_weight_kg: 800, icon_url: null },
    ]

    const { data: existing } = await supabase.from("vehicle_categories").select("name")
    const existingNames = new Set((existing || []).map((c: any) => c.name))
    const toInsert = vehicleCategories.filter(c => !existingNames.has(c.name))

    if (toInsert.length === 0) {
      return NextResponse.json({ message: "Vehicle categories already seeded", count: existing?.length || 0 })
    }

    const { data, error } = await supabase.from("vehicle_categories").insert(toInsert).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const cities = [
      { name: "São Paulo", state: "SP", country: "BR" },
      { name: "Rio de Janeiro", state: "RJ", country: "BR" },
      { name: "Belo Horizonte", state: "MG", country: "BR" },
      { name: "Curitiba", state: "PR", country: "BR" },
      { name: "Salvador", state: "BA", country: "BR" },
    ]

    const { data: existingCities } = await supabase.from("cities").select("name")
    const existingCityNames = new Set((existingCities || []).map((c: any) => c.name))
    const citiesToInsert = cities.filter(c => !existingCityNames.has(c.name))

    let insertedCities: any[] = []
    if (citiesToInsert.length > 0) {
      const { data: cData } = await supabase.from("cities").insert(citiesToInsert).select()
      insertedCities = cData || []
    }

    return NextResponse.json({
      vehicleCategories: data?.length || 0,
      cities: insertedCities.length,
      total: {
        vehicleCategories: (existing?.length || 0) + (data?.length || 0),
        cities: (existingCities?.length || 0) + insertedCities.length,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
