import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const REQUIRED: Record<string, number> = { moto: 15, carro: 25, freight: 30 };

async function getWallet(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wallets")
    .select("balance, deposit_required, is_qualified")
    .eq("profile_id", userId)
    .single();
  return data || { balance: 0, deposit_required: 0, is_qualified: false };
}

async function upsertWallet(userId: string, balance: number) {
  const supabase = await createClient();
  const required = REQUIRED["carro"] || 25;
  const isQualified = balance >= required;
  const { error } = await supabase.from("wallets").upsert({
    profile_id: userId,
    balance,
    deposit_required: required,
    is_qualified: isQualified,
  }, { onConflict: "profile_id" });
  return { error, isQualified, required };
}

const getHandler = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || request.headers.get("x-user-id") || request.nextUrl.searchParams.get("user_id") || "anon";
    const serviceType = request.nextUrl.searchParams.get("service") || "carro";

    const requiredDeposit = REQUIRED[serviceType] || 25;
    const wallet = await getWallet(userId);
    const balance = wallet.balance || 0;
    const qualified = balance >= requiredDeposit;

    const { count } = await supabase
      .from("wallets")
      .select("*", { count: "exact", head: true })
      .gte("balance", requiredDeposit);

    return NextResponse.json({
      qualified,
      balance,
      requiredDeposit,
      serviceType,
      canRequest: qualified,
      missingAmount: qualified ? 0 : requiredDeposit - balance,
      qualifiedCount: count || 0,
    });
  } catch {
    return NextResponse.json({
      qualified: false, balance: 0, requiredDeposit: 25,
      serviceType: "carro", canRequest: false, missingAmount: 25, qualifiedCount: 0,
    });
  }
};

const postHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || body.user_id || "anon";
    const amount = body.amount || 0;
    const serviceType = body.service_type || "carro";

    if (amount <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const requiredDeposit = REQUIRED[serviceType] || 25;
    const wallet = await getWallet(userId);
    const currentBalance = wallet.balance || 0;
    const newBalance = currentBalance + amount;

    const { isQualified, required } = await upsertWallet(userId, newBalance);

    return NextResponse.json({
      success: true,
      balance: newBalance,
      deposited: amount,
      qualified: isQualified,
      requiredDeposit: required,
      serviceType,
      canRequest: isQualified,
      missingAmount: isQualified ? 0 : required - newBalance,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao processar depósito" }, { status: 500 });
  }
};

export const GET = withRateLimit(getHandler, 'default');
export const POST = withRateLimit(postHandler, 'default');
