-- Migration: Índices geoespaciais e performance
-- =========================================================================

-- Índice GIST para busca geoespacial no driver_heartbeats
CREATE INDEX IF NOT EXISTS idx_driver_heartbeats_location
  ON public.driver_heartbeats
  USING GIST (ll_to_earth(lat, lng));

-- Índice para busca por status + tempo (consulta mais frequente no nearby)
CREATE INDEX IF NOT EXISTS idx_driver_heartbeats_status_time
  ON public.driver_heartbeats (status, last_updated_at DESC);

-- Índice para busca de motoristas por empresa
CREATE INDEX IF NOT EXISTS idx_driver_profiles_company
  ON public.driver_profiles (company_id)
  WHERE company_id IS NOT NULL;

-- Índice para busca de cargas por status
CREATE INDEX IF NOT EXISTS idx_loads_status
  ON public.loads (status, created_at DESC);

-- Índice para busca de bids por carga
CREATE INDEX IF NOT EXISTS idx_bids_load
  ON public.bids (load_id, created_at DESC);

-- Índice para busca de bids por transportador
CREATE INDEX IF NOT EXISTS idx_bids_transporter
  ON public.bids (transporter_id, created_at DESC);

-- Índice para histórico de tracking por driver
CREATE INDEX IF NOT EXISTS idx_tracking_history_driver_time
  ON public.tracking_history (driver_id, recorded_at DESC);

-- Índice para busca de trips por passageiro
CREATE INDEX IF NOT EXISTS idx_trips_passenger
  ON public.trips (passenger_id, created_at DESC);

-- Índice para busca de trips por motorista
CREATE INDEX IF NOT EXISTS idx_trips_driver
  ON public.trips (driver_id, created_at DESC);

-- Necessário instalar a extensão cube para ll_to_earth
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
