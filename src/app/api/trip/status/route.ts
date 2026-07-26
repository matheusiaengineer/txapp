import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRIVER_ACCEPTED: ["GOING_TO_PICKUP", "CANCELLED"],
  GOING_TO_PICKUP: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["PASSENGER_ON_BOARD", "CANCELLED"],
  PASSENGER_ON_BOARD: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["FINISHING", "CANCELLED"],
  FINISHING: ["PAYMENT_CONFIRMED", "COMPLETED"],
  PAYMENT_CONFIRMED: ["FINISHED", "COMPLETED"],
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

    const { tripId, newStatus } = await req.json()
    if (!tripId || !newStatus) {
      return NextResponse.json({ error: "tripId e newStatus obrigatorios" }, { status: 400 })
    }

    const { data: trip, error: fetchErr } = await supabase
      .from("trips")
      .select("id, status, driver_id")
      .eq("id", tripId)
      .single()

    if (fetchErr || !trip) {
      return NextResponse.json({ error: "Corrida nao encontrada" }, { status: 404 })
    }

    if (trip.driver_id !== user.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 403 })
    }

    const allowed = VALID_TRANSITIONS[trip.status]
    if (!allowed || !allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Transicao invalida: ${trip.status} -> ${newStatus}` },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = { status: newStatus }

    if (newStatus === "FINISHING" || newStatus === "COMPLETED") {
      updateData.completed_at = new Date().toISOString()
    }
    if (newStatus === "PAYMENT_CONFIRMED") {
      updateData.payment_status = "paid"
    }

    const { error: updateErr } = await supabase
      .from("trips")
      .update(updateData)
      .eq("id", tripId)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
