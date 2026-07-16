import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, role, metadata } = body;

    if (!action || !email || !password) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const supabase = await createClient();

    if (action === "signup") {
      // Cria o usuário já confirmado via Admin API (pula email de confirmação)
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

      // Faz login automático para gerar sessão
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return NextResponse.json({ error: signInError.message }, { status: 500 });
      }

      const userId = data.user.id;

      // Salvar perfil base
      await supabase.from("profiles").upsert({
        id: userId,
        email: data.user.email,
        role: role || "passenger",
        full_name: metadata?.full_name || "",
        phone: metadata?.phone || "",
        country: metadata?.country || "BR",
      });

      // Salvar dados específicos de motorista/transportador
      if (role === "driver" || role === "transporter") {
        await supabase.from("driver_profiles").upsert({
          id: userId,
          cpf: metadata?.cpf || "",
          birth_date: metadata?.birth_date || null,
          status: "pending",
        });

        if (metadata?.vehicle_plate) {
          await supabase.from("vehicles").upsert({
            driver_id: userId,
            category: metadata?.vehicle_category || "carro",
            license_plate: metadata?.vehicle_plate,
            brand: metadata?.vehicle_brand || "",
            model: metadata?.vehicle_model || "",
            color: metadata?.vehicle_color || "",
            year: metadata?.vehicle_year ? parseInt(metadata.vehicle_year) : null,
          });
        }
      }

      if (role === "employee" && metadata?.company_id) {
        await supabase.from("employee_profiles").upsert({
          id: userId,
          company_id: metadata.company_id,
          role: metadata.employee_role || "operator",
          department: metadata.department || "",
          is_active: true,
        });
      }

      if (role === "company") {
        await supabase.from("companies").upsert({
          id: userId,
          corporate_name: metadata?.corporate_name || "",
          trade_name: metadata?.trade_name || "",
          cnpj: metadata?.cnpj || "",
          responsible_name: metadata?.responsible_name || "",
          address: metadata?.company_address || "",
          status: "pending",
        });
      }

      return NextResponse.json({
        user: signInData.user,
        session: signInData.session,
        role: role || "passenger",
      });
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

      return NextResponse.json({
        user: data.user,
        session: data.session,
        role,
      });
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
