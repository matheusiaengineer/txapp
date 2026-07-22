import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { companyId, items, deliveryAddress, deliveryLat, deliveryLng, notes } = body

    if (!companyId || !items || !items.length || !deliveryAddress) {
      return NextResponse.json({ error: "companyId, items e deliveryAddress obrigatórios" }, { status: 400 })
    }

    const { data: products } = await supabase
      .from("company_products")
      .select("id, name, price")
      .in("id", items.map((i: any) => i.productId))

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "Produtos não encontrados" }, { status: 400 })
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]))
    let totalAmount = 0
    const orderItems = items.map((item: any) => {
      const product = productMap.get(item.productId)
      if (!product) return null
      const subtotal = product.price * item.quantity
      totalAmount += subtotal
      return { productId: product.id, name: product.name, price: product.price, quantity: item.quantity, subtotal }
    }).filter(Boolean)

    const { data: company } = await supabase
      .from("companies")
      .select("delivery_fee, min_order_value")
      .eq("id", companyId)
      .single()

    const deliveryFee = company?.delivery_fee || 0
    const minOrder = company?.min_order_value || 0

    if (totalAmount < minOrder) {
      return NextResponse.json({ error: `Pedido mínimo: R$ ${minOrder.toFixed(2)}` }, { status: 400 })
    }

    totalAmount += deliveryFee

    const { data: order, error } = await supabase
      .from("company_orders")
      .insert({
        customer_id: user.id,
        company_id: companyId,
        items: orderItems,
        total_amount: totalAmount,
        delivery_fee: deliveryFee,
        delivery_address: deliveryAddress,
        delivery_lat: deliveryLat || null,
        delivery_lng: deliveryLng || null,
        notes: notes || null,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(order, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("company_orders")
    .select("*, companies!inner(trade_name)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
