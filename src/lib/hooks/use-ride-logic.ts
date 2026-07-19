"use client";

import { useRideStore } from "@/lib/store/ride-store";
import { useWalletStore } from "@/lib/store/wallet-store";
import { useCallback } from "react";

const PRICE_PER_KM = 2500;

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

  const estimatedCost = currentRide.distance * PRICE_PER_KM;
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
