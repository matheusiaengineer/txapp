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
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
    const providedSecret = req.headers.get("X-Webhook-Secret");

    if (webhookSecret && providedSecret !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    const { transaction_id, status, gateway_id, metadata } = payload;

    if (!transaction_id || !status) {
      return new Response(JSON.stringify({ error: "transaction_id e status obrigatórios" }), { status: 400, headers });
    }

    const { data: tx, error: txError } = await supabase
      .from("wallet_transactions")
      .select("id, profile_id, wallet_id, amount, status")
      .eq("id", transaction_id)
      .single();

    if (txError || !tx) {
      return new Response(JSON.stringify({ error: "Transação não encontrada" }), { status: 404, headers });
    }

    if (tx.status !== "pending") {
      return new Response(JSON.stringify({ error: "Transação já processada" }), { status: 400, headers });
    }

    let newStatus: string;
    let balanceBefore = 0;
    let balanceAfter = 0;

    if (status === "completed" || status === "confirmed") {
      newStatus = "confirmed";

      const { data: currentBalance } = await supabase
        .rpc("get_calculated_balance", { p_profile_id: tx.profile_id });

      balanceBefore = Number(currentBalance) || 0;
      balanceAfter = balanceBefore + Number(tx.amount);
    } else if (status === "failed" || status === "expired") {
      newStatus = "failed";
    } else {
      return new Response(JSON.stringify({ error: "Status inválido" }), { status: 400, headers });
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
    };

    if (gateway_id) updateData.metadata = { gateway_id, ...metadata };
    if (newStatus === "confirmed" && tx.expires_at) updateData.expires_at = null;

    const { error: updateError } = await supabase
      .from("wallet_transactions")
      .update(updateData)
      .eq("id", transaction_id);

    if (updateError) throw updateError;

    await supabase
      .from("notifications")
      .insert({
        user_id: tx.profile_id,
        type: "payment",
        title: newStatus === "confirmed" ? "Depósito confirmado!" : "Depósito falhou",
        body: newStatus === "confirmed"
          ? `Seu depósito de R$ ${Number(tx.amount).toFixed(2)} foi confirmado.`
          : "Seu depósito não foi concluído. Tente novamente.",
        data: { transaction_id, status: newStatus },
      });

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id,
        status: newStatus,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
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
