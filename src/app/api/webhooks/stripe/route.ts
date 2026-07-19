import { NextRequest, NextResponse } from "next/server";
import { stripeService } from "@/lib/payment/stripe-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await req.text();
  const event = await stripeService.verifyWebhook(signature, body);

  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data as any;
      const tripId = pi.metadata?.trip_id;
      const driverId = pi.metadata?.driver_id;
      const userId = pi.metadata?.user_id;
      const serviceType = pi.metadata?.service_type || "carro";

      if (tripId) {
        await supabase.from("trips").update({
          status: "PAYMENT_CONFIRMED",
          final_fare: pi.amount / 100,
          payment_id: pi.id,
          updated_at: new Date().toISOString(),
        }).eq("id", tripId);
      }

      if (userId) {
        const amount = (pi.amount_received || pi.amount) / 100;
        const REQUIRED: Record<string, number> = { moto: 15, carro: 25, freight: 30 };
        const requiredDeposit = REQUIRED[serviceType] || 25;
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("profile_id", userId)
          .single();
        const currentBalance = (wallet?.balance as number) || 0;
        const newBalance = currentBalance + amount;
        const isQualified = newBalance >= requiredDeposit;
        await supabase.from("wallets").upsert({
          profile_id: userId,
          balance: newBalance,
          deposit_required: requiredDeposit,
          is_qualified: isQualified,
        }, { onConflict: "profile_id" });
      }

      if (driverId) {
        const amount = pi.amount_received || pi.amount;
        const fee = pi.application_fee_amount || 0;
        const driverAmount = (amount - fee) / 100;
        await supabase.from("driver_earnings").upsert({
          driver_id: driverId,
          amount: driverAmount,
          trip_id: tripId,
          payment_intent: pi.id,
          status: "available",
          created_at: new Date().toISOString(),
        });
      }
      break;
    }
    case "payment_intent.payment_failed":
      console.error("[Webhook] Payment failed:", event.data.id);
      break;
    case "transfer.created":
    case "payout.paid":
      break;
    default:
      console.log("[Webhook] Unhandled event:", event.type);
  }

  return NextResponse.json({ received: true });
}
