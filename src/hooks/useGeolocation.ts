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
  const [state, setState] = useState<GeolocationState & { showSettingsPrompt?: boolean }>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
    showSettingsPrompt: false,
  })

  // Track if we've already shown the help prompt
  const [hasShownHelpPrompt, setHasShownHelpPrompt] = useState(false)

  const getLocation = useCallback((showSettingsPrompt = false) => {
    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: "Geolocalizacao nao suportada", loading: false }))
      return
    }
    
    // Don't show help prompt again if already shown
    if (hasShownHelpPrompt && showSettingsPrompt) {
      showSettingsPrompt = false
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    // Try to get location with high accuracy
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // ✅ SUCCESS: Store coordinates without settings prompt
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          showSettingsPrompt: false,
        })
        
        // Reset help prompt flag for future attempts
        setHasShownHelpPrompt(false)
      },
      (error) => {
        let message = ""
        let showSettingsButton = false
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            if (showSettingsPrompt && !hasShownHelpPrompt) {
              // 🤖 INTELIGENTE: First time asking, show detailed help
              message = "Permissao de localizacao negada. Vais precisar de permitir a localizacao no navegador para encontrares motoristas proximos, sem isso não podes solicitar corridas ou navegar no mapa."
              showSettingsButton = true
              setHasShownHelpPrompt(true)  // Mark as shown to avoid repeat
            } else if (showSettingsPrompt && hasShownHelpPrompt) {
              // ⏭️ JÁ MOSTROU AJUDA: Simples e direto
              message = "Permissao de localizacao negada"
              showSettingsButton = false
            } else {
              // ⏳ PRIMEIRA VEZ: Simples e direto  
              message = "Permissao de localizacao negada"
              showSettingsButton = false
            }
            break
          case error.POSITION_UNAVAILABLE: 
            message = "Localizacao indisponivel (GPS offline, tenta mais tarde)"
            showSettingsButton = false
            break
          case error.TIMEOUT: 
            message = "Tempo esgotado ao obter localizacao (verifica o sinal e tenta outra vez)"
            showSettingsButton = false
            break
          default: 
            message = "Erro inesperado ao obter localizacao"
            showSettingsButton = false
        }
        
        setState(prev => ({ 
          ...prev, 
          error: message, 
          loading: false,
          showSettingsPrompt: showSettingsButton
        }))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  }, [hasShownHelpPrompt])

  // Reset help prompt flag when location is successfully obtained
  useEffect(() => {
    if (state.latitude && state.longitude && state.loading === false) {
      setHasShownHelpPrompt(false)
    }
  }, [state.latitude, state.longitude, state.loading])

  const coords: [number, number] | null = state.latitude && state.longitude
    ? [state.latitude, state.longitude]
    : null

  useEffect(() => { getLocation() }, [getLocation])

  return { ...state, getLocation, coords }
}
