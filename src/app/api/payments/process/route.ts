import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/payment/stripe-server"
import { stripeService } from "@/lib/payment/stripe-service"
import { createClient } from "@/lib/supabase/server"
import { withRateLimit } from "@/lib/api-middleware"
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/payment/constants"

const handler = async (req: NextRequest) => {
  try {
    const { tripId, driverId, userId, amount, method = "card" } = await req.json()

    if (!tripId || !driverId || !userId || !amount) {
      return NextResponse.json({ error: "tripId, driverId, userId e amount são obrigatórios" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: account } = await supabase
      .from("stripe_accounts")
      .select("stripe_account_id")
      .eq("user_id", driverId)
      .single()

    if (!account?.stripe_account_id) {
      return NextResponse.json({ error: "Motorista não possui conta Stripe Connect" }, { status: 400 })
    }

    const amountInCents = Math.round(amount)
    const commission = Math.round(amountInCents * PLATFORM_COMMISSION_PERCENT)

    if (method === "pix") {
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: amountInCents,
        currency: "brl",
        payment_method_types: ["pix"],
        application_fee_amount: commission,
        transfer_data: {
          destination: account.stripe_account_id,
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
          destination: account.stripe_account_id,
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
