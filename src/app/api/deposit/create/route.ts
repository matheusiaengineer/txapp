import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

export const POST = withRateLimit(async (req: NextRequest) => {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ status: "error", error_message: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const amount = body.amount;
  const ip_address = body.ip_address || req.headers.get("x-forwarded-for") || "unknown";
  const geo_location = body.geo_location || null;

  if (!amount || amount < 1000) {
    return NextResponse.json(
      { status: "error", error_message: "Valor mínimo de depósito: R$ 10,00" },
      { status: 400 }
    );
  }

  const { data: pending } = await supabase
    .from("wallet_transactions")
    .select("id")
    .eq("profile_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pending) {
    return NextResponse.json(
      { status: "error", error_message: "Você já possui um depósito pendente" },
      { status: 409 }
    );
  }

  const transactionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const { error } = await supabase.from("wallet_transactions").insert({
    id: transactionId,
    profile_id: user.id,
    amount: amount,
    type: "deposit",
    status: "pending",
    expires_at: expiresAt,
    ip_address,
    geo_location,
    metadata: {
      method: "pix",
      created_at: new Date().toISOString(),
    },
  });

  if (error) {
    return NextResponse.json(
      { status: "error", error_message: "Erro ao criar depósito" },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    profile_id: user.id,
    action: "wallet.deposit.request",
    metadata: { transaction_id: transactionId, amount },
    ip_address,
  });

  return NextResponse.json({
    status: "success",
    data: {
      transactionId,
      amount,
      expiresAt,
      pixCode: "00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540510.005802BR59086009TXDAPP6009Sao Paulo62070503***63041234",
      pixQrCode: null,
    },
  });
}, "payment");
