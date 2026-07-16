import { NextRequest, NextResponse } from "next/server";

const BIDS_KEY = "txd_freight_bids";

function getBids(): any[] {
  return (globalThis as any).__txd_freight_bids || [];
}

function setBids(data: any[]) {
  (globalThis as any).__txd_freight_bids = data;
}

function getLoads(): any[] {
  return (globalThis as any).__txd_freight_loads || [];
}

function getId(prefix: string): string {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get("x-user-id") || "anon";

    const load = getLoads().find((l: any) => l.id === body.load_id);
    if (!load) {
      return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
    }
    if (load.status !== "open") {
      return NextResponse.json({ error: "Carga não está mais aberta para lances" }, { status: 400 });
    }

    const bid = {
      id: getId("fb"),
      load_id: body.load_id,
      transporter_id: userId,
      amount: body.amount,
      message: body.message || "",
      estimated_days: body.estimated_days || null,
      status: "pending",
      created_at: new Date().toISOString(),
      transporter_name: body.transporter_name || "Transportador",
      transporter_rating: body.transporter_rating || 5.0,
      transporter_photo: body.transporter_photo || "",
    };

    const bids = getBids();
    bids.push(bid);
    setBids(bids);

    return NextResponse.json({ bid });
  } catch {
    return NextResponse.json({ error: "Erro ao criar lance" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const loadId = searchParams.get("load_id");
  const mine = searchParams.get("mine");
  const userId = request.headers.get("x-user-id") || "anon";

  let bids = getBids();

  if (loadId) {
    bids = bids.filter((b: any) => b.load_id === loadId);
  }
  if (mine === "true") {
    bids = bids.filter((b: any) => b.transporter_id === userId);
  }

  bids.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  for (const bid of bids) {
    const load = getLoads().find((l: any) => l.id === bid.load_id);
    if (load) {
      bid.load_description = load.description?.slice(0, 60);
      bid.load_origin = load.origin_address;
      bid.load_dest = load.dest_address;
      bid.load_vehicle = load.vehicle_type;
    }
  }

  return NextResponse.json({ bids });
}
