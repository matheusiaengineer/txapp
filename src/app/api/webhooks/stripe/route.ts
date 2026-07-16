import { NextRequest, NextResponse } from "next/server";
import { stripeService } from "@/lib/payment/stripe-service";

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

  switch (event.type) {
    case "payment_intent.succeeded":
      console.log("[Webhook] Payment succeeded:", event.data.id);
      break;
    case "payment_intent.payment_failed":
      console.error("[Webhook] Payment failed:", event.data.id);
      break;
    default:
      console.log("[Webhook] Unhandled event:", event.type);
  }

  return NextResponse.json({ received: true });
}
