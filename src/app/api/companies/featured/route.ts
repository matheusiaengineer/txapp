import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const { data: companies, error } = await supabase
    .from("companies")
    .select("*")
    .eq("status", "approved")
    .order("priority_score", { ascending: false })
    .order("corporate_name", { ascending: true })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const featured = companies?.filter(c => c.is_featured) || []
  const normal = companies?.filter(c => !c.is_featured) || []

  return NextResponse.json({
    featured,
    normal,
    all: [...featured, ...normal],
  })
}
