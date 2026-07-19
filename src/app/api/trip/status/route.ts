import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRIVER_ACCEPTED: ["GOING_TO_PICKUP", "CANCELLED"],
  GOING_TO_PICKUP: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["PASSENGER_ON_BOARD", "CANCELLED"],
  PASSENGER_ON_BOARD: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["FINISHING", "CANCELLED"],
  FINISHING: ["COMPLETED"],
  COMPLETED: ["PAYMENT_PENDING"],
  PAYMENT_PENDING: ["PAYMENT_CONFIRMED"],
};

const handler = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { tripId, newStatus } = body;

    if (!tripId || !newStatus) {
      return NextResponse.json({ error: "tripId e newStatus obrigatórios" }, { status: 400 });
    }

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id, status, driver_id")
      .eq("id", tripId)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: "Corrida não encontrada" }, { status: 404 });
    }

    if (trip.driver_id !== user.id) {
      return NextResponse.json({ error: "Esta corrida não pertence a você" }, { status: 403 });
    }

    const allowed = ALLOWED_TRANSITIONS[trip.status];
    if (!allowed || !allowed.includes(newStatus)) {
      return NextResponse.json({
        error: `Transição inválida: ${trip.status} → ${newStatus}`,
      }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      status: newStatus,
      ...(newStatus === "GOING_TO_PICKUP" ? { started_at: new Date().toISOString() } : {}),
      ...(newStatus === "COMPLETED" ? { completed_at: new Date().toISOString() } : {}),
    };

    const { error: updateError } = await supabase
      .from("trips")
      .update(updateData)
      .eq("id", tripId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao atualizar status" }, { status: 500 });
  }
};

export const PATCH = withRateLimit(handler, "dispatch");
