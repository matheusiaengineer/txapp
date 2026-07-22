import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get("phone")
    const cpf = searchParams.get("cpf")

    if (!phone && !cpf) {
      return NextResponse.json({ error: "Informe phone ou cpf" }, { status: 400 })
    }

    const supabase = await createClient()
    const result: any = {}

    if (phone) {
      const { data: existingPhone } = await supabase
        .from("profiles")
        .select("id, is_banned")
        .eq("phone", phone)
        .maybeSingle()
      result.phoneAvailable = !existingPhone
      result.phoneMessage = existingPhone
        ? existingPhone.is_banned
          ? "Este celular esta bloqueado permanentemente"
          : "Este celular ja esta em uso"
        : "Celular disponivel"
    }

    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, "")
      if (cleanCpf.length !== 11) {
        result.cpfAvailable = false
        result.cpfMessage = "CPF invalido"
      } else {
        const { data: existingCpf } = await supabase
          .from("profiles")
          .select("id, is_banned")
          .eq("cpf", cleanCpf)
          .maybeSingle()
        result.cpfAvailable = !existingCpf
        result.cpfMessage = existingCpf
          ? existingCpf.is_banned
            ? "Este CPF esta bloqueado permanentemente"
            : "Este CPF ja esta em uso"
          : "CPF disponivel"
      }
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
