import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = formData.get("bucket") as string;
    const userId = formData.get("userId") as string;
    const docType = formData.get("docType") as string;

    if (!file || !bucket || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${docType}-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, 3600);

    return NextResponse.json({
      path: data.path,
      url: urlData?.signedUrl || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
