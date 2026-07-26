import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/payment/stripe-server"
import { createClient } from "@/lib/supabase/server"
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/payment/constants"
import { withRateLimit } from "@/lib/api-middleware"

const handler = async (req: NextRequest) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { tripId, amount, driverId } = await req.json()
    const riderId = user.id

    if (!tripId || !amount || !driverId) {
      return NextResponse.json({ error: "tripId, amount e driverId obrigatórios" }, { status: 400 })
    }

    const { data: driverProfile } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", driverId)
      .single()

    if (!driverProfile?.stripe_connect_account_id) {
      return NextResponse.json({ error: "Motorista sem conta Stripe Connect" }, { status: 400 })
    }

    const amountInCents = Math.round(amount * 100)
    const platformFee = Math.round(amountInCents * PLATFORM_COMMISSION_PERCENT)
    const driverEarnings = amountInCents - platformFee

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountInCents,
      currency: "brl",
      payment_method_types: ["pix"],
      metadata: {
        trip_id: tripId,
        driver_id: driverId,
        rider_id: riderId,
        source: "pix_qr",
      },
      transfer_data: {
        destination: driverProfile.stripe_connect_account_id,
      },
      application_fee_amount: platformFee,
    })

    await supabase
      .from("trips")
      .update({
        payment_method: "pix",
        payment_status: "pending",
        stripe_payment_intent_id: paymentIntent.id,
        amount: amount,
        platform_fee: platformFee / 100,
        driver_earnings: driverEarnings / 100,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tripId)

    const qrCode = paymentIntent.next_action?.pix_display_qr_code?.data || null
    const qrCodeUrl = paymentIntent.next_action?.pix_display_qr_code?.image_url_png || null

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      qrCode,
      qrCodeUrl,
      amount,
      platformFee: platformFee / 100,
      driverEarnings: driverEarnings / 100,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
};

export const POST = withRateLimit(handler, 'payment');
