import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const body = await req.json()
    const { cityLaunchId, missionType } = body

    const { data: driverProfile } = await supabase
      .from("driver_profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!driverProfile) {
      return NextResponse.json({ error: "Apenas motoristas podem participar de missões" }, { status: 403 })
    }

    const bonusMap: Record<string, number> = {
      onboarding: 50,
      first_ride_simulated: 150,
      first_ride_real: 200,
      referral: 100,
    }

    const existingMission = await supabase
      .from("seed_missions")
      .select("id, status")
      .eq("driver_id", user.id)
      .eq("city_launch_id", cityLaunchId)
      .eq("mission_type", missionType)
      .single()

    if (existingMission.data) {
      if (existingMission.data.status === "paid") {
        return NextResponse.json({ error: "Missão já foi paga" }, { status: 400 })
      }
      if (existingMission.data.status === "completed") {
        return NextResponse.json({ error: "Missão já concluída" }, { status: 400 })
      }
    }

    if (existingMission.data?.status === "pending") {
      const { error: completeErr } = await supabase
        .from("seed_missions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", existingMission.data.id)

      if (completeErr) return NextResponse.json({ error: completeErr.message }, { status: 500 })

      const bonusAmount = bonusMap[missionType] || 0

      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("profile_id", user.id)
        .single()

      await supabase.from("wallet_transactions").insert({
        profile_id: user.id,
        wallet_id: wallet?.id,
        type: "genesis_bonus",
        amount: bonusAmount,
        balance_before: wallet?.balance || 0,
        balance_after: (wallet?.balance || 0) + bonusAmount,
        status: "confirmed",
        description: `Missão TXAP Seed: ${missionType}`,
        reference_type: "city_launch",
        reference_id: cityLaunchId,
      })

      return NextResponse.json({ success: true, missionType, bonusAmount })
    }

    const { data: mission, error } = await supabase
      .from("seed_missions")
      .insert({
        city_launch_id: cityLaunchId,
        driver_id: user.id,
        mission_type: missionType,
        bonus_amount: bonusMap[missionType] || 0,
        status: missionType === "onboarding" ? "completed" : "pending",
        completed_at: missionType === "onboarding" ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (missionType === "onboarding") {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("profile_id", user.id)
        .single()

      await supabase.from("wallet_transactions").insert({
        profile_id: user.id,
        wallet_id: wallet?.id,
        type: "genesis_bonus",
        amount: bonusMap.onboarding,
        balance_before: wallet?.balance || 0,
        balance_after: (wallet?.balance || 0) + bonusMap.onboarding,
        status: "confirmed",
        description: "Bônus de onboarding TXAP Seed",
        reference_type: "city_launch",
        reference_id: cityLaunchId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const { data: launch } = await supabase
        .from("city_launches")
        .select("motoristas_registered")
        .eq("id", cityLaunchId)
        .single()

      await supabase
        .from("city_launches")
        .update({ motoristas_registered: (launch?.motoristas_registered || 0) + 1 })
        .eq("id", cityLaunchId)
    }

    return NextResponse.json(mission, { status: 201 })
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
    .from("seed_missions")
    .select("*")
    .eq("driver_id", user.id)

  if (cityLaunchId) query = query.eq("city_launch_id", cityLaunchId)

  const { data, error } = await query.order("created_at")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
