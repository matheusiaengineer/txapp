import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/payment/stripe-server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const PLATFORM_COMMISSION_PERCENT = 0.15;

const handler = async (req: NextRequest) => {
  try {
    const { amount, driverId, tripId, currency = "brl" } = await req.json();

    if (!amount || !driverId || !tripId) {
      return NextResponse.json({ error: "amount, driverId e tripId obrigatórios" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: account } = await supabase
      .from("stripe_accounts")
      .select("stripe_account_id")
      .eq("user_id", driverId)
      .single();

    if (!account?.stripe_account_id) {
      return NextResponse.json({ error: "Motorista não possui conta Stripe" }, { status: 400 });
    }

    const commission = Math.round(amount * PLATFORM_COMMISSION_PERCENT * 100);
    const driverAmount = Math.round(amount * 100) - commission;

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      payment_method_types: ["card", "pix"],
      application_fee_amount: commission,
      transfer_data: {
        destination: account.stripe_account_id,
      },
      metadata: {
        trip_id: tripId,
        driver_id: driverId,
      },
    });

    return NextResponse.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      commission: commission / 100,
      driverReceives: driverAmount / 100,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'payment');
