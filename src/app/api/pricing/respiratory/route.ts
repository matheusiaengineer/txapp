import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cityId = searchParams.get("cityId")

  if (!cityId) {
    return NextResponse.json({ error: "cityId obrigatório" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc("calculate_respiratory_rate", {
    p_city_id: cityId,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const body = await req.json()
    const { tripId, acceptSurcharge } = body

    if (!tripId) {
      return NextResponse.json({ error: "tripId obrigatório" }, { status: 400 })
    }

    const { data: trip } = await supabase
      .from("trips")
      .select("id, estimated_fare")
      .eq("id", tripId)
      .single()

    if (!trip) {
      return NextResponse.json({ error: "Corrida não encontrada" }, { status: 404 })
    }

    if (acceptSurcharge) {
      const { data: cityId } = await supabase
        .from("cities")
        .select("id")
        .limit(1)
        .single()

      if (cityId) {
        const { data: rate } = await supabase.rpc("calculate_respiratory_rate", {
          p_city_id: cityId.id,
        })

        const rateData = rate as any
        const incentive = rateData?.dynamic_incentive || 0

        await supabase
          .from("trips")
          .update({
            respiratory_incentive: incentive,
            user_accepted_surcharge: true,
          })
          .eq("id", tripId)

        return NextResponse.json({
          originalFare: trip.estimated_fare,
          surcharge: incentive,
          totalFare: trip.estimated_fare + incentive,
          breathRate: rateData?.breath_rate || 0,
        })
      }
    }

    await supabase
      .from("trips")
      .update({ user_accepted_surcharge: false })
      .eq("id", tripId)

    return NextResponse.json({
      originalFare: trip.estimated_fare,
      surcharge: 0,
      totalFare: trip.estimated_fare,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
