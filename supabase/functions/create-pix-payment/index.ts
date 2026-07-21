import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";

const ALLOWED_ORIGINS = ["https://txdapp.com", "http://localhost:3000"];

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405, headers });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { profile_id, amount, description } = await req.json();

    if (!profile_id || !amount || amount < 500) {
      return new Response(
        JSON.stringify({ error: "amount deve ser no mínimo 500 centavos (R$ 5,00)" }),
        { status: 400, headers }
      );
    }

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id")
      .eq("profile_id", profile_id)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: "Carteira não encontrada" }), { status: 404, headers });
    }

    const { data: tx, error: txError } = await supabase
      .from("wallet_transactions")
      .insert({
        profile_id,
        wallet_id: wallet.id,
        type: "deposit",
        amount: amount / 100,
        balance_before: 0,
        balance_after: 0,
        status: "pending",
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        description: description || "Depósito via PIX",
      })
      .select()
      .single();

    if (txError || !tx) {
      return new Response(JSON.stringify({ error: "Erro ao criar transação" }), { status: 500, headers });
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: tx.id,
        expires_at: tx.expires_at,
        amount_cents: amount,
        pix_code: `PIX-TXDAPP-${tx.id.slice(0, 8)}`,
        qr_code_text: `pix.txdapp.com/qr/${tx.id}`,
        status: "pending",
      }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers }
    );
  }
});
