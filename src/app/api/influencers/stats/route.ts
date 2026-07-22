import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const influencerId = searchParams.get("influencerId")

    if (!influencerId) {
      return NextResponse.json({ error: "influencerId é obrigatório" }, { status: 400 })
    }

    const { data: referrals } = await supabase
      .from("influencer_referrals")
      .select("*")
      .eq("influencer_id", influencerId)

    const { data: goals } = await supabase
      .from("influencer_goals")
      .select("*")
      .eq("influencer_id", influencerId)
      .eq("is_active", true)
      .single()

    return NextResponse.json({
      totalReferrals: referrals?.length || 0,
      completedReferrals: referrals?.filter(r => r.status === "completed").length || 0,
      currentGoal: goals || null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
