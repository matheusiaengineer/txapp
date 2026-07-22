import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const body = await req.json()
    const { cityLaunchId } = body

    if (!cityLaunchId) {
      return NextResponse.json({ error: "cityLaunchId obrigatório" }, { status: 400 })
    }

    const { data: launch } = await supabase
      .from("city_launches")
      .select("id, status, start_date, seed_end_date")
      .eq("id", cityLaunchId)
      .single()

    if (!launch || launch.status === "completed") {
      return NextResponse.json({ error: "Lançamento não disponível" }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from("driver_guarantees")
      .select("id")
      .eq("driver_id", user.id)
      .eq("city_launch_id", cityLaunchId)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Você já possui garantia ativa nesta cidade" }, { status: 400 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { data: guarantee, error } = await supabase
      .from("driver_guarantees")
      .insert({
        driver_id: user.id,
        city_launch_id: cityLaunchId,
        guaranteed_amount: 500,
        earned_amount: 0,
        txap_subsidy: 0,
        status: "active",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(guarantee, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cityLaunchId = searchParams.get("cityLaunchId")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  let query = supabase
    .from("driver_guarantees")
    .select("*, city_launches!inner(city_name, status)")
    .eq("driver_id", user.id)

  if (cityLaunchId) query = query.eq("city_launch_id", cityLaunchId)

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
