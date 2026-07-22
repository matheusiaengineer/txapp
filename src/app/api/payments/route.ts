import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/payment/stripe-server";
import { withRateLimit } from "@/lib/api-middleware";

const handler = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { amount, currency = "brl", paymentMethod, metadata } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    if (paymentMethod === "pix") {
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        payment_method_types: ["pix"],
        metadata: metadata || {},
      });
      return NextResponse.json({
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        qrCode: paymentIntent.next_action?.pix_display_qr_code?.data || null,
        qrCodeUrl: paymentIntent.next_action?.pix_display_qr_code?.image_url_png || null,
      });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      payment_method_types: ["card"],
      metadata: metadata || {},
    });

    return NextResponse.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err: any) {
    console.error("[Stripe] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'payment');

export async function GET() {
  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const { data: plans } = await supabase
      .from("company_subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_weekly", { ascending: true })
    return NextResponse.json({ plans: plans || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
