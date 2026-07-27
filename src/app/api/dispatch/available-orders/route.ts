import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type, company_id")
      .eq("id", user.id)
      .single()

    const isDriver = profile?.account_type === "driver_moto" || profile?.account_type === "driver_car"

    if (isDriver) {
      const { data: orders, error } = await supabase
        .from("company_orders")
        .select("id, company_id, items, total_amount, delivery_fee, delivery_address, delivery_lat, delivery_lng, notes, status, created_at, companies!inner(trade_name, corporate_name, phone)")
        .is("driver_id", null)
        .in("status", ["pending", "confirmed", "preparing"])
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ orders: orders || [] })
    }

    const isCompany = profile?.account_type === "business" || profile?.account_type === "company"
    if (isCompany) {
      const { data: orders, error } = await supabase
        .from("company_orders")
        .select("id, customer_id, items, total_amount, delivery_fee, delivery_address, delivery_lat, delivery_lng, notes, status, driver_id, created_at")
        .eq("company_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ orders: orders || [] })
    }

    return NextResponse.json({ orders: [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
