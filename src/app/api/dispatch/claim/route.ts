import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ error: "orderId obrigatório" }, { status: 400 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .single()

    if (profile?.account_type !== "driver_moto" && profile?.account_type !== "driver_car") {
      return NextResponse.json({ error: "Apenas motoristas podem aceitar entregas" }, { status: 403 })
    }

    const { data: order, error: fetchError } = await supabase
      .from("company_orders")
      .select("id, status, driver_id")
      .eq("id", orderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    if (order.driver_id) {
      return NextResponse.json({ error: "Pedido já foi aceito por outro motorista" }, { status: 409 })
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      return NextResponse.json({ error: "Pedido já finalizado" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("company_orders")
      .update({ driver_id: user.id, status: "in_delivery" })
      .eq("id", orderId)
      .is("driver_id", null)

    if (updateError) {
      return NextResponse.json({ error: "Erro ao aceitar pedido. Pode já ter sido aceito." }, { status: 409 })
    }

    return NextResponse.json({ success: true, message: "Pedido aceito com sucesso" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
