import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")

  const supabase = await createClient()

  let query = supabase
    .from("company_products")
    .select("*")
    .eq("company_id", id)
    .eq("is_active", true)

  if (category) {
    query = query.eq("category", category)
  }

  const { data, error } = await query.order("name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
