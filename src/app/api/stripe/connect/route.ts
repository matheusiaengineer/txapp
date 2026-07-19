import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/payment/stripe-server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const handler = async (req: NextRequest) => {
  try {
    const { userId, email, country } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "userId e email são obrigatórios" }, { status: 400 });
    }

    const supabase = await createClient();

    const account = await getStripe().accounts.create({
      type: "express",
      country: country || "BR",
      email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
    });

    await supabase.from("stripe_accounts").upsert({
      user_id: userId,
      stripe_account_id: account.id,
      status: "pending",
      created_at: new Date().toISOString(),
    });

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
