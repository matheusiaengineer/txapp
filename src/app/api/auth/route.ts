import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rl = await rateLimit(`auth:${ip}`, 5, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { action, email, password, role, metadata } = body;

    if (!action || !email || !password) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const cookiesToForward: { name: string; value: string; options?: any }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value);
              cookiesToForward.push({ name, value, options });
            });
          },
        },
      }
    );

    if (action === "signup") {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: role || "passenger", ...metadata },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (!data.user) {
        return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        await admin.auth.admin.deleteUser(data.user.id);
        return NextResponse.json({ error: signInError.message }, { status: 500 });
      }

      const userId = data.user.id;

      const { error: profileError } = await admin.from("profiles").upsert({
        id: userId,
        email: data.user.email,
        role: role || "passenger",
        full_name: metadata?.full_name || "",
        phone: metadata?.phone || "",
        country: metadata?.country || "BR",
      });
      if (profileError) {
        console.error("profile upsert error:", profileError);
      }

      if (role === "driver" || role === "transporter") {
        const { error: driverError } = await admin.from("driver_profiles").upsert({
          id: userId,
          cpf: metadata?.cpf || "",
          birth_date: metadata?.birth_date || null,
          status: "pending",
        });
        if (driverError) console.error("driver_profiles upsert error:", driverError);

        if (metadata?.vehicle_plate) {
          const { error: vehicleError } = await admin.from("vehicles").upsert({
            driver_id: userId,
            category: metadata?.vehicle_category || "carro",
            license_plate: metadata?.vehicle_plate,
            brand: metadata?.vehicle_brand || "",
            model: metadata?.vehicle_model || "",
            color: metadata?.vehicle_color || "",
            year: metadata?.vehicle_year ? parseInt(metadata.vehicle_year) : null,
          });
          if (vehicleError) console.error("vehicle upsert error:", vehicleError);
        }
      }

      if (role === "employee" && metadata?.company_id) {
        const { error: empError } = await admin.from("employee_profiles").upsert({
          id: userId,
          company_id: metadata.company_id,
          role: metadata.employee_role || "operator",
          department: metadata.department || "",
          is_active: true,
        });
        if (empError) console.error("employee_profiles upsert error:", empError);
      }

      if (role === "company") {
        const { error: companyError } = await admin.from("companies").upsert({
          id: userId,
          corporate_name: metadata?.corporate_name || "",
          trade_name: metadata?.trade_name || "",
          cnpj: metadata?.cnpj || "",
          responsible_name: metadata?.responsible_name || "",
          address: metadata?.company_address || "",
          status: "pending",
        });
        if (companyError) console.error("companies upsert error:", companyError);
      }

      const jsonRes = NextResponse.json({
        user: signInData.user,
        session: signInData.session,
        role: role || "passenger",
      });
      cookiesToForward.forEach(({ name, value, options }) =>
        jsonRes.cookies.set(name, value, options)
      );
      return jsonRes;
    }

    if (action === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }

      let role = "passenger";
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        if (profile?.role) {
          role = profile.role;
        }
      }

      const jsonRes = NextResponse.json({
        user: data.user,
        session: data.session,
        role,
      });
      cookiesToForward.forEach(({ name, value, options }) =>
        jsonRes.cookies.set(name, value, options)
      );
      return jsonRes;
    }

    if (action === "signout") {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
