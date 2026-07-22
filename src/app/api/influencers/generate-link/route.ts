import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { influencerId } = await req.json()
    if (!influencerId) {
      return NextResponse.json({ error: "influencerId é obrigatório" }, { status: 400 })
    }

    const { data: influencer } = await supabase
      .from("influencers")
      .select("instagram_handle")
      .eq("id", influencerId)
      .single()

    if (!influencer) {
      return NextResponse.json({ error: "Influenciador não encontrado" }, { status: 404 })
    }

    const code = `TXAP${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://txap.vercel.app"

    const { error } = await supabase
      .from("influencer_referrals")
      .insert({
        influencer_id: influencerId,
        referral_code: code,
      })

    if (error) throw error

    return NextResponse.json({
      referralCode: code,
      link: `${baseUrl}?ref=${code}`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
