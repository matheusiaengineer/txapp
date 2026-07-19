import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";

const rpId = process.env.VERCEL_URL || "localhost:3000";

const handler = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const supabase = await createClient();

    const { data: stored } = await supabase
      .from("biometric_credentials")
      .select("public_key, credential_id, counter")
      .eq("credential_id", body.id)
      .single();

    if (!stored) {
      return NextResponse.json({ error: "Credencial não encontrada" }, { status: 404 });
    }

    const { data: challengeData } = await supabase
      .from("biometric_credentials")
      .select("public_key")
      .eq("credential_id", "current-challenge")
      .single();

    const expectedChallenge = challengeData?.public_key
      ? JSON.parse(challengeData.public_key as string).currentChallenge
      : null;

    if (!expectedChallenge) {
      return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 400 });
    }

    const credential = JSON.parse(stored.public_key as string);

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: [
        `https://${rpId}`,
        `http://${rpId}`,
        "http://localhost:3000",
        "capacitor://localhost",
        "https://txap.vercel.app",
      ],
      expectedRPID: rpId,
      credential: {
        id: stored.credential_id,
        publicKey: credential.publicKey,
        counter: stored.counter,
        transports: ["internal"],
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "Verificação biométrica falhou" }, { status: 400 });
    }

    await supabase.from("biometric_credentials").update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    }).eq("credential_id", body.id);

    await supabase.from("biometric_credentials")
      .delete()
      .eq("credential_id", "current-challenge");

    const { data: credentialRecord } = await supabase
      .from("biometric_credentials")
      .select("user_id")
      .eq("credential_id", body.id)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", credentialRecord?.user_id)
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
    return NextResponse.json({ error: err.message || "Erro no login biométrico" }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'default');
