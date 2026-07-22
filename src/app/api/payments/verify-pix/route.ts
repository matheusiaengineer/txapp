import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/payment/stripe-server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId, tripId } = await req.json()

    if (!paymentIntentId) {
      return NextResponse.json({ error: "paymentIntentId obrigatório" }, { status: 400 })
    }

    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === "succeeded") {
      const supabase = await createClient()

      await supabase
        .from("trips")
        .update({
          payment_status: "paid",
          status: "COMPLETED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tripId)

      return NextResponse.json({
        success: true,
        status: "paid",
        message: "Pagamento confirmado!",
      })
    }

    return NextResponse.json({
      success: false,
      status: paymentIntent.status,
      message: "Aguardando pagamento...",
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
