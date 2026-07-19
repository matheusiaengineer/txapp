"use client";

import { createContext, useContext } from "react";
import type { DeviceInfo } from "./device-detect";

export const DeviceContext = createContext<DeviceInfo | null>(null);

export function useDevice(): DeviceInfo | null {
  return useContext(DeviceContext);
}

export function useIsLowEnd(): boolean {
  const device = useDevice();
  return device?.isLowEnd ?? false;
}