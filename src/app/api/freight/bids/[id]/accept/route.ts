import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: bid, error: bidError } = await supabase
    .from("bids")
    .select("load_id")
    .eq("id", id)
    .single();

  if (bidError || !bid) {
    return NextResponse.json({ error: "Lance não encontrado" }, { status: 404 });
  }

  const { data: load, error: loadError } = await supabase
    .from("loads")
    .select("status")
    .eq("id", bid.load_id)
    .single();

  if (loadError || !load) {
    return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
  }

  if (load.status !== "open") {
    return NextResponse.json({ error: "Carga não está mais aberta" }, { status: 400 });
  }

  const { error: acceptError } = await supabase
    .from("bids")
    .update({ status: "accepted" })
    .eq("id", id);

  if (acceptError) {
    return NextResponse.json({ error: acceptError.message }, { status: 500 });
  }

  const { error: loadUpdateError } = await supabase
    .from("loads")
    .update({ status: "in_progress", accepted_bid_id: id })
    .eq("id", bid.load_id);

  if (loadUpdateError) {
    return NextResponse.json({ error: loadUpdateError.message }, { status: 500 });
  }

  await supabase
    .from("bids")
    .update({ status: "rejected" })
    .eq("load_id", bid.load_id)
    .neq("id", id)
    .eq("status", "pending");

  return NextResponse.json({ success: true });
}