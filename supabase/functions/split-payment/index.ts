import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { trip_id } = await req.json();
    if (!trip_id) {
      return new Response(JSON.stringify({ error: "trip_id obrigatório" }), { status: 400 });
    }

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id, passenger_id, driver_id, estimated_fare, final_fare, status")
      .eq("id", trip_id)
      .single();

    if (tripError || !trip) {
      return new Response(JSON.stringify({ error: "Corrida não encontrada" }), { status: 404 });
    }

    if (trip.status !== "COMPLETED" && trip.status !== "IN_PROGRESS") {
      return new Response(JSON.stringify({ error: "Corrida não pode ser finalizada" }), { status: 400 });
    }

    const fare = trip.final_fare || trip.estimated_fare || 0;
    const platformFee = Math.round(fare * 0.1 * 100) / 100;
    const driverAmount = fare - platformFee;

    const { data: passengerWallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("profile_id", trip.passenger_id)
      .single();

    if (!passengerWallet || passengerWallet.balance < fare) {
      return new Response(JSON.stringify({ error: "Saldo insuficiente do passageiro" }), { status: 400 });
    }

    const { data: driverWallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("profile_id", trip.driver_id)
      .single();

    if (!driverWallet) {
      return new Response(JSON.stringify({ error: "Carteira do motorista não encontrada" }), { status: 404 });
    }

    const { error: debitError } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: passengerWallet.id,
        type: "payment",
        amount: -fare,
        description: `Pagamento corrida #${trip_id}`,
        status: "completed",
        reference_id: trip_id,
      });
    if (debitError) throw debitError;

    const { error: creditError } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: driverWallet.id,
        type: "transfer",
        amount: driverAmount,
        description: `Ganhos corrida #${trip_id} (taxa: R$ ${platformFee.toFixed(2)})`,
        status: "available_for_withdrawal",
        reference_id: trip_id,
      });
    if (creditError) throw creditError;

    const { error: feeError } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: passengerWallet.id,
        type: "commission",
        amount: platformFee,
        description: `Taxa TXDAPP corrida #${trip_id}`,
        status: "completed",
        reference_id: trip_id,
      });
    if (feeError) throw feeError;

    await supabase
      .from("trips")
      .update({ status: "PAYMENT_CONFIRMED", final_fare: fare })
      .eq("id", trip_id);

    await supabase.rpc("update_wallet_balance", {
      p_wallet_id: passengerWallet.id,
      p_amount: -fare,
    });
    await supabase.rpc("update_wallet_balance", {
      p_wallet_id: driverWallet.id,
      p_amount: driverAmount,
    });

    return new Response(JSON.stringify({
      success: true,
      trip_id,
      passenger_debited: fare,
      driver_credited: driverAmount,
      platform_fee: platformFee,
      driver_status: "available_for_withdrawal",
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
