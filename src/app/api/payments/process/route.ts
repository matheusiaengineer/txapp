import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/payment/stripe-server"
import { stripeService } from "@/lib/payment/stripe-service"
import { createClient } from "@/lib/supabase/server"
import { withRateLimit } from "@/lib/api-middleware"
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/payment/constants"

export const dynamic = "force-dynamic"

const handler = async (req: NextRequest) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { tripId, driverId, amount, method = "card" } = await req.json()
    const userId = user.id

    if (!tripId || !driverId || !amount) {
      return NextResponse.json({ error: "tripId, driverId e amount são obrigatórios" }, { status: 400 })
    }

    const { data: driverProfile } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", driverId)
      .single()

    if (!driverProfile?.stripe_connect_account_id) {
      return NextResponse.json({ error: "Motorista não possui conta Stripe Connect" }, { status: 400 })
    }

    const amountInCents = Math.round(amount * 100)
    const commission = Math.round(amountInCents * PLATFORM_COMMISSION_PERCENT)

    if (method === "pix") {
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: amountInCents,
        currency: "brl",
        payment_method_types: ["pix"],
        application_fee_amount: commission,
        transfer_data: {
          destination: driverProfile.stripe_connect_account_id,
        },
        metadata: {
          trip_id: tripId,
          driver_id: driverId,
          user_id: userId,
        },
      })

      const qrCode = paymentIntent.next_action?.pix_display_qr_code?.data || null
      const qrCodeUrl = paymentIntent.next_action?.pix_display_qr_code?.image_url_png || null

      return NextResponse.json({
        id: paymentIntent.id,
        qrCode,
        qrCodeUrl,
        amount: amountInCents / 100,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
    }

    const session = await getStripe().checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: "Corrida TXAP" },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: commission,
        transfer_data: {
          destination: driverProfile.stripe_connect_account_id,
        },
        metadata: {
          trip_id: tripId,
          driver_id: driverId,
          user_id: userId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://txap.vercel.app"}/payment?success=true&tripId=${tripId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://txap.vercel.app"}/payment?canceled=true&tripId=${tripId}`,
    })

    return NextResponse.json({
      id: session.id,
      url: session.url,
      amount: amountInCents / 100,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const POST = withRateLimit(handler, "payment")
