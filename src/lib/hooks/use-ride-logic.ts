"use client";

import { useRideStore } from "@/lib/store/ride-store";
import { useWalletStore } from "@/lib/store/wallet-store";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function useRideLogic() {
  const {
    currentRide,
    isRequestingRide,
    setOrigin,
    setDestination,
    requestRide,
    resetRide,
  } = useRideStore();

  const { realBalance, promotionalBalance, hasSufficientFunds } = useWalletStore();
  const [pricePerKm, setPricePerKm] = useState(2500);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "global.price_per_km")
        .single();
      if (data?.value?.default) setPricePerKm(data.value.default);
    })();
  }, []);

  const estimatedCost = currentRide.distance * pricePerKm;

  const handleRequestRide = useCallback(async (params: {
    driver_id: string;
    from_lat: number;
    from_lng: number;
    to_lat: number;
    to_lng: number;
    from_address: string;
    to_address: string;
    vehicle_type: string;
    estimated_price: number;
  }) => {
    const result = await requestRide(params);
    return result;
  }, [requestRide]);

  const handleCancelRide = useCallback(async () => {
    resetRide();
  }, [resetRide]);

  return {
    origin: currentRide.origin,
    destination: currentRide.destination,
    distance: currentRide.distance,
    price: currentRide.price,
    status: currentRide.status,
    isRequestingRide,
    estimatedCost,
    handleRequestRide,
    handleCancelRide,
    setOrigin,
    setDestination,
    resetRide,
  };
}
