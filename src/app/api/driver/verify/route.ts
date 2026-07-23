import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      cnhNumber,
      cnhBase64,
      selfieBase64,
      vehicleCategory,
      licensePlate,
      brand,
      model,
      color,
      year,
      pricePerKm,
      similarityScore,
      cnhExtractedData,
    } = body;

    if (!cnhNumber || !cnhBase64 || !selfieBase64 || !vehicleCategory || !licensePlate || !pricePerKm) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Convert base64 to buffers
    const cnhBuffer = Buffer.from(cnhBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
    const selfieBuffer = Buffer.from(selfieBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");

    const timestamp = Date.now();
    const cnhPath = `${user.id}/cnh_${timestamp}.jpg`;
    const selfiePath = `${user.id}/selfie_${timestamp}.jpg`;

    // 2. Upload to private 'documents' bucket
    const [cnhUpload, selfieUpload] = await Promise.all([
      admin.storage.from("documents").upload(cnhPath, cnhBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      }),
      admin.storage.from("documents").upload(selfiePath, selfieBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      }),
    ]);

    if (cnhUpload.error) {
      return NextResponse.json({ error: `Erro ao enviar CNH: ${cnhUpload.error.message}` }, { status: 500 });
    }
    if (selfieUpload.error) {
      return NextResponse.json({ error: `Erro ao enviar Selfie: ${selfieUpload.error.message}` }, { status: 500 });
    }

    // 3. Determine status based on similarity score (auto-approve if similarity >= 0.75)
    const score = similarityScore || 0;
    const isAutoApproved = score >= 0.75;
    const verificationStatus = isAutoApproved ? "approved" : "pending";

    // 4. Save to public.documents table
    await Promise.all([
      admin.from("documents").insert({
        profile_id: user.id,
        type: "cnh",
        url: cnhPath,
        status: verificationStatus,
      }),
      admin.from("documents").insert({
        profile_id: user.id,
        type: "selfie",
        url: selfiePath,
        status: verificationStatus,
      }),
    ]);

    // 5. Upsert to public.driver_profiles
    const { error: driverProfileError } = await admin.from("driver_profiles").upsert({
      id: user.id,
      cpf: cnhExtractedData?.cpf || "00000000000",
      status: verificationStatus,
      birth_date: cnhExtractedData?.birthDate || null,
    });

    if (driverProfileError) {
      console.error("driver_profiles upsert error:", driverProfileError);
    }

    // 6. Upsert to public.vehicles
    const { error: vehicleError } = await admin.from("vehicles").upsert({
      driver_id: user.id,
      category: vehicleCategory,
      license_plate: licensePlate,
      brand: brand || "",
      model: model || "",
      color: color || "",
      year: year ? parseInt(year) : null,
    });

    if (vehicleError) {
      console.error("vehicles upsert error:", vehicleError);
    }

    // 7. Get category UUID to save pricing
    const { data: categoryData } = await admin
      .from("vehicle_categories")
      .select("id")
      .eq("name", vehicleCategory === "carro" ? "car" : vehicleCategory)
      .maybeSingle();

    // 8. Upsert pricing
    const { error: pricingError } = await admin.from("driver_pricing").upsert({
      driver_id: user.id,
      vehicle_category_id: categoryData?.id || null,
      service_type: vehicleCategory,
      min_price_per_km: parseFloat(pricePerKm),
      suggested_price_per_km: parseFloat(pricePerKm) * 1.2,
      min_trip_value: 0,
      is_active: true,
    }, {
      onConflict: "driver_id,service_type"
    });

    if (pricingError) {
      console.error("driver_pricing upsert error:", pricingError);
    }

    // 9. Update profiles table status
    await admin.from("profiles").update({
      cpf: cnhExtractedData?.cpf || null,
      cpf_verified: isAutoApproved,
    }).eq("id", user.id);

    return NextResponse.json({
      success: true,
      status: verificationStatus,
      similarityScore: score,
      autoApproved: isAutoApproved,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao processar verificação" }, { status: 500 });
  }
}
