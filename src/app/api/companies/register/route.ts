import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const {
      corporateName, tradeName, cnpj, responsibleName,
      phone, whatsapp, address, lat, lng,
      serviceCategories, hasOwnDelivery, needsDeliveryPartner,
      deliveryZoneRadiusKm, coverImage,
    } = await req.json()

    if (!corporateName || !cnpj) {
      return NextResponse.json({ error: "Nome e CNPJ obrigatórios" }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .eq("id", user.id)
      .single()

    const companyData = {
      id: user.id,
      corporate_name: corporateName,
      trade_name: tradeName || corporateName,
      cnpj,
      responsible_name: responsibleName || "",
      address,
      phone,
      whatsapp,
      lat,
      lng,
      service_categories: serviceCategories || [],
      has_own_delivery: hasOwnDelivery ?? true,
      needs_delivery_partner: needsDeliveryPartner ?? false,
      delivery_zone_radius_km: deliveryZoneRadiusKm || 5,
      cover_image: coverImage,
      status: "approved",
    }

    let company
    if (existing) {
      const { data, error } = await supabase
        .from("companies")
        .update(companyData)
        .eq("id", user.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      company = data
    } else {
      const { data, error } = await supabase
        .from("companies")
        .insert(companyData)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      company = data

      await supabase.from("profiles").update({ role: "company" }).eq("id", user.id)
    }

    if (needsDeliveryPartner) {
      const { data: drivers } = await supabase
        .from("driver_profiles")
        .select("id")
        .eq("status", "approved")
        .limit(10)

      if (drivers) {
        for (const driver of drivers) {
          const { data: existing } = await supabase
            .from("company_delivery_partners")
            .select("id")
            .eq("company_id", user.id)
            .eq("driver_id", driver.id)
            .maybeSingle()
          if (!existing) {
            await supabase.from("company_delivery_partners").insert({
              company_id: user.id,
              driver_id: driver.id,
              commission_percent: 15.00,
            })
          }
        }
      }
    }

    return NextResponse.json(company, { status: existing ? 200 : 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data, error } = await supabase
    .from("companies")
    .select("*, company_subscriptions(*), company_subscription_plans(*)")
    .eq("id", user.id)
    .single()

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || null)
}
