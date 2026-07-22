import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/payment/stripe-server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pi = searchParams.get("pi")

  if (!pi) {
    return NextResponse.json({ error: "paymentIntentId obrigatório" }, { status: 400 })
  }

  try {
    const paymentIntent = await getStripe().paymentIntents.retrieve(pi)

    const response: any = {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      created: paymentIntent.created,
    }

    if (paymentIntent.status === "succeeded") {
      response.amount_received = paymentIntent.amount_received
    }

    if (paymentIntent.status === "requires_payment_method" || paymentIntent.status === "requires_action") {
      const created = new Date(paymentIntent.created * 1000)
      const now = new Date()
      const diffMs = now.getTime() - created.getTime()

      if (diffMs > 5 * 60 * 1000) {
        response.status = "expired"
      }
    }

    return NextResponse.json(response)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
