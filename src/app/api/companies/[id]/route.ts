import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: company, error } = await supabase
    .from("companies")
    .select("*, profiles!inner(full_name, email, avatar_url)")
    .eq("id", id)
    .single()

  if (error || !company) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
  }

  return NextResponse.json(company)
}
