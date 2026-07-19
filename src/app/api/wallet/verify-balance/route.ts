import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ status: "error", error_message: "Não autorizado" }, { status: 401 });
  }

  const localBalance = parseInt(req.nextUrl.searchParams.get("local_balance") || "0");

  const { data: txns, error } = await supabase
    .from("wallet_transactions")
    .select("amount, type, status")
    .eq("profile_id", user.id)
    .eq("status", "confirmed");

  if (error) {
    return NextResponse.json({ status: "error", error_message: "Erro ao verificar saldo" }, { status: 500 });
  }

  const serverBalance = (txns || []).reduce((acc, tx) => {
    if (tx.type === "deposit" || tx.type === "refund" || tx.type === "bonus" || tx.type === "cashback") {
      return acc + tx.amount;
    }
    return acc - tx.amount;
  }, 0);

  let rpcBalance = serverBalance;
  try {
    const { data: rpc } = await supabase.rpc("get_calculated_balance", { p_profile_id: user.id });
    if (rpc !== null) rpcBalance = rpc;
  } catch {}

  const difference = Math.abs(localBalance - serverBalance);
  const is_valid = difference === 0;

  if (!is_valid) {
    await supabase.from("audit_logs").insert({
      profile_id: user.id,
      action: "wallet.parity_check.failed",
      metadata: {
        local_balance: localBalance,
        server_balance: serverBalance,
        difference,
      },
    });
  }

  return NextResponse.json({
    status: "success",
    data: {
      is_valid,
      server_balance: serverBalance,
      rpc_balance: rpcBalance,
      difference,
      transaction_count: txns?.length || 0,
    },
  });
}
