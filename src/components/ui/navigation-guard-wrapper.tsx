"use client";

import { NavigationGuard } from "@/components/ui/navigation-guard";

export function NavigationGuardWrapper() {
  return (
    <NavigationGuard
      blockBackRoutes={["/payment", "/ride"]}
      modalStates={[
        { modalName: "carSelection", paramKey: "carSelection" },
        { modalName: "negotiation", paramKey: "negotiation" },
      ]}
    />
  );
}
