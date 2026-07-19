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

    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance, is_qualified, deposit_required, updated_at")
      .eq("profile_id", user.id)
      .single();

    if (!wallet) {
      return NextResponse.json({ balance: 0, is_qualified: false, deposit_required: 0 });
    }

    const { count } = await supabase
      .from("wallet_transactions")
      .select("*", { count: "exact", head: true })
      .eq("wallet_id", wallet.id);

    return NextResponse.json({
      walletId: wallet.id,
      balance: wallet.balance,
      is_qualified: wallet.is_qualified,
      deposit_required: wallet.deposit_required,
      transaction_count: count || 0,
      updated_at: wallet.updated_at,
    });
  } catch (err: any) {
    return NextResponse.json({ balance: 0, is_qualified: false, deposit_required: 0 });
  }
};

export const GET = withRateLimit(handler, "default");