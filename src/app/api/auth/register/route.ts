import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

const VALID_TYPES = ["passenger", "driver_moto", "driver_car", "business"] as const

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

    const { data: existingPhone } = await supabase.from("profiles").select("id, is_banned").eq("phone", phone).maybeSingle()
    if (existingPhone) {
      if (existingPhone.is_banned) {
        return NextResponse.json({ error: "Este celular esta bloqueado permanentemente" }, { status: 403 })
      }
      return NextResponse.json({ error: "Este celular ja esta em uso" }, { status: 409 })
    }

    const { data: existingCpf } = await supabase.from("profiles").select("id, is_banned").eq("cpf", cleanCpf).maybeSingle()
    if (existingCpf) {
      if (existingCpf.is_banned) {
        return NextResponse.json({ error: "Este CPF esta bloqueado permanentemente" }, { status: 403 })
      }
      return NextResponse.json({ error: "Este CPF ja esta em uso" }, { status: 409 })
    }

    if (deviceFingerprint) {
      const { data: bannedDevice } = await supabase.from("banned_devices").select("id").eq("device_fingerprint", deviceFingerprint).maybeSingle()
      if (bannedDevice) {
        return NextResponse.json({ error: "Dispositivo bloqueado" }, { status: 403 })
      }
    }

    const { data: existingEmail } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle()
    if (existingEmail) {
      return NextResponse.json({ error: "Email ja cadastrado" }, { status: 409 })
    }

    const { data: signups, error: signupError } = await supabase
      .from("signup_attempts_log")
      .select("id")
      .eq("ip_address", clientIp)
      .gte("attempted_at", new Date(Date.now() - 3600000).toISOString())

    if (!signupError && signups && signups.length >= 3) {
      return NextResponse.json({ error: "Muitas tentativas. Tente novamente em 1 hora." }, { status: 429 })
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
      user_metadata: { full_name: name, account_type: accountType, phone },
    })

    if (authError) {
      await supabase.from("signup_attempts_log").insert({
        ip_address: clientIp, phone, cpf: cleanCpf, device_fingerprint: deviceFingerprint, success: false,
      })
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 })
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authData.user.id,
      email,
      full_name: name,
      phone,
      cpf: cleanCpf,
      phone_verified: false,
      cpf_verified: false,
      account_type: accountType,
      device_fingerprint: deviceFingerprint,
      role: accountType === "business" ? "company" : accountType === "driver_moto" || accountType === "driver_car" ? "driver" : "passenger",
    })

    if (profileError) {
      await admin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    await supabase.from("signup_attempts_log").insert({
      ip_address: clientIp, phone, cpf: cleanCpf, device_fingerprint: deviceFingerprint, success: true,
    })

    return NextResponse.json({
      user: { id: authData.user.id, email: authData.user.email },
      message: "Conta criada com sucesso!",
      accountType,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
