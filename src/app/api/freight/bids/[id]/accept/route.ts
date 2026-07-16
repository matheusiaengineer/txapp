import { NextRequest, NextResponse } from "next/server";

function getBids(): any[] {
  return (globalThis as any).__txd_freight_bids || [];
}

function setBids(data: any[]) {
  (globalThis as any).__txd_freight_bids = data;
}

function getLoads(): any[] {
  return (globalThis as any).__txd_freight_loads || [];
}

function setLoads(data: any[]) {
  (globalThis as any).__txd_freight_loads = data;
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

  const loads = getLoads();
  const load = loads.find((l: any) => l.id === bid.load_id);

  if (!load) {
    return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
  }

  if (load.status !== "open") {
    return NextResponse.json({ error: "Carga não está mais aberta" }, { status: 400 });
  }

  bid.status = "accepted";
  load.status = "in_progress";
  load.accepted_bid_id = bid.id;

  const otherBids = bids.filter((b: any) => b.load_id === bid.load_id && b.id !== id);
  for (const ob of otherBids) {
    if (ob.status === "pending") ob.status = "rejected";
  }

  setBids(bids);
  setLoads(loads);

  return NextResponse.json({ success: true });
}
