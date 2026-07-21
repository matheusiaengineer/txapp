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
  const canRequestRide =
    !!currentRide.origin &&
    !!currentRide.destination &&
    !isRequestingRide &&
    hasSufficientFunds(estimatedCost);

  const handleRequestRide = useCallback(async () => {
    if (!canRequestRide) return;

    requestRide();

    const totalBalance = realBalance + promotionalBalance;
    const deductFromPromotional = Math.min(promotionalBalance, estimatedCost);
    const deductFromReal = estimatedCost - deductFromPromotional;

    useWalletStore.setState({
      promotionalBalance: promotionalBalance - deductFromPromotional,
      realBalance: realBalance - deductFromReal,
    });
  }, [canRequestRide, requestRide, realBalance, promotionalBalance, estimatedCost]);

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
    canRequestRide,
    handleRequestRide,
    handleCancelRide,
    setOrigin,
    setDestination,
    resetRide,
  };
}
