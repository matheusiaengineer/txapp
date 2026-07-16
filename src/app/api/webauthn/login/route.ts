import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { credentialId, rawId, authenticatorData, signature, userHandle, clientDataJSON } = await req.json();

    const supabase = await createClient();

    const { data: credential } = await supabase
      .from("biometric_credentials")
      .select("user_id, public_key, counter")
      .eq("credential_id", credentialId)
      .single();

    if (!credential) {
      return NextResponse.json({ error: "Credencial não encontrada" }, { status: 404 });
    }

    await supabase.from("biometric_credentials").update({
      counter: (credential.counter || 0) + 1,
      last_used_at: new Date().toISOString(),
    }).eq("credential_id", credentialId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", credential.user_id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
