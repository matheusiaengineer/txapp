import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { planId } = await req.json()
    if (!planId) return NextResponse.json({ error: "Plano obrigatório" }, { status: 400 })

    const { data: plan, error: planError } = await supabase
      .from("company_subscription_plans")
      .select("*")
      .eq("id", planId)
      .single()
    if (planError || !plan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 })
    }

    const start = new Date()
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    if (plan.price_weekly <= 0) {
      const { data: existingSub } = await supabase
        .from("company_subscriptions")
        .select("id")
        .eq("company_id", user.id)
        .single()

      if (existingSub) {
        await supabase.from("company_subscriptions").update({
          plan_id: planId,
          status: "active",
          current_period_start: start.toISOString(),
          current_period_end: end.toISOString(),
        }).eq("company_id", user.id)
      } else {
        await supabase.from("company_subscriptions").insert({
          company_id: user.id,
          plan_id: planId,
          status: "active",
          current_period_start: start.toISOString(),
          current_period_end: end.toISOString(),
        })
      }

      if (plan.is_featured) {
        await supabase.from("companies").update({
          is_featured: true,
          priority_score: plan.priority_score,
        }).eq("id", user.id)
      }

      return NextResponse.json({ ok: true, message: "Assinatura gratuita ativada" })
    }

    const { data: company } = await supabase
      .from("companies")
      .select("corporate_name")
      .eq("id", user.id)
      .single()

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "brl",
          product_data: {
            name: `${plan.name} - ${company?.corporate_name || "TXAP"}`,
            description: `Assinatura semanal TXAP - ${plan.description}`,
          },
          unit_amount: Math.round(plan.price_weekly * 100),
          recurring: { interval: "week", interval_count: 1 },
        },
        quantity: 1,
      }],
      metadata: {
        company_id: user.id,
        plan_id: planId,
        type: "company_subscription",
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://txap.vercel.app"}/dashboard/passenger/explore?subscribed=ok`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://txap.vercel.app"}/dashboard/passenger/explore?subscribed=cancel`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
