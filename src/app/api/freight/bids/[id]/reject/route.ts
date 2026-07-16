import { NextRequest, NextResponse } from "next/server";

function getBids(): any[] {
  return (globalThis as any).__txd_freight_bids || [];
}

function setBids(data: any[]) {
  (globalThis as any).__txd_freight_bids = data;
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const bids = getBids();
  const bid = bids.find((b: any) => b.id === id);

  if (!bid) {
    return NextResponse.json({ error: "Lance não encontrado" }, { status: 404 });
  }

  bid.status = "rejected";
  setBids(bids);

  return NextResponse.json({ success: true });
}
