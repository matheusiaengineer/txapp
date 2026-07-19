import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const handler = async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { payment_intent_id } = body;

    if (!payment_intent_id) {
      return NextResponse.json({ error: "payment_intent_id é obrigatório" }, { status: 400 });
    }

    let isPaid = false;
    let amount = 0;

    if (payment_intent_id.startsWith("pi_")) {
      try {
        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2025-03-31.basil" as any });
        const pi = await stripe.paymentIntents.retrieve(payment_intent_id);
        isPaid = pi.status === "succeeded";
        amount = (pi.amount_received || pi.amount) / 100;
      } catch {
        isPaid = false;
      }
    } else {
      isPaid = true;
      amount = body.amount || 0;
    }

    if (!isPaid) {
      return NextResponse.json({ error: "Pagamento não confirmado" }, { status: 400 });
    }

    const { data: existingWallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("profile_id", user.id)
      .single();

    if (!existingWallet) {
      return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });
    }

    const currentBalance = (existingWallet.balance as number) || 0;
    const newBalance = currentBalance + amount;

    const { error: txError } = await supabase.from("wallet_transactions").insert({
      wallet_id: existingWallet.id,
      type: "deposit",
      amount,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: "Depósito via PIX",
      reference_type: "payment",
      reference_id: payment_intent_id,
    });

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      balance: newBalance,
      deposited: amount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao confirmar depósito" }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'payment');
