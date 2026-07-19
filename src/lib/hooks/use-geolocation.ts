"use client";

import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permission: "prompt" | "granted" | "denied" | "unavailable";
}

export function useGeolocation(options: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
} = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 30000,
    watch = false,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: true,
    error: null,
    permission: "prompt",
  });

  const updatePosition = useCallback((pos: GeolocationPosition) => {
    setState({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      loading: false,
      error: null,
      permission: "granted",
    });
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    let message = "Erro ao obter localização";
    if (err.code === 1) {
      message = "Permissão de localização negada. Ative nas configurações do dispositivo.";
    } else if (err.code === 2) {
      message = "Localização indisponível. Tente novamente.";
    } else if (err.code === 3) {
      message = "Tempo excedido ao obter localização. Verifique o GPS.";
    }
    setState(prev => ({
      ...prev,
      loading: false,
      error: message,
      permission: err.code === 1 ? "denied" : prev.permission,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: "Geolocalização não suportada neste dispositivo",
        permission: "unavailable",
      }));
      return;
    }

    navigator.permissions?.query({ name: "geolocation" }).then(result => {
      if (result.state === "denied") {
        setState(prev => ({
          ...prev,
          loading: false,
          error: "Permissão de localização negada. Ative nas configurações do dispositivo.",
          permission: "denied",
        }));
      }
      if (result.state === "granted") {
        setState(prev => ({ ...prev, permission: "granted" }));
      }
    }).catch(() => {});

    if (watch) {
      const id = navigator.geolocation.watchPosition(
        updatePosition,
        handleError,
        { enableHighAccuracy, timeout, maximumAge }
      );
      return () => navigator.geolocation.clearWatch(id);
    } else {
      navigator.geolocation.getCurrentPosition(
        updatePosition,
        handleError,
        { enableHighAccuracy, timeout, maximumAge }
      );
    }
  }, [watch, enableHighAccuracy, timeout, maximumAge, updatePosition, handleError]);

  const requestPermission = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setState(prev => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      updatePosition,
      handleError,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [updatePosition, handleError]);

  return { ...state, requestPermission };
}
