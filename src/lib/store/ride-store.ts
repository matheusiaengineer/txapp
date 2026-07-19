"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface Coordinates {
  lat: number;
  lng: number;
}

export type RideStatus =
  | "idle"
  | "searching"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface CurrentRide {
  origin: Coordinates | null;
  destination: Coordinates | null;
  distance: number;
  price: number;
  status: RideStatus;
  driverId: string | null;
  driverName: string | null;
  driverLocation: Coordinates | null;
}

function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const x =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export interface RideState {
  isRequestingRide: boolean;
  currentRide: CurrentRide;
  location: Coordinates | null;

  setLocation: (coords: Coordinates) => void;
  setOrigin: (origin: Coordinates) => void;
  setDestination: (destination: Coordinates) => void;
  setDistance: (distance: number) => void;
  setPrice: (price: number) => void;
  setRequesting: (value: boolean) => void;
  setDriverFound: (driverId: string, driverName: string) => void;
  setDriverLocation: (location: Coordinates) => void;
  setRideStatus: (status: RideStatus) => void;
  requestRide: () => void;
  completeRide: () => void;
  cancelRide: () => void;
  resetRide: () => void;
  startLocationTracking: () => () => void;
  cleanup: () => void;
}

const initialRide: CurrentRide = {
  origin: null,
  destination: null,
  distance: 0,
  price: 0,
  status: "idle",
  driverId: null,
  driverName: null,
  driverLocation: null,
};

export const useRideStore = create<RideState>()(
  immer((set, get) => {
    let locationInterval: ReturnType<typeof setInterval> | null = null;

    return {
      isRequestingRide: false,
      currentRide: { ...initialRide },
      location: null,

      setLocation: (coords) =>
        set((state) => { state.location = coords; }),

      setOrigin: (origin) =>
        set((state) => {
          state.currentRide.origin = origin;
          if (state.currentRide.destination) {
            state.currentRide.distance = haversineDistance(origin, state.currentRide.destination);
          }
        }),

      setDestination: (destination) =>
        set((state) => {
          state.currentRide.destination = destination;
          if (state.currentRide.origin) {
            state.currentRide.distance = haversineDistance(state.currentRide.origin, destination);
          }
        }),

      setDistance: (distance) =>
        set((state) => { state.currentRide.distance = distance; }),

      setPrice: (price) =>
        set((state) => { state.currentRide.price = price; }),

      setRequesting: (value) =>
        set((state) => { state.isRequestingRide = value; }),

      setDriverFound: (driverId, driverName) =>
        set((state) => {
          state.currentRide.driverId = driverId;
          state.currentRide.driverName = driverName;
          state.currentRide.status = "en_route";
        }),

      setDriverLocation: (location) =>
        set((state) => { state.currentRide.driverLocation = location; }),

      setRideStatus: (status) =>
        set((state) => { state.currentRide.status = status; }),

      requestRide: () =>
        set((state) => {
          state.isRequestingRide = true;
          state.currentRide.status = "searching";
        }),

      completeRide: () =>
        set((state) => {
          state.isRequestingRide = false;
          state.currentRide = { ...initialRide };
        }),

      cancelRide: () =>
        set((state) => {
          state.isRequestingRide = false;
          state.currentRide = { ...initialRide };
        }),

      resetRide: () =>
        set((state) => {
          state.isRequestingRide = false;
          state.currentRide = { ...initialRide };
        }),

      startLocationTracking: () => {
        if (typeof window === "undefined") return () => {};
        locationInterval = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              set((state) => {
                state.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              });
            },
            () => {},
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 5000 }
          );
        }, 5000);
        return () => {
          if (locationInterval) clearInterval(locationInterval);
        };
      },

      cleanup: () => {
        if (locationInterval) clearInterval(locationInterval);
      },
    };
  })
);
