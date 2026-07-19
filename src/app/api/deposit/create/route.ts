import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";
import { stripeService } from "@/lib/payment/stripe-service";

const MIN_DEPOSIT = 5;

const handler = async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    if (amount < MIN_DEPOSIT) {
      return NextResponse.json({ error: `Depósito mínimo: R$ ${MIN_DEPOSIT}` }, { status: 400 });
    }

    let pixData: { id: string; qrCode: string | null; qrCodeUrl: string | null; amount: number; expiresAt: string } | null = null;
    let paymentId: string;

    try {
      pixData = await stripeService.createPixPayment(amount, `Depósito TXDAPP - ${user.email || user.id}`);
      paymentId = pixData.id;
    } catch {
      paymentId = `pix_mock_${Date.now()}`;
    }

    await supabase.from("wallets").upsert({
      profile_id: user.id,
      pending_deposit_id: paymentId,
      pending_deposit_amount: amount,
      pending_deposit_expires_at: new Date(Date.now() + 3600000).toISOString(),
    }, { onConflict: "profile_id" });

    return NextResponse.json({
      paymentId,
      amount,
      qrCode: pixData?.qrCode || null,
      qrCodeUrl: pixData?.qrCodeUrl || null,
      expiresAt: pixData?.expiresAt || new Date(Date.now() + 3600000).toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao criar depósito" }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'payment');
