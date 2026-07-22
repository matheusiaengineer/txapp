"use client"

import { useState, useEffect, useCallback } from "react"

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  })

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: "Geolocalizacao nao suportada", loading: false }))
      return
    }
    setState(prev => ({ ...prev, loading: true, error: null }))
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        })
      },
      (error) => {
        let message = "Erro ao obter localizacao"
        switch (error.code) {
          case error.PERMISSION_DENIED: message = "Permissao de localizacao negada"; break
          case error.POSITION_UNAVAILABLE: message = "Localizacao indisponivel"; break
          case error.TIMEOUT: message = "Tempo esgotado"; break
        }
        setState(prev => ({ ...prev, error: message, loading: false }))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  useEffect(() => { getLocation() }, [getLocation])

  const coords: [number, number] | null = state.latitude && state.longitude
    ? [state.latitude, state.longitude]
    : null

  return { ...state, getLocation, coords }
}
