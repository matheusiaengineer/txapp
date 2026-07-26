import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/payment/stripe-server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

export const dynamic = "force-dynamic"

const handler = async (req: NextRequest) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { email, country } = await req.json();
    const userId = user.id;

    if (!email) {
      return NextResponse.json({ error: "email obrigatório" }, { status: 400 });
    }

    const account = await getStripe().accounts.create({
      type: "express",
      country: country || "BR",
      email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
    });

    await supabase.from("profiles").update({
      stripe_connect_account_id: account.id,
    }).eq("id", userId);

    const link = await getStripe().accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://txap.vercel.app"}/dashboard/driver/kyc`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://txap.vercel.app"}/dashboard/driver`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: link.url,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'default');
