import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Apenas admin pode iniciar seed" }, { status: 403 })
    }

    const { cityName, lat, lng, targetMotoristas = 20, targetComercios = 10 } = await req.json()
    if (!cityName) return NextResponse.json({ error: "cityName obrigatório" }, { status: 400 })

    const { data: existingCities } = await supabase
      .from("cities")
      .insert({ name: cityName, state: "SP", country: "BR" })
      .select()
      .single()

    const cityId = existingCities?.id

    const { data: launch, error } = await supabase
      .from("city_launches")
      .insert({
        city_id: cityId,
        city_name: cityName,
        lat,
        lng,
        status: "seeding",
        target_motoristas: targetMotoristas,
        target_comercios: targetComercios,
        seed_end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        flash_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(launch, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cityId = searchParams.get("cityId")

  const supabase = await createClient()
  let query = supabase.from("city_launches").select("*")

  if (cityId) query = query.eq("city_id", cityId)

  const { data, error } = await query.order("created_at", { ascending: false }).limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
