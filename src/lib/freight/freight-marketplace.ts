export interface FreightLoad {
  id: string;
  customer_id: string;
  origin_address: string;
  origin_lat?: number;
  origin_lng?: number;
  dest_address: string;
  dest_lat?: number;
  dest_lng?: number;
  description: string;
  weight_kg?: number;
  volume_m3?: number;
  vehicle_type: string;
  photos: string[];
  pickup_date?: string;
  delivery_date?: string;
  budget_min?: number;
  budget_max?: number;
  status: "open" | "in_progress" | "completed" | "cancelled";
  accepted_bid_id?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface FreightBid {
  id: string;
  load_id: string;
  transporter_id: string;
  amount: number;
  message?: string;
  estimated_days?: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  transporter_name?: string;
  transporter_rating?: number;
  transporter_photo?: string;
}

const COMMISSION_PERCENT = 15;

export function calculateCommission(bidAmount: number): {
  platformFee: number;
  transporterEarns: number;
} {
  const platformFee = bidAmount * (COMMISSION_PERCENT / 100);
  return {
    platformFee,
    transporterEarns: bidAmount - platformFee,
  };
}

export async function createLoad(
  data: Omit<FreightLoad, "id" | "customer_id" | "status" | "created_at" | "accepted_bid_id">
): Promise<{ load?: FreightLoad; error?: string }> {
  const res = await fetch("/api/freight/loads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getLoads(
  filters?: { status?: string; customer_id?: string }
): Promise<{ loads: FreightLoad[] }> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.customer_id) params.set("customer_id", filters.customer_id);
  const res = await fetch(`/api/freight/loads?${params}`);
  return res.json();
}

export async function getLoad(id: string): Promise<{ load?: FreightLoad; error?: string }> {
  const res = await fetch(`/api/freight/loads/${id}`);
  return res.json();
}

export async function createBid(
  loadId: string,
  amount: number,
  message?: string,
  estimatedDays?: number
): Promise<{ bid?: FreightBid; error?: string }> {
  const res = await fetch("/api/freight/bids", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ load_id: loadId, amount, message, estimated_days: estimatedDays }),
  });
  return res.json();
}

export async function getBids(loadId: string): Promise<{ bids: FreightBid[] }> {
  const res = await fetch(`/api/freight/bids?load_id=${loadId}`);
  return res.json();
}

export async function getMyBids(): Promise<{ bids: FreightBid[] }> {
  const res = await fetch("/api/freight/bids?mine=true");
  return res.json();
}

export async function acceptBid(bidId: string): Promise<{ success?: boolean; error?: string }> {
  const res = await fetch(`/api/freight/bids/${bidId}/accept`, { method: "PATCH" });
  return res.json();
}

export async function rejectBid(bidId: string): Promise<{ success?: boolean; error?: string }> {
  const res = await fetch(`/api/freight/bids/${bidId}/reject`, { method: "PATCH" });
  return res.json();
}
