import { NextRequest, NextResponse } from "next/server"
import { stripeService } from "@/lib/payment/stripe-service"
import { getStripe } from "@/lib/payment/stripe-server"
import { createClient } from "@/lib/supabase/server"
import { REQUIRED_DEPOSITS } from "@/lib/payment/constants"

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const body = await req.text()
  const event = await stripeService.verifyWebhook(signature, body)

  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data as any
      const tripId = pi.metadata?.trip_id
      const driverId = pi.metadata?.driver_id
      const userId = pi.metadata?.user_id || pi.metadata?.rider_id
      const serviceType = pi.metadata?.service_type || "carro"
      const source = pi.metadata?.source || "checkout"

      if (tripId) {
        const newStatus = source === "qr_code" || source === "pix_qr" ? "PAYMENT_CONFIRMED" : "PAYMENT_CONFIRMED"
        await supabase.from("trips").update({
          status: newStatus,
          payment_status: "paid",
          final_fare: pi.amount / 100,
          payment_id: pi.id,
          updated_at: new Date().toISOString(),
        }).eq("id", tripId)
      }

      if (userId) {
        const amount = (pi.amount_received || pi.amount) / 100
        const requiredDeposit = REQUIRED_DEPOSITS[serviceType] || 25

        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("profile_id", userId)
          .single()
        const currentBalance = (wallet?.balance as number) || 0
        const newBalance = currentBalance + amount
        const isQualified = newBalance >= requiredDeposit

        await supabase.from("wallets").upsert({
          profile_id: userId,
          balance: newBalance,
          deposit_required: requiredDeposit,
          is_qualified: isQualified,
        }, { onConflict: "profile_id" })
      }

      if (driverId) {
        const amount = pi.amount_received || pi.amount
        const fee = pi.application_fee_amount || 0
        const driverAmount = (amount - fee) / 100
        await supabase.from("driver_earnings").upsert({
          driver_id: driverId,
          amount: driverAmount,
          trip_id: tripId,
          payment_intent: pi.id,
          status: "available",
          created_at: new Date().toISOString(),
        })

        if (source === "pix_qr") {
          const { data: w } = await supabase.from("wallets").select("id, balance").eq("profile_id", driverId).single()
          if (w) {
            await supabase.from("wallet_transactions").insert({
              profile_id: driverId,
              wallet_id: w.id,
              type: "ride_earning",
              amount: driverAmount,
              balance_before: w.balance,
              balance_after: w.balance + driverAmount,
              status: "confirmed",
              description: `Corrida ${tripId} - PIX`,
              reference_type: "trip",
              reference_id: tripId,
            })
          }
        }
      }

      try {
        await supabase.channel(`trip:${tripId}`).send({
          type: "broadcast",
          event: "payment_confirmed",
          payload: { tripId, status: "paid", amount: pi.amount / 100 },
        })
      } catch {}
      break
    }

    case "payment_intent.payment_failed":
      console.error("[Webhook] Payment failed:", event.data.id)
      break

    case "charge.dispute.created": {
      const dispute = event.data as any
      console.warn("[Webhook] Dispute created:", dispute.id, "PI:", dispute.payment_intent)
      break
    }

    case "checkout.session.completed": {
      const session = event.data as any

      if (session.metadata?.type === "company_subscription") {
        const companyId = session.metadata.company_id
        const planId = session.metadata.plan_id
        const start = new Date()
        const end = new Date(start)
        end.setDate(end.getDate() + 7)

        await supabase.from("company_subscriptions").upsert({
          company_id: companyId,
          plan_id: planId,
          status: "active",
          auto_renew: true,
          current_period_start: start.toISOString(),
          current_period_end: end.toISOString(),
          stripe_subscription_id: session.subscription as string,
        }, { onConflict: "company_id" })

        const { data: plan } = await supabase
          .from("company_subscription_plans")
          .select("is_featured, priority_score")
          .eq("id", planId)
          .single()

        if (plan?.is_featured) {
          await supabase.from("companies").update({
            is_featured: true,
            priority_score: plan.priority_score,
          }).eq("id", companyId)
        }

        await supabase.from("company_invoices").insert({
          company_id: companyId,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          period_start: start.toISOString(),
          period_end: end.toISOString(),
          status: "paid",
          stripe_invoice_id: session.invoice as string,
          payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
          paid_at: new Date().toISOString(),
        })
        break
      }

      if (session.payment_intent) {
        const pi = await getStripe().paymentIntents.retrieve(
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent.id
        )
        const tripId = pi.metadata?.trip_id
        const driverId = pi.metadata?.driver_id

        if (tripId) {
          await supabase.from("trips").update({
            status: "PAYMENT_CONFIRMED",
            payment_id: pi.id,
            updated_at: new Date().toISOString(),
          }).eq("id", tripId)
        }
      }
      break
    }

    case "transfer.created":
    case "payout.paid":
      break

    default:
      console.log("[Webhook] Unhandled event:", event.type)
  }

  return NextResponse.json({ received: true })
}
