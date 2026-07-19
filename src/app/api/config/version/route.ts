import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "success",
    data: {
      min_version: "1.0.0",
      current_version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      message: "Forçar atualização se min_version > current_version",
    },
  });
}
