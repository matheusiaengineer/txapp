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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type");

    const { data: wallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!wallet) {
      return NextResponse.json({ transactions: [], total: 0 });
    }

    let query = supabase
      .from("wallet_transactions")
      .select("*", { count: "exact" })
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("type", type);
    }

    const { data: transactions, count } = await query;

    return NextResponse.json({
      transactions: transactions || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (err: any) {
    return NextResponse.json({ transactions: [], total: 0 });
  }
};

export const GET = withRateLimit(handler, "default");