import { NextRequest, NextResponse } from "next/server";

function getStorage(): any[] {
  return (globalThis as any).__txd_freight_loads || [];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loads = getStorage();
  const load = loads.find((l: any) => l.id === id);

  if (!load) {
    return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ load });
}
