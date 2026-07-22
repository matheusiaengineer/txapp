import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/payment/stripe-server"
import { createClient } from "@/lib/supabase/server"
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/payment/constants"
import QRCode from "qrcode"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tripId = (await params).id
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: trip } = await supabase
      .from("trips")
      .select("*, driver_profiles!inner(id)")
      .eq("id", tripId)
      .single()

    if (!trip) {
      return NextResponse.json({ error: "Corrida não encontrada" }, { status: 404 })
    }

    if (trip.driver_id !== user.id) {
      return NextResponse.json({ error: "Apenas o motorista desta corrida pode gerar o QR" }, { status: 403 })
    }

    if (trip.status !== "ARRIVED" && trip.status !== "GOING_TO_PICKUP") {
      return NextResponse.json({ error: "Motorista ainda não chegou ao destino" }, { status: 400 })
    }

    if (!trip.final_fare && !trip.estimated_fare) {
      return NextResponse.json({ error: "Corrida sem valor definido" }, { status: 400 })
    }

    const amount = Math.round((trip.final_fare || trip.estimated_fare) * 100)

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    const paymentIntent = await getStripe().paymentIntents.create({
      amount,
      currency: "brl",
      payment_method_types: ["card", "pix"],
      metadata: {
        trip_id: tripId,
        driver_id: trip.driver_id,
        rider_id: trip.passenger_id,
        source: "qr_code",
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://txap.vercel.app"
    const paymentUrl = `${baseUrl}/pay-qr?pi=${paymentIntent.id}&trip=${tripId}`
    const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })

    await supabase
      .from("trips")
      .update({
        payment_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tripId)

    return NextResponse.json({
      qrCodeDataUrl,
      paymentUrl,
      paymentIntentId: paymentIntent.id,
      expiresAt: expiresAt.toISOString(),
      amount: amount / 100,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
