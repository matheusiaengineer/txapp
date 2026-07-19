import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ status: "error", error_message: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { transactionId } = body;

  if (!transactionId) {
    return NextResponse.json({ status: "error", error_message: "ID da transação obrigatório" }, { status: 400 });
  }

  const { error } = await supabase
    .from("wallet_transactions")
    .update({
      status: "cancelled",
      metadata: { cancelled_at: new Date().toISOString(), reason: "user_cancelled" },
    })
    .eq("id", transactionId)
    .eq("profile_id", user.id)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ status: "error", error_message: "Erro ao cancelar" }, { status: 500 });
  }

  return NextResponse.json({ status: "success", data: { cancelled: true } });
}
