# NEXT TASK — TXAPP Development Phase

> **Project:** TXAPP — Global Ride-Hailing + Freight Platform
> **Stack:** Next.js 16, React 19, TypeScript Strict, Supabase, Stripe, Tailwind CSS 4, framer-motion
> **Target:** 4 countries (BR, US, PT, MX), 7 cities
> **Generated:** 2026-07-13
> **Core Directive:** Every business rule from DB. Every map call through Mobility Engine. Every component reusable glassmorphism dark theme.

---

## Table of Contents

1. [Current State](#current-state)
2. [Architecture Overview](#architecture-overview)
3. [FASE ATUAL](#fase-atual)
4. [PASSO 1 - Criar tabelas no Supabase](#passo-1)
5. [PASSO 2 - Atualizar Schema TypeScript](#passo-2)
6. [PASSO 3 - Atualizar Score Dispatch 3.0](#passo-3)
7. [PASSO 4 - Implementar Road Intelligence](#passo-4)
8. [PASSO 5 - Implementar Passenger AI](#passo-5)
9. [PASSO 6 - Implementar Freight Marketplace](#passo-6)
10. [PASSO 7 - Criar componentes de UI](#passo-7)
11. [PASSO 8 - Criar/Atualizar páginas](#passo-8)
12. [PASSO 9 - Performance](#passo-9)
13. [PASSO 10 - Testes e Validação](#passo-10)
14. [Regras de Ouro](#regras-de-ouro)
15. [Anexos](#anexos)

---

## Current State

### What exists today

The TXAPP platform has 22 pre-built modules covering frontend components, configuration files, and shared utilities. The platform is configured for 4 countries (Brazil, United States, Portugal, Mexico) with 7 fully configured cities (São Paulo, Rio de Janeiro, New York, Los Angeles, Lisbon, Porto, Mexico City).

### UI conventions

- All UI components use "use client" directive
- Dark theme via Tailwind CSS 4 dark mode
- Glassmorphism effect across all cards, modals, overlays
- bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl pattern
- Animations via framer-motion with spring physics
- Responsive: mobile-first, bottom sheets on mobile
- Icons via lucide-react, locale-aware translations, Portuguese default

### Global Config Engine

Per-city configuration:
- **Pricing**: base fare, per-km, per-minute, surge, minimum, cancellation, currency, time tiers
- **Vehicles**: 17 categories with capacity, dimensions, comfort, enabled
- **Documents**: required docs per role per city, validation, expiry
- **Payments**: methods per city, Stripe connect, commission splits

### Score Dispatch 3.0 (Current)

- Dispatcher class skeleton with event bus
- Driver scoring outline (proximity, rating, acceptance, earnings)
- Category filtering, search radius, offer timeout

### AI Service

- Price prediction, ETA prediction
- Sentiment analysis, content moderation
- Cancel risk prediction

### Mobility Engine

- Google Maps provider (directions, geocoding, autocomplete, distance matrix)
- Mapbox provider (navigation, isochrones, tilesets, terrain)
- Unified interface, provider fallback, city bounds

### Service Worker

- Offline queue, background sync, push notifications
- Cache-first static, network-first API

---

## Architecture Overview

---

### Directory Structure

```
src/
  app/                          # Next.js App Router
    (auth)/                     # Login, register, forgot password
    (marketing)/                # Landing, about, contact, pricing
    dashboard/
      passenger/home/           # Passenger home with AI greeting
      driver/map/               # Driver map with road events overlay
      admin/                    # Admin panel
      company/                  # Company freight management
  components/                   # Shared UI components
    ui/                         # Button, Input, Card, Modal, Toast, BottomSheet
    maps/                       # Map wrappers (Google, Mapbox)
    layout/                     # Navbar, Sidebar, Footer, AppShell
  lib/
    config/                     # Global Config Engine
      schema.ts                 # All TypeScript interfaces
      config-store.ts           # Zustand store
      pricing.ts                # Pricing calculator
      validation.ts             # Document validation
    dispatch/                   # Score Dispatch 3.0
      dispatcher.ts             # Main dispatcher class
      scorer.ts                 # Driver scoring algorithm
      offer.ts                  # Offer lifecycle management
      types.ts                  # Dispatch-specific types
    ai/                         # AI Service
      ai-service.ts             # Main service
      price-prediction.ts
      eta-prediction.ts
      cancel-risk.ts
    mobility/                   # Mobility Engine
      mobility-engine.ts        # Provider abstraction
      google-provider.ts
      mapbox-provider.ts
    road-intelligence/          # NEW - Passo 4
      road-intelligence-service.ts
      road-event-map.tsx
      road-event-report.tsx
      road-event-alert.tsx
    passenger-ai/               # NEW - Passo 5
      passenger-ai-service.ts
    freight/                    # NEW - Passo 6
      freight-marketplace.ts
      freight-categories.ts
      freight-tracking.ts
    supabase/                   # Supabase clients
      client.ts                 # Browser client
      admin-client.ts           # Server client
      realtime.ts               # Realtime helpers
    payments/                   # Stripe integration
    utils/                      # Shared utilities
  types/
    database.ts                 # Supabase row types

```


### Data Flow

```
User Action → Component (use client)
  → Server Action (if mutation) → Supabase write → Event Bus broadcast
  → API Route (if external) → AI / Mobility → Response → Component
  → Realtime Subscription (if live) → Component update directly

```


### State Management

- **Zustand**: global state (auth, config, ride session, freight session)
- **TanStack React Query**: server state (rides, freight loads, road events)
- **Supabase Realtime**: live subscriptions (locations, status, events)

---

## FASE ATUAL: Score Dispatch 3.0 + Road Intelligence + Passenger AI

### Objetivo Principal

Complete four major interconnected systems:

1. **Score Dispatch 3.0** - Connect to real Supabase with progressive radius expansion, batch dispatch, cancel risk AI
2. **Road Intelligence** - Collaborative event reporting with realtime, geofence alerts, map overlays
3. **Passenger AI** - Heuristic learning of preferences, contextual greetings, destination prediction
4. **Freight Marketplace** - Load publishing, bidding, tracking, 17 vehicle categories with validation

### ORDEM OBRIGATORIA - NUNCA PULAR ETAPAS

1. PASSO 1 - Criar tabelas no Supabase
2. PASSO 2 - Atualizar Schema TypeScript
3. PASSO 3 - Atualizar Score Dispatch 3.0
4. PASSO 4 - Implementar Road Intelligence
5. PASSO 5 - Implementar Passenger AI
6. PASSO 6 - Implementar Freight Marketplace
7. PASSO 7 - Criar componentes de UI
8. PASSO 8 - Criar/Atualizar paginas
9. PASSO 9 - Performance
10. PASSO 10 - Testes e Validacao

### Critical Constraints

- Every business rule from database (dispatcher_rules, pricing, commission)
- Every map call through Mobility Engine
- Never hardcode values - fetch from city configuration
- Components in src/components/
- Update .ai/CHANGELOG.md and .ai/ROADMAP.md after work
- All new React components use "use client"


---

## PASSO 1 - Criar tabelas no Supabase

### Descricao

Create 10 database tables with proper columns, types, constraints, indexes, foreign keys, RLS policies.

### Prerequisites

- Supabase project configured and linked
- `npx supabase link` executed
- profiles table exists
- PostGIS extension enabled
- handle_updated_at() function exists

### Migration files

```
supabase/migrations/20260713000001_create_rides.sql
supabase/migrations/20260713000002_create_ride_requests.sql
supabase/migrations/20260713000003_create_driver_locations.sql
supabase/migrations/20260713000004_create_dispatcher_rules.sql
supabase/migrations/20260713000005_create_driver_scores.sql
supabase/migrations/20260713000006_create_driver_ratings.sql
supabase/migrations/20260713000007_create_road_events.sql
supabase/migrations/20260713000008_create_passenger_preferences.sql
supabase/migrations/20260713000009_create_freight_loads.sql
supabase/migrations/20260713000010_create_freight_bids.sql

```


---

### 1.1 rides

```sql
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  category_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'searching'
    CHECK (status IN ('searching','accepted','started','completed','cancelled')),
  distance_km DOUBLE PRECISION,
  duration_min DOUBLE PRECISION,
  fare DECIMAL(12,2),
  commission DECIMAL(12,2),
  driver_earnings DECIMAL(12,2),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending','processing','completed','failed','refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  city_id TEXT NOT NULL
);

CREATE INDEX idx_rides_passenger_id ON public.rides(passenger_id);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_rides_created_at ON public.rides(created_at DESC);
CREATE INDEX idx_rides_city_id ON public.rides(city_id);

CREATE TRIGGER set_rides_updated_at BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "passenger_select" ON public.rides FOR SELECT
  USING (auth.uid() = passenger_id);
CREATE POLICY "passenger_insert" ON public.rides FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "passenger_update" ON public.rides FOR UPDATE
  USING (auth.uid() = passenger_id);
CREATE POLICY "driver_select_assigned" ON public.rides FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ride_requests
    WHERE ride_requests.ride_id = rides.id
    AND ride_requests.driver_id = auth.uid()
    AND ride_requests.status = 'accepted'));
CREATE POLICY "admin_all" ON public.rides FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

```


### 1.2 ride_requests

```sql
CREATE TABLE public.ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  factors JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','offered','accepted','rejected','timeout')),
  offered_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  cancel_risk JSONB DEFAULT '{}'
);

CREATE INDEX idx_ride_requests_ride_id ON public.ride_requests(ride_id);
CREATE INDEX idx_ride_requests_driver_id ON public.ride_requests(driver_id);
CREATE INDEX idx_ride_requests_status ON public.ride_requests(status);
CREATE INDEX idx_ride_requests_driver_status ON public.ride_requests(driver_id, status);
CREATE UNIQUE INDEX idx_ride_requests_active
  ON public.ride_requests(ride_id, driver_id) WHERE status IN ('pending','offered','accepted');

ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "driver_select" ON public.ride_requests FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "driver_update" ON public.ride_requests FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "system_insert" ON public.ride_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "passenger_select" ON public.ride_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.rides WHERE id = ride_requests.ride_id AND passenger_id = auth.uid()));

```


### 1.3 driver_locations

```sql
CREATE TABLE public.driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS
    (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY) STORED,
  accuracy INTEGER DEFAULT 0,
  speed DECIMAL(6,2) DEFAULT 0,
  battery_level INTEGER DEFAULT 100 CHECK (battery_level BETWEEN 0 AND 100),
  gps_accuracy INTEGER DEFAULT 0,
  is_online BOOLEAN NOT NULL DEFAULT false,
  category_ids TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_driver_locations_driver ON public.driver_locations(driver_id);
CREATE INDEX idx_driver_locations_online ON public.driver_locations(is_online) WHERE is_online = true;
CREATE INDEX idx_driver_locations_categories ON public.driver_locations USING GIN(category_ids);
CREATE TRIGGER set_driver_locations_updated_at BEFORE UPDATE ON public.driver_locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "driver_upsert" ON public.driver_locations FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "driver_update" ON public.driver_locations FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "public_read_online" ON public.driver_locations FOR SELECT USING (is_online = true);
CREATE POLICY "admin_read_all" ON public.driver_locations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','dispatcher')));

```


### 1.4 dispatcher_rules

```sql
CREATE TABLE public.dispatcher_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id TEXT NOT NULL,
  weight_name TEXT NOT NULL,
  weight_value INTEGER NOT NULL DEFAULT 50 CHECK (weight_value BETWEEN 0 AND 100),
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_dispatcher_rules_city_weight ON public.dispatcher_rules(city_id, weight_name);
CREATE INDEX idx_dispatcher_rules_city ON public.dispatcher_rules(city_id);
CREATE INDEX idx_dispatcher_rules_enabled ON public.dispatcher_rules(enabled) WHERE enabled = true;
CREATE TRIGGER set_dispatcher_rules_updated_at BEFORE UPDATE ON public.dispatcher_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.dispatcher_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON public.dispatcher_rules FOR SELECT USING (true);
CREATE POLICY "admin_insert" ON public.dispatcher_rules FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_update" ON public.dispatcher_rules FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_delete" ON public.dispatcher_rules FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

```


### 1.5 driver_scores

```sql
CREATE TABLE public.driver_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  factors JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_driver_scores_driver ON public.driver_scores(driver_id);
CREATE INDEX idx_driver_scores_score ON public.driver_scores(score DESC);
ALTER TABLE public.driver_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "driver_select" ON public.driver_scores FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "system_insert" ON public.driver_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_select" ON public.driver_scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','dispatcher')));

```


### 1.6 driver_ratings

```sql
CREATE TABLE public.driver_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  avg_rating DECIMAL(3,2) DEFAULT 0 CHECK (avg_rating BETWEEN 0 AND 5),
  total_ratings INTEGER NOT NULL DEFAULT 0,
  last_100_acceptance_rate DECIMAL(5,2) DEFAULT 0 CHECK (last_100_acceptance_rate BETWEEN 0 AND 100),
  last_100_cancellation_rate DECIMAL(5,2) DEFAULT 0 CHECK (last_100_cancellation_rate BETWEEN 0 AND 100),
  trips_completed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_driver_ratings_driver ON public.driver_ratings(driver_id);
CREATE INDEX idx_driver_ratings_rating ON public.driver_ratings(avg_rating DESC);
ALTER TABLE public.driver_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON public.driver_ratings FOR SELECT USING (true);
CREATE POLICY "system_insert" ON public.driver_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "system_update" ON public.driver_ratings FOR UPDATE USING (true);

```


### 1.7 road_events

```sql
CREATE TABLE public.road_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('accident','construction','road_closure',
    'hazard','speed_trap','traffic_jam','flooding','ice','debris',
    'police_checkpoint','road_work','lane_closure','pothole',
    'broken_traffic_light','animal_on_road','protest','event','other')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  description TEXT DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','dismissed','expired')),
  expires_at TIMESTAMPTZ,
  photos JSONB DEFAULT '[]'::jsonb,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  city_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_road_events_city ON public.road_events(city_id);
CREATE INDEX idx_road_events_status ON public.road_events(status);
CREATE INDEX idx_road_events_type ON public.road_events(event_type);
CREATE INDEX idx_road_events_severity ON public.road_events(severity);
CREATE INDEX idx_road_events_location ON public.road_events(lat, lng);
CREATE INDEX idx_road_events_expires ON public.road_events(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_road_events_active ON public.road_events(city_id, status, severity)
  WHERE status IN ('pending','verified');
CREATE TRIGGER set_road_events_updated_at BEFORE UPDATE ON public.road_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.road_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON public.road_events FOR SELECT
  USING (status IN ('pending','verified','expired'));
CREATE POLICY "user_insert" ON public.road_events FOR INSERT
  WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "reporter_update" ON public.road_events FOR UPDATE
  USING (auth.uid() = reported_by);
CREATE POLICY "admin_update" ON public.road_events FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

```


### 1.8 passenger_preferences

```sql
CREATE TABLE public.passenger_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  favorite_routes JSONB DEFAULT '[]'::jsonb,
  frequent_times JSONB DEFAULT '[]'::jsonb,
  favorite_drivers UUID[] DEFAULT '{}',
  favorite_categories TEXT[] DEFAULT '{}',
  preferred_payment TEXT,
  preferred_language TEXT,
  preferred_currency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_passenger_preferences_passenger ON public.passenger_preferences(passenger_id);
CREATE TRIGGER set_passenger_preferences_updated_at BEFORE UPDATE ON public.passenger_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.passenger_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "passenger_select" ON public.passenger_preferences FOR SELECT
  USING (auth.uid() = passenger_id);
CREATE POLICY "passenger_insert" ON public.passenger_preferences FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "passenger_update" ON public.passenger_preferences FOR UPDATE
  USING (auth.uid() = passenger_id);

```


### 1.9 freight_loads

```sql
CREATE TABLE public.freight_loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  origin_address TEXT NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  destination_address TEXT NOT NULL,
  category_id TEXT NOT NULL,
  weight_kg DECIMAL(10,2),
  volume_m3 DECIMAL(10,2),
  height_cm DECIMAL(8,2),
  width_cm DECIMAL(8,2),
  length_cm DECIMAL(8,2),
  requires_cnh TEXT,
  requires_insurance BOOLEAN NOT NULL DEFAULT false,
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','bidding','in_progress','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_freight_loads_company ON public.freight_loads(company_id);
CREATE INDEX idx_freight_loads_status ON public.freight_loads(status);
CREATE INDEX idx_freight_loads_category ON public.freight_loads(category_id);
CREATE INDEX idx_freight_loads_open ON public.freight_loads(status) WHERE status IN ('open','bidding');

ALTER TABLE public.freight_loads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_select" ON public.freight_loads FOR SELECT USING (auth.uid() = company_id);
CREATE POLICY "company_insert" ON public.freight_loads FOR INSERT WITH CHECK (auth.uid() = company_id);
CREATE POLICY "company_update" ON public.freight_loads FOR UPDATE USING (auth.uid() = company_id);
CREATE POLICY "driver_select_open" ON public.freight_loads FOR SELECT
  USING (status IN ('open','bidding'));
CREATE POLICY "admin_all" ON public.freight_loads FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

```


### 1.10 freight_bids

```sql
CREATE TABLE public.freight_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES public.freight_loads(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_freight_bids_load ON public.freight_bids(load_id);
CREATE INDEX idx_freight_bids_driver ON public.freight_bids(driver_id);
CREATE INDEX idx_freight_bids_status ON public.freight_bids(status);
CREATE INDEX idx_freight_bids_amount ON public.freight_bids(amount DESC);

ALTER TABLE public.freight_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "driver_select" ON public.freight_bids FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "driver_insert" ON public.freight_bids FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "company_select" ON public.freight_bids FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.freight_loads WHERE id = freight_bids.load_id AND company_id = auth.uid()));
CREATE POLICY "company_update" ON public.freight_bids FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.freight_loads WHERE id = freight_bids.load_id AND company_id = auth.uid()));

```


### 1.11 Enable Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.road_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.freight_loads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.freight_bids;

```


### 1.12 Verification

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  AND table_name IN ('rides','ride_requests','driver_locations','dispatcher_rules',
  'driver_scores','driver_ratings','road_events','passenger_preferences','freight_loads','freight_bids');
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'
  AND tablename IN ('rides','ride_requests','driver_locations','dispatcher_rules',
  'driver_scores','driver_ratings','road_events','passenger_preferences','freight_loads','freight_bids');

```


### 1.13 Generate Types

```bash
npx supabase gen types typescript --linked > src/lib/supabase/types.ts

```


### Checklist

- [ ] All 10 tables created with proper columns, types, constraints
- [ ] Foreign keys reference profiles table
- [ ] CHECK constraints for enum columns
- [ ] Indexes: B-tree, GIN for arrays, GiST for geography
- [ ] RLS policies scoped by role
- [ ] Realtime enabled for 6 tables
- [ ] handle_updated_at() trigger on all tables
- [ ] Types generated via supabase gen types


---

## PASSO 2 - Atualizar Schema TypeScript

### Description

Update src/lib/config/schema.ts with new interfaces. Create src/types/database.ts with Supabase row types.

### Ride

```typescript
export interface Ride {
  id: string; passenger_id: string;
  origin_lat: number; origin_lng: number;
  destination_lat: number; destination_lng: number;
  category_id: string;
  status: RideStatus;
  distance_km: number | null; duration_min: number | null;
  fare: number | null; commission: number | null; driver_earnings: number | null;
  payment_method: string | null; payment_status: PaymentStatus;
  created_at: string; updated_at: string; city_id: string;
}
export type RideStatus = 'searching' | 'accepted' | 'started' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
```


### RideRequest

```typescript
export interface RideRequest {
  id: string; ride_id: string; driver_id: string;
  score: number; factors: Record<string, number>;
  status: RideRequestStatus;
  offered_at: string | null; responded_at: string | null;
  cancel_risk: CancelRisk | null;
}
export type RideRequestStatus = 'pending' | 'offered' | 'accepted' | 'rejected' | 'timeout';
export interface CancelRisk {
  probability: number;
  factors: { passenger_history: number; time_of_day: number; location: number; weather: number; driver_rating: number; };
  risk_level: 'low' | 'medium' | 'high';
}
```


### DriverLocation

```typescript
export interface DriverLocation {
  id: string; driver_id: string;
  lat: number; lng: number; location: unknown;
  accuracy: number; speed: number; battery_level: number; gps_accuracy: number;
  is_online: boolean; category_ids: string[]; updated_at: string;
}
export interface NearbyDriver extends DriverLocation {
  distance_km: number; score?: number;
}
```


### DispatcherRule

```typescript
export interface DispatcherRule {
  id: string; city_id: string;
  weight_name: DispatcherWeightName;
  weight_value: number; enabled: boolean; priority: number;
  created_at: string; updated_at: string;
}
export type DispatcherWeightName =
  | 'proximity' | 'rating' | 'acceptance_rate' | 'cancellation_rate'
  | 'earnings_balance' | 'trips_completed' | 'experience_months' | 'battery_level'
  | 'speed_consistency' | 'category_match' | 'previous_cancellations'
  | 'current_ride_distance' | 'online_time' | 'peak_time_multiplier' | 'passenger_preference';
```


### DriverScore

```typescript
export interface DriverScore {
  id: string; driver_id: string;
  score: number; factors: Record<string, number>; calculated_at: string;
}
```


### DriverRating

```typescript
export interface DriverRating {
  id: string; driver_id: string;
  avg_rating: number; total_ratings: number;
  last_100_acceptance_rate: number; last_100_cancellation_rate: number;
  trips_completed: number; updated_at: string;
}
```


### RoadEvent

```typescript
export interface RoadEvent {
  id: string; event_type: RoadEventType;
  lat: number; lng: number; description: string;
  severity: RoadEventSeverity;
  reported_by: string; verified_by: string | null;
  status: RoadEventStatus;
  expires_at: string | null; photos: string[];
  upvotes: number; downvotes: number;
  city_id: string; created_at: string; updated_at: string;
}
export type RoadEventType = 'accident' | 'construction' | 'road_closure' | 'hazard'
  | 'speed_trap' | 'traffic_jam' | 'flooding' | 'ice' | 'debris'
  | 'police_checkpoint' | 'road_work' | 'lane_closure' | 'pothole'
  | 'broken_traffic_light' | 'animal_on_road' | 'protest' | 'event' | 'other';
export type RoadEventSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RoadEventStatus = 'pending' | 'verified' | 'dismissed' | 'expired';
```


### PassengerPreference

```typescript
export interface PassengerPreference {
  id: string; passenger_id: string;
  favorite_routes: FavoriteRoute[]; frequent_times: FrequentTime[];
  favorite_drivers: string[]; favorite_categories: string[];
  preferred_payment: string | null; preferred_language: string | null; preferred_currency: string | null;
  created_at: string; updated_at: string;
}
export interface FavoriteRoute {
  origin_lat: number; origin_lng: number;
  origin_address?: string;
  destination_lat: number; destination_lng: number;
  destination_address?: string;
  label: string; frequency: number;
  times_of_day: string[]; days_of_week: number[]; last_used: string;
}
export interface FrequentTime {
  day_of_week: number; hour: number; minute: number;
  activity: 'work' | 'leisure' | 'home' | 'study' | 'other';
  probability: number; label?: string;
}
```


### FreightLoad

```typescript
export interface FreightLoad {
  id: string; company_id: string;
  title: string; description: string;
  origin_lat: number; origin_lng: number; origin_address: string;
  destination_lat: number; destination_lng: number; destination_address: string;
  category_id: FreightCategoryId;
  weight_kg: number | null; volume_m3: number | null;
  height_cm: number | null; width_cm: number | null; length_cm: number | null;
  requires_cnh: CnhType | null; requires_insurance: boolean;
  budget_min: number | null; budget_max: number | null;
  status: FreightLoadStatus;
  created_at: string; expires_at: string | null;
}
export type FreightLoadStatus = 'open' | 'bidding' | 'in_progress' | 'completed' | 'cancelled';
```


### FreightBid

```typescript
export interface FreightBid {
  id: string; load_id: string; driver_id: string;
  amount: number; message: string;
  status: FreightBidStatus; created_at: string;
}
export type FreightBidStatus = 'pending' | 'accepted' | 'rejected';
```


### FreightCategoryId and FreightCategorySpec

```typescript
export type FreightCategoryId =
  | 'moto' | 'bike' | 'carro' | 'suv' | 'pickup' | 'van' | 'hr'
  | '3_4' | 'toco' | 'truck' | 'bitrem' | 'carreta' | 'guincho'
  | 'munck' | 'cacamba' | 'trator' | 'maquinas_agricolas';
export type CnhType = 'A' | 'B' | 'C' | 'D' | 'E' | 'ACC';
export interface FreightCategorySpec {
  id: FreightCategoryId; label: string; label_pt: string; label_es: string;
  max_weight_kg: number; max_volume_m3: number;
  max_height_cm: number; max_width_cm: number; max_length_cm: number;
  required_cnh: CnhType | null; requires_insurance: boolean;
  icon: string; description: string;
}
export const FREIGHT_CATEGORIES: FreightCategorySpec[] = [ ... ];
```


### 2.2 src/types/database.ts

```typescript
import type { Database } from '@/lib/supabase/types';
export type Tables = Database['public']['Tables'];
export type RideRow = Tables['rides']['Row'];
export type RideInsert = Tables['rides']['Insert'];
export type RideUpdate = Tables['rides']['Update'];
// ... same pattern for all 10 tables
```



---

## PASSO 3 - Atualizar Score Dispatch 3.0

### 3.1 dispatcher.ts

```typescript
import { createClient } from '@/lib/supabase/client';
import { Scorer } from './scorer';
import { OfferManager } from './offer';
import type { Ride, RideRequest, NearbyDriver, DispatcherRule, CancelRisk } from '@/lib/config/schema';

export const DEFAULT_DISPATCH_CONFIG = {
  initialRadiusKm: 2, maxRadiusKm: 20,
  radiusExpansionStepKm: 1, radiusExpansionIntervalMs: 2000,
  maxDriversPerBatch: 10, offerTimeoutMs: 30000, maxConcurrentOffers: 5,
};

export class Dispatcher {
  private supabase = createClient();
  private scorer = new Scorer();
  private offerManager = new OfferManager();
  private config = DEFAULT_DISPATCH_CONFIG;
  private rules: DispatcherRule[] = [];
  private abortController: AbortController | null = null;

  async initialize(cityId: string) {
    const { data } = await this.supabase
      .from('dispatcher_rules').select('*')
      .eq('city_id', cityId).eq('enabled', true)
      .order('priority', { ascending: false });
    this.rules = data || [];
    this.scorer.setRules(this.rules);
  }

  async dispatchRide(ride: Ride) {
    this.abortController = new AbortController();
    try {
      await this.initialize(ride.city_id);
      const drivers = await this.findDriversWithExpansion(
        ride.origin_lat, ride.origin_lng, ride.category_id);
      if (!drivers.length) return { success: false, error: 'Nenhum motorista disponivel' };
      const scored = await this.scorer.scoreDrivers(drivers, ride);
      await this.saveScores(scored);
      const top = scored.slice(0, this.config.maxConcurrentOffers);
      const risks = await this.calcCancelRisks(top, ride);
      const requests = await this.createRequests(ride.id, top, risks);
      const accepted = await this.sendOffersWithRace(requests);
      if (accepted) {
        await this.acceptRide(ride.id, accepted.driver_id);
        return { success: true, driverId: accepted.driver_id };
      }
      return { success: false, error: 'Nenhum motorista aceitou' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private async findDriversWithExpansion(lat: number, lng: number, catId: string) {
    let radius = this.config.initialRadiusKm;
    const all: NearbyDriver[] = [];
    const seen = new Set<string>();
    while (radius <= this.config.maxRadiusKm) {
      const drivers = await this.queryDrivers(lat, lng, radius, catId);
      for (const d of drivers) {
        if (!seen.has(d.driver_id)) { seen.add(d.driver_id); all.push(d); }
      }
      if (all.length >= this.config.maxDriversPerBatch) break;
      radius += this.config.radiusExpansionStepKm;
      await new Promise(r => setTimeout(r, this.config.radiusExpansionIntervalMs));
    }
    return all;
  }

  private async queryDrivers(lat: number, lng: number, radiusKm: number, catId: string) {
    const dLat = radiusKm / 111;
    const dLng = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
    const { data } = await this.supabase
      .from('driver_locations').select('*')
      .eq('is_online', true).overlaps('category_ids', [catId])
      .gte('lat', lat - dLat).lte('lat', lat + dLat)
      .gte('lng', lng - dLng).lte('lng', lng + dLng);
    return (data || []).map(d => ({ ...d, distance_km: this.haversine(lat, lng, d.lat, d.lng) }))
      .filter(d => d.distance_km <= radiusKm).sort((a, b) => a.distance_km - b.distance_km);
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  private async saveScores(drivers: Array<{driver_id: string; score: number; factors: any}>) {
    await this.supabase.from('driver_scores').upsert(
      drivers.map(d => ({ driver_id: d.driver_id, score: d.score, factors: d.factors })),
      { onConflict: 'driver_id' });
  }

  private async calcCancelRisks(drivers: any[], ride: Ride) {
    const map = new Map();
    try {
      const { AIService } = await import('@/lib/ai/ai-service');
      const ai = new AIService();
      for (const d of drivers) {
        map.set(d.driver_id, await ai.predictCancelRisk({
          passengerId: ride.passenger_id, driverId: d.driver_id,
          originLat: ride.origin_lat, originLng: ride.origin_lng,
          destinationLat: ride.destination_lat, destinationLng: ride.destination_lng,
          timeOfDay: new Date().getHours(), dayOfWeek: new Date().getDay(),
          categoryId: ride.category_id,
        }));
      }
    } catch {
      for (const d of drivers) {
        map.set(d.driver_id, { probability: 0.1, factors: {}, risk_level: 'low' });
      }
    }
    return map;
  }

  private async createRequests(rideId: string, drivers: any[], risks: Map<string, any>) {
    const { data } = await this.supabase.from('ride_requests').insert(
      drivers.map(d => ({
        ride_id: rideId, driver_id: d.driver_id,
        score: d.score, factors: d.factors, status: 'pending',
        cancel_risk: risks.get(d.driver_id) || {},
      }))).select();
    return data || [];
  }

  private sendOffersWithRace(requests: RideRequest[]) {
    return Promise.race(
      requests.map(r => this.offerManager.sendOffer(r, this.config.offerTimeoutMs))
    );
  }

  private async acceptRide(rideId: string, driverId: string) {
    await this.supabase.from('rides').update({ status: 'accepted' }).eq('id', rideId);
    await this.supabase.from('ride_requests')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('ride_id', rideId).eq('driver_id', driverId);
    await this.supabase.from('ride_requests')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('ride_id', rideId).neq('driver_id', driverId)
      .in('status', ['pending', 'offered']);
    window.dispatchEvent(new CustomEvent('ride.accepted', { detail: { rideId, driverId } }));
  }

  cancel() { this.abortController?.abort(); }
}
```


### 3.2 Dispatch Flow

```
ride.create
  -> dispatcher.dispatchRide(ride)
    -> Load rules from dispatcher_rules table
    -> Query driver_locations for online + category match
    -> Expand radius progressively (2km -> 20km)
    -> Score each driver using weighted rules
    -> Save scores to driver_scores table
    -> Calculate cancel risk via AI Service
    -> Create ride_requests (status: pending)
    -> Send offers concurrently via Promise.race
    -> First driver to accept wins
    -> Update ride status, reject others
    -> Log to event bus

```



---

## PASSO 4 - Implementar Road Intelligence

### 4.1 road-intelligence-service.ts

```typescript
export class RoadIntelligenceService {
  private supabase = createClient();
  private channels = new Map<string, RealtimeChannel>();
  private lastReportTimes = new Map<string, number>();

  async reportEvent(event: Omit<RoadEventInsert, 'id' | 'created_at' | 'updated_at'>) {
    // Rate limit: 1 report per minute per user
    const last = this.lastReportTimes.get(event.reported_by) || 0;
    if (Date.now() - last < 60000) {
      return { success: false, error: 'Aguarde 1 minuto entre reports' };
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await this.supabase
      .from('road_events').insert({ ...event, expires_at: expiresAt }).select().single();
    if (error) return { success: false, error: error.message };
    this.lastReportTimes.set(event.reported_by, Date.now());
    return { success: true, data };
  }

  async getActiveEvents(params: {
    cityId: string; swLat: number; swLng: number;
    neLat: number; neLng: number;
    eventTypes?: RoadEventType[]; severity?: RoadEventSeverity[];
  }) {
    let q = this.supabase.from('road_events').select('*')
      .eq('city_id', params.cityId)
      .in('status', ['pending', 'verified'])
      .gte('lat', params.swLat).lte('lat', params.neLat)
      .gte('lng', params.swLng).lte('lng', params.neLng);
    if (params.eventTypes?.length) q = q.in('event_type', params.eventTypes);
    if (params.severity?.length) q = q.in('severity', params.severity);
    const { data } = await q.order('created_at', { ascending: false });
    return data || [];
  }

  async getEventsNearLocation(lat: number, lng: number, radiusKm: number, cityId: string) {
    const dLat = radiusKm / 111;
    const dLng = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
    return this.getActiveEvents({
      cityId, swLat: lat-dLat, swLng: lng-dLng, neLat: lat+dLat, neLng: lng+dLng,
    });
  }

  async verifyEvent(eventId: string, isUpvote: boolean) {
    const { data: ev } = await this.supabase
      .from('road_events').select('upvotes, downvotes, status').eq('id', eventId).single();
    if (!ev) return;
    const updates: any = {
      upvotes: ev.upvotes + (isUpvote ? 1 : 0),
      downvotes: ev.downvotes + (isUpvote ? 0 : 1),
    };
    if (updates.upvotes >= 5 && ev.status === 'pending') {
      updates.status = 'verified';
    }
    await this.supabase.from('road_events').update(updates).eq('id', eventId);
  }

  async expireOldEvents() {
    const { data } = await this.supabase
      .from('road_events')
      .update({ status: 'expired' })
      .in('status', ['pending', 'verified'])
      .lt('expires_at', new Date().toISOString())
      .select();
    return data?.length || 0;
  }

  subscribeToEvents(cityId: string, callback: (e: RoadEvent) => void) {
    const channel = this.supabase
      .channel(`road_events_${cityId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'road_events', filter: `city_id=eq.${cityId}` },
        (p) => callback(p.new as RoadEvent))
      .subscribe();
    this.channels.set(`road_events_${cityId}`, channel);
    return () => { channel.unsubscribe(); this.channels.delete(`road_events_${cityId}`); };
  }

  subscribeToDriverZone(driverId: string, lat: number, lng: number, radiusKm: number, cb: (e: RoadEvent[]) => void) {
    const channel = this.supabase
      .channel(`driver_zone_${driverId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'road_events' },
        (p) => {
          const e = p.new as RoadEvent;
          if (this.haversine(lat, lng, e.lat, e.lng) <= radiusKm) cb([e]);
        })
      .subscribe();
    this.channels.set(`driver_zone_${driverId}`, channel);
    return () => { channel.unsubscribe(); this.channels.delete(`driver_zone_${driverId}`); };
  }

  cleanup() {
    for (const ch of this.channels.values()) ch.unsubscribe();
    this.channels.clear();
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
}
```


### 4.2 Event Types Table

| Type | Icon | Default Severity | Description |
|------|------|-----------------|-------------|
| accident | 🚗💥 | high | Traffic accident |
| construction | 🚧 | medium | Road construction |
| road_closure | ⛔ | critical | Road completely closed |
| hazard | ⚠️ | medium | General hazard |
| speed_trap | 📸 | low | Police speed trap |
| traffic_jam | 🚙🚙🚙 | medium | Traffic congestion |
| flooding | 🌊 | high | Flooded road |
| ice | 🧊 | high | Icy road conditions |
| debris | 🗑️ | low | Debris on road |
| police_checkpoint | 👮 | medium | Police checkpoint |
| road_work | 🔧 | low | Road maintenance |
| lane_closure | 🚦 | medium | Lane closure |
| pothole | 🕳️ | low | Pothole on road |
| broken_traffic_light | 🔴 | medium | Traffic light out |
| animal_on_road | 🐾 | medium | Animals on road |
| protest | 📢 | medium | Protest/demonstration |
| event | 🎉 | low | Public event |
| other | ❓ | low | Unclassified |


---

## PASSO 5 - Implementar Passenger AI

### 5.1 passenger-ai-service.ts

```typescript
export class PassengerAIService {
  private supabase = createClient();
  private cache = new Map<string, PassengerPreference>();

  async loadPrefs(passengerId: string) {
    const cached = this.cache.get(passengerId);
    if (cached) return cached;
    const result = await this.supabase
      .from('passenger_preferences').select('*').eq('passenger_id', passengerId).single();
    let prefs = result.data;
    if (!prefs) {
      const ins = await this.supabase
        .from('passenger_preferences')
        .insert({ passenger_id: passengerId })
        .select().single();
      prefs = ins.data;
    }
    if (prefs) this.cache.set(passengerId, prefs);
    return prefs;
  }

  async detectFavoriteRoutes(passengerId: string) {
    const { data: rides } = await this.supabase
      .from('rides').select('*')
      .eq('passenger_id', passengerId).eq('status', 'completed')
      .order('created_at', { ascending: false }).limit(100);
    if (!rides || rides.length < 3) return [];

    const groups = new Map<string, typeof rides>();
    const TOL = 0.001;
    for (const r of rides) {
      const k = `${Math.round(r.origin_lat/TOL)},${Math.round(r.origin_lng/TOL)}-${Math.round(r.destination_lat/TOL)},${Math.round(r.destination_lng/TOL)}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(r);
    }

    const favorites: FavoriteRoute[] = [];
    for (const [, group] of groups) {
      if (group.length >= 3) {
        const latest = group.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        favorites.push({
          origin_lat: latest.origin_lat, origin_lng: latest.origin_lng,
          destination_lat: latest.destination_lat, destination_lng: latest.destination_lng,
          label: `Rota ${latest.id.slice(0,4)}`, frequency: group.length,
          times_of_day: [...new Set(group.map(r => new Date(r.created_at).getHours() + ':00'))],
          days_of_week: [...new Set(group.map(r => new Date(r.created_at).getDay()))],
          last_used: latest.created_at,
        });
      }
    }
    return favorites.sort((a,b) => b.frequency - a.frequency);
  }

  async detectFrequentTimes(passengerId: string) {
    const { data: rides } = await this.supabase
      .from('rides').select('*')
      .eq('passenger_id', passengerId).eq('status', 'completed')
      .limit(100);
    if (!rides || rides.length < 5) return [];

    const groups = new Map<string, number>();
    for (const r of rides) {
      const d = new Date(r.created_at);
      const k = `${d.getDay()}-${d.getHours()}`;
      groups.set(k, (groups.get(k) || 0) + 1);
    }

    const times: FrequentTime[] = [];
    for (const [k, count] of groups) {
      const prob = count / rides.length;
      if (prob >= 0.1) {
        const [day, hour] = k.split('-').map(Number);
        times.push({
          day_of_week: day, hour, minute: 0,
          activity: this.inferActivity(day, hour),
          probability: Math.round(prob * 100) / 100,
        });
      }
    }
    return times.sort((a,b) => b.probability - a.probability);
  }

  async generateGreeting(passengerId: string, name: string) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const prefs = await this.loadPrefs(passengerId);

    const timeGreeting = hour < 6 ? 'Boa madrugada' : hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    const matchTime = prefs.frequent_times?.find(t => t.day_of_week === day && t.hour === hour);
    if (matchTime) {
      const labels = { work: 'trabalho', home: 'casa', study: 'faculdade', leisure: 'sair' };
      return `${timeGreeting}, ${name}! Deseja ir para o ${labels[matchTime.activity] || 'seu destino'}?`;
    }

    const matchRoute = prefs.favorite_routes?.find(r =>
      r.days_of_week.includes(day) && r.times_of_day.some(t => parseInt(t) === hour)
    );
    if (matchRoute) return `${timeGreeting}, ${name}! Deseja ir para ${matchRoute.label}?`;

    return `${timeGreeting}, ${name}! Para onde deseja ir?`;
  }

  async predictDestination(context: { passengerId: string; currentHour: number; currentDayOfWeek: number; currentLat?: number; currentLng?: number }) {
    const prefs = await this.loadPrefs(context.passengerId);
    const matchRoute = prefs.favorite_routes?.find(r =>
      r.days_of_week.includes(context.currentDayOfWeek) &&
      r.times_of_day.some(t => parseInt(t) === context.currentHour)
    );
    if (matchRoute) return { destinationLat: matchRoute.destination_lat, destinationLng: matchRoute.destination_lng, label: matchRoute.label, confidence: 0.8 };
    if (context.currentLat && context.currentLng) {
      for (const r of prefs.favorite_routes || []) {
        const d = this.haversine(context.currentLat, context.currentLng, r.origin_lat, r.origin_lng);
        if (d < 0.2) return { destinationLat: r.destination_lat, destinationLng: r.destination_lng, label: r.label, confidence: 0.6 };
      }
    }
    return null;
  }

  async learnFromRide(ride: Ride) {
    const routes = await this.detectFavoriteRoutes(ride.passenger_id);
    const times = await this.detectFrequentTimes(ride.passenger_id);
    await this.supabase.from('passenger_preferences').update({
      favorite_routes: routes, frequent_times: times, updated_at: new Date().toISOString(),
    }).eq('passenger_id', ride.passenger_id);
    this.cache.delete(ride.passenger_id);
  }

  private inferActivity(day: number, hour: number): FrequentTime['activity'] {
    if (day >= 1 && day <= 5 && hour >= 6 && hour <= 9) return 'work';
    if (day >= 1 && day <= 5 && hour >= 17 && hour <= 20) return 'home';
    if ((day === 0 || day === 6) && hour >= 20) return 'leisure';
    if ((day === 0 || day === 6) && hour >= 8 && hour <= 12) return 'leisure';
    return 'other';
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
}
```


### 5.2 Passenger AI Learning Flow

```
Ride completes
  -> passenger-ai-service.learnFromRide()
    -> detectFavoriteRoutes() - group similar origins/destinations (100m tolerance)
    -> detectFrequentTimes() - identify day/hour patterns (>10% frequency)
    -> Update passenger_preferences table
  -> Next ride request
    -> generateGreeting() - "Bom dia, Joao! Deseja ir para o trabalho?"
    -> predictDestination() - suggest destination based on time/location

```


### 5.3 Heuristic Rules

- **Favorite Routes**: origin-destination pair appears 3+ times in last 100 rides, within 100m tolerance
- **Frequent Times**: day+hour slot accounts for 10%+ of all rides
- **Greeting**: time-of-day + detected activity (work/home/leisure/study)
- **Prediction**: matches current time + location against known patterns
- All rule-based heuristics, no ML model required


---

## PASSO 6 - Implementar Freight Marketplace

### 6.1 freight-marketplace.ts

```typescript
export class FreightMarketplace {
  private supabase = createClient();

  async publishLoad(load: Omit<FreightLoadInsert, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await this.supabase
      .from('freight_loads').insert({ ...load, status: 'open' }).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  }

  async getAvailableLoads(params: {
    categoryId?: FreightCategoryId; minBudget?: number; maxBudget?: number;
    lat?: number; lng?: number; radiusKm?: number;
    limit?: number; offset?: number;
  } = {}) {
    let q = this.supabase
      .from('freight_loads').select('*', { count: 'exact' })
      .in('status', ['open', 'bidding'])
      .order('created_at', { ascending: false });
    if (params.categoryId) q = q.eq('category_id', params.categoryId);
    if (params.minBudget !== undefined) q = q.gte('budget_max', params.minBudget);
    if (params.maxBudget !== undefined) q = q.lte('budget_min', params.maxBudget);
    if (params.lat && params.lng && params.radiusKm) {
      const dLat = params.radiusKm / 111;
      const dLng = params.radiusKm / (111 * Math.cos(params.lat * Math.PI / 180));
      q = q.gte('origin_lat', params.lat - dLat).lte('origin_lat', params.lat + dLat)
           .gte('origin_lng', params.lng - dLng).lte('origin_lng', params.lng + dLng);
    }
    if (params.limit) q = q.limit(params.limit);
    if (params.offset) q = q.range(params.offset, params.offset + (params.limit || 20) - 1);
    const { data, count } = await q;
    return { data: data || [], total: count || 0 };
  }

  async getLoadById(loadId: string) {
    const { data } = await this.supabase.from('freight_loads').select('*').eq('id', loadId).single();
    return data;
  }

  async placeBid(bid: Omit<FreightBidInsert, 'id' | 'created_at' | 'status'>) {
    const load = await this.getLoadById(bid.load_id);
    if (!load) return { success: false, error: 'Frete nao encontrado' };
    if (load.status !== 'open' && load.status !== 'bidding') {
      return { success: false, error: 'Frete nao aceita mais lances' };
    }
    if (load.budget_min && bid.amount < load.budget_min) {
      return { success: false, error: `Valor minimo: R$ ${load.budget_min}` };
    }
    if (load.budget_max && bid.amount > load.budget_max) {
      return { success: false, error: `Valor maximo: R$ ${load.budget_max}` };
    }
    const { data, error } = await this.supabase
      .from('freight_bids').insert(bid).select().single();
    if (error) return { success: false, error: error.message };
    if (load.status === 'open') {
      await this.supabase.from('freight_loads').update({ status: 'bidding' }).eq('id', bid.load_id);
    }
    return { success: true, data };
  }

  async acceptBid(bidId: string, loadId: string, companyId: string) {
    const load = await this.getLoadById(loadId);
    if (!load) return { success: false, error: 'Frete nao encontrado' };
    if (load.company_id !== companyId) return { success: false, error: 'Nao autorizado' };
    await this.supabase.from('freight_bids').update({ status: 'accepted' })
      .eq('id', bidId).eq('load_id', loadId);
    await this.supabase.from('freight_bids').update({ status: 'rejected' })
      .eq('load_id', loadId).neq('id', bidId).eq('status', 'pending');
    await this.supabase.from('freight_loads').update({ status: 'in_progress' }).eq('id', loadId);
    return { success: true };
  }

  async getBidsForLoad(loadId: string) {
    const { data } = await this.supabase
      .from('freight_bids').select('*').eq('load_id', loadId).order('amount', { ascending: true });
    return data || [];
  }

  async completeLoad(loadId: string, companyId: string) {
    const load = await this.getLoadById(loadId);
    if (!load) return { success: false, error: 'Frete nao encontrado' };
    if (load.company_id !== companyId) return { success: false, error: 'Nao autorizado' };
    await this.supabase.from('freight_loads').update({ status: 'completed' }).eq('id', loadId);
    return { success: true };
  }
}
```


### 6.2 freight-categories.ts

```typescript
export function getCategorySpec(id: FreightCategoryId) {
  return FREIGHT_CATEGORIES.find(c => c.id === id);
}
export function getCategoryLabel(id: FreightCategoryId, locale: 'en'|'pt'|'es' = 'pt') {
  const spec = getCategorySpec(id);
  if (!spec) return id;
  if (locale === 'pt') return spec.label_pt;
  if (locale === 'es') return spec.label_es;
  return spec.label;
}
export function validateLoadForCategory(categoryId: FreightCategoryId, params: {
  weightKg?: number; volumeM3?: number;
  heightCm?: number; widthCm?: number; lengthCm?: number;
  cnhType?: string; hasInsurance?: boolean;
}) {
  const spec = getCategorySpec(categoryId);
  if (!spec) return { valid: false, errors: ['Categoria invalida'] };
  const errors: string[] = [];
  if (params.weightKg !== undefined && params.weightKg > spec.max_weight_kg)
    errors.push(`Peso maximo: ${spec.max_weight_kg}kg`);
  if (params.volumeM3 !== undefined && params.volumeM3 > spec.max_volume_m3)
    errors.push(`Volume maximo: ${spec.max_volume_m3}m3`);
  if (params.heightCm !== undefined && params.heightCm > spec.max_height_cm)
    errors.push(`Altura maxima: ${spec.max_height_cm}cm`);
  if (params.widthCm !== undefined && params.widthCm > spec.max_width_cm)
    errors.push(`Largura maxima: ${spec.max_width_cm}cm`);
  if (params.lengthCm !== undefined && params.lengthCm > spec.max_length_cm)
    errors.push(`Comprimento maximo: ${spec.max_length_cm}cm`);
  if (spec.required_cnh && params.cnhType) {
    const hierarchy: Record<string,number> = { A:1, B:2, C:3, D:4, E:5 };
    if ((hierarchy[params.cnhType] || 0) < (hierarchy[spec.required_cnh] || 0))
      errors.push(`CNH necessaria: ${spec.required_cnh}`);
  }
  if (spec.requires_insurance && !params.hasInsurance)
    errors.push('Seguro obrigatorio');
  return { valid: errors.length === 0, errors };
}
```


### 6.3 Freight Marketplace Flow

```
Company Publishes Load -> freight_loads (status: open)
Driver Places Bid -> freight_bids (status: pending) -> auto-transition load to "bidding"
Company Reviews Bids -> getBidsForLoad()
Company Accepts Bid -> accept one, reject others -> load status: in_progress
Driver Picks Up -> FreightTracking provides real-time location on map
Company Completes Load -> freight_loads (status: completed)

```



---

## PASSO 7 - Criar componentes de UI

### 7.1 <RoadEventMap />

**File:** `src/lib/road-intelligence/road-event-map.tsx`

Map overlay component displaying road events as markers.

- Uses Mobility Engine for map rendering
- Fetches events from RoadIntelligenceService
- Icons per event type, colors per severity
- Clusters when zoomed out
- Click popup with details + vote buttons
- Auto-refresh on bounds change
- Realtime subscription for new events
- Filter by type and severity
- **States**: loading (skeleton map), empty, error (retry), populated, filter active

### 7.2 <RoadEventReport />

**File:** `src/lib/road-intelligence/road-event-report.tsx`

Floating form for reporting road events (5 steps).

- Step 1: Select event type (grid with 18 icons)
- Step 2: Set location (drag pin or auto-detect)
- Step 3: Description (optional text)
- Step 4: Photo (camera/gallery, max 3)
- Step 5: Review & confirm
- Rate limiting, success animation, error retry
- **States**: each step, submitting, success, error

### 7.3 <RoadEventAlert />

**File:** `src/lib/road-intelligence/road-event-alert.tsx`

In-app toast when driver enters event geofence.

- Event type icon, description, severity color
- Distance to event, "Ver no mapa" action, dismiss
- Auto-dismiss after 10s, stack multiple alerts
- framer-motion slide-in, glassmorphism toast
- **States**: hidden, single, stack, dismissing, expired

### 7.4 <PassengerGreeting />

**File:** `src/components/passenger-greeting.tsx`

Contextual greeting card for passenger home page.

- Uses PassengerAIService.generateGreeting()
- Quick actions: "Sim, vamos!" or "Nao, outro lugar"
- Animated entrance (slide down + fade)
- **States**: loading (skeleton), greeting, empty, error fallback

### 7.5 <FreightLoadCard />

**File:** `src/components/freight-load-card.tsx`

Card for displaying a freight load in list.

- Origin -> destination, category icon, weight/volume/dimensions
- Budget range, CNH badge, insurance badge, status badge
- "Ver Detalhes" and "Dar Lance" buttons
- **States**: default, expired (grayed), bidding (bid count), in_progress (green), loading

### 7.6 <FreightBidForm />

**File:** `src/components/freight-bid-form.tsx`

Form for drivers to place a bid.

- Amount input with budget range validation
- Optional message, load summary, confirm button
- Validation: budget, CNH, insurance
- **States**: filling, validating, submitting, success, error, out of budget

### 7.7 <FreightTracking />

**File:** `src/components/freight-tracking.tsx`

Real-time tracking for in-progress shipments.

- Map with driver location, route, markers
- Status updates: "Coletando", "Em transito", "Entregando"
- ETA, driver info card
- **States**: loading, active, no driver, completed, error

### 7.8 Component Conventions

All components must:

- Start with "use client" directive
- Export typed Props interface
- Handle loading, empty, error, populated states
- Use glassmorphism pattern: bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl
- Use framer-motion spring animations
- Be mobile-first with bottom sheets
- Include aria-labels, keyboard navigation


---

## PASSO 8 - Criar/Atualizar paginas

### 8.1 /road-intelligence

**File:** `src/app/(dashboard)/road-intelligence/page.tsx`

Full-page interactive road event map with:
- Full-screen Mobility Engine map
- RoadEventMap component
- RoadEventReport FAB at bottom-right
- RoadEventAlert for driver role
- Filter bar: event type dropdown, severity checkboxes
- City selector for admin
- Stats bar: active count by severity
- **States**: loading, empty, populated, error

### 8.2 /freight/marketplace

**File:** `src/app/(dashboard)/freight/marketplace/page.tsx`

Freight marketplace browsing page with:
- List of available loads (open/bidding)
- Search bar (title, origin, destination)
- Filters: category, budget, weight
- Sort: newest, lowest/highest budget
- Grid/list toggle
- FreightLoadCard items with pagination
- FAB to publish new load (company role)
- **States**: loading, empty, error, populated, filter active

### 8.3 /freight/my-loads

**File:** `src/app/(dashboard)/freight/my-loads/page.tsx`

Company load management page with:
- List of company-owned loads
- Status filter tabs (all/open/bidding/in_progress/completed/cancelled)
- Each load shows bids count, actions
- Publish new load button
- **States**: loading, empty, error, populated

### 8.4 /freight/my-bids

**File:** `src/app/(dashboard)/freight/my-bids/page.tsx`

Driver bid management page with:
- List of driver bids with load info
- Status filter (pending/accepted/rejected)
- Bid amount, load title, status badge
- **States**: loading, empty, error, populated

### 8.5 Update /dashboard/passenger/home

Add PassengerGreeting component at the top of the passenger home page.
The greeting should appear before the ride request form.

### 8.6 Update /dashboard/driver/map

Add RoadEventMap overlay on the driver map.
Subscribe to RoadEventAlert for geofence notifications.

### 8.7 Update /ride

Connect ride creation flow to the updated Dispatcher class.
On ride.create -> call dispatcher.dispatchRide()
Show matching status (searching -> driver found -> accepted)


---

## PASSO 9 - Performance

### Targets

- Cold start < 1s
- Page transitions < 200ms
- Animations at 60fps

### Techniques

- **Lazy loading**: dynamic imports for map, 3D, camera components
- **Code splitting**: per-route with Next.js App Router
- **Image optimization**: next/image with WebP, lazy loading
- **Streaming SSR**: React Suspense for data-fetching pages
- **Bundle analysis**: verify with @next/bundle-analyzer
- **Tree shaking**: remove unused imports, lodash per-method
- **Memo**: React.memo for heavy list items (FreightLoadCard)
- **Virtual list**: for long lists (freight marketplace, events)
- **Debounce**: search inputs, map bounds change handlers
- **Throttle**: location updates, realtime subscriptions

### Implementation Checklists

- [ ] All map components use next/dynamic with ssr: false
- [ ] Heavy components (camera, photo editor) loaded lazily
- [ ] Images use next/image with proper sizes
- [ ] Route segments use loading.tsx Suspense boundaries
- [ ] Bundle size < 200kb initial JS
- [ ] Lighthouse scores > 90 for all pages
- [ ] No layout shift on page load


---

## PASSO 10 - Testes e Validacao

### Build Check

```bash
npx next build
# Should complete with zero errors
# Check for TypeScript errors, lint errors, bundle warnings

```


### TypeScript Check

```bash
npx tsc --noEmit
# Strict mode must pass without errors
# Verify all new types are used correctly

```


### Verification Checklist

- [ ] `npx next build` completes without errors
- [ ] `npx tsc --noEmit` passes with strict mode
- [ ] All 10 database tables created and verified
- [ ] TypeScript interfaces match database schema
- [ ] Dispatcher connects to real Supabase tables
- [ ] Road Intelligence CRUD operations work
- [ ] Passenger AI generates contextual greetings
- [ ] Freight Marketplace: publish, bid, accept, complete
- [ ] All 7 components render without errors
- [ ] All 6 pages load without errors
- [ ] Dark theme applied consistently
- [ ] Glassmorphism pattern used everywhere
- [ ] framer-motion animations work
- [ ] Mobile responsive (bottom sheets on mobile)
- [ ] RLS policies tested with different roles
- [ ] Realtime subscriptions functional
- [ ] Performance targets met (<1s cold, <200ms transitions)


---

## Regras de Ouro

1. **Database First** - Every business rule (pricing, commission, dispatch weights) must come from database tables, never hardcoded.
2. **Mobility Engine Only** - Every map, direction, geocoding, or location call must go through the Mobility Engine abstraction layer.
3. **No Hardcoded Values** - Always fetch city-specific configuration. Never assume values are the same across cities/countries.
4. **Reusable Components** - All shared UI goes in src/components/. Design for reusability with typed Props interfaces.
5. **State Coverage** - Every component and page must handle: loading, empty, error, and success states.
6. **Dark Theme Consistency** - Use the established glassmorphism pattern: bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl.
7. **Mobile First** - All pages must work on mobile. Use bottom sheets for mobile interactions.
8. **Real-time by Default** - Use Supabase Realtime for any data that changes: locations, ride status, events, bids.
9. **Security** - RLS policies on every table. Server-side validation for mutations. Never trust client-side only.
10. **Documentation** - Update .ai/CHANGELOG.md and .ai/ROADMAP.md after completing work.

## Anexos

### A. FreightCategorySpec Full Array

```typescript
export const FREIGHT_CATEGORIES: FreightCategorySpec[] = [
  { id: 'moto', label: 'Motorcycle', label_pt: 'Moto', label_es: 'Moto',
    max_weight_kg: 30, max_volume_m3: 0.2, max_height_cm: 50, max_width_cm: 50, max_length_cm: 80,
    required_cnh: 'A', requires_insurance: false, icon: '🏍️', description: 'Pequenas entregas urbanas de ate 30kg'},
  { id: 'bike', label: 'Bicycle', label_pt: 'Bicicleta', label_es: 'Bicicleta',
    max_weight_kg: 15, max_volume_m3: 0.1, max_height_cm: 40, max_width_cm: 40, max_length_cm: 60,
    required_cnh: null, requires_insurance: false, icon: '🚲', description: 'Entregas rapidas de curta distancia'},
  { id: 'carro', label: 'Car', label_pt: 'Carro', label_es: 'Carro',
    max_weight_kg: 200, max_volume_m3: 1.5, max_height_cm: 80, max_width_cm: 100, max_length_cm: 150,
    required_cnh: 'B', requires_insurance: false, icon: '🚗', description: 'Entregas de medio porte em area urbana'},
  { id: 'suv', label: 'SUV', label_pt: 'SUV', label_es: 'SUV',
    max_weight_kg: 350, max_volume_m3: 2.0, max_height_cm: 90, max_width_cm: 110, max_length_cm: 170,
    required_cnh: 'B', requires_insurance: false, icon: '🚙', description: 'SUV com maior capacidade'},
  { id: 'pickup', label: 'Pickup Truck', label_pt: 'Pickup', label_es: 'Camioneta',
    max_weight_kg: 800, max_volume_m3: 3.0, max_height_cm: 120, max_width_cm: 140, max_length_cm: 200,
    required_cnh: 'B', requires_insurance: false, icon: '🛻', description: 'Pickup para cargas medias'},
  { id: 'van', label: 'Van', label_pt: 'Van', label_es: 'Furgoneta',
    max_weight_kg: 1200, max_volume_m3: 8.0, max_height_cm: 150, max_width_cm: 160, max_length_cm: 300,
    required_cnh: 'B', requires_insurance: true, icon: '🚐', description: 'Van fechada para cargas'},
  { id: 'hr', label: 'Light Truck (HR)', label_pt: 'HR', label_es: 'Camion Ligero',
    max_weight_kg: 2500, max_volume_m3: 15.0, max_height_cm: 180, max_width_cm: 200, max_length_cm: 400,
    required_cnh: 'C', requires_insurance: true, icon: '🚛', description: 'Caminhao leve HR'},
  { id: '3_4', label: '3/4 Ton Truck', label_pt: 'Caminhao 3/4', label_es: 'Camion 3/4',
    max_weight_kg: 3500, max_volume_m3: 20.0, max_height_cm: 200, max_width_cm: 220, max_length_cm: 500,
    required_cnh: 'C', requires_insurance: true, icon: '🚛', description: 'Caminhao 3/4'},
  { id: 'toco', label: 'Toco Truck', label_pt: 'Caminhao Toco', label_es: 'Camion Toco',
    max_weight_kg: 6000, max_volume_m3: 30.0, max_height_cm: 220, max_width_cm: 250, max_length_cm: 700,
    required_cnh: 'C', requires_insurance: true, icon: '🚛', description: 'Toco para cargas pesadas'},
  { id: 'truck', label: 'Truck', label_pt: 'Caminhao Truck', label_es: 'Camion Truck',
    max_weight_kg: 10000, max_volume_m3: 45.0, max_height_cm: 250, max_width_cm: 260, max_length_cm: 900,
    required_cnh: 'D', requires_insurance: true, icon: '🚛', description: 'Truck de grande porte'},
  { id: 'bitrem', label: 'Bitrem', label_pt: 'Bitrem', label_es: 'Bitrem',
    max_weight_kg: 25000, max_volume_m3: 80.0, max_height_cm: 280, max_width_cm: 260, max_length_cm: 1600,
    required_cnh: 'E', requires_insurance: true, icon: '🚛', description: 'Bitrem longa distancia'},
  { id: 'carreta', label: 'Semi-Trailer', label_pt: 'Carreta', label_es: 'Carreta',
    max_weight_kg: 35000, max_volume_m3: 100.0, max_height_cm: 300, max_width_cm: 260, max_length_cm: 1800,
    required_cnh: 'E', requires_insurance: true, icon: '🚛', description: 'Carreta interestadual'},
  { id: 'guincho', label: 'Tow Truck', label_pt: 'Guincho', label_es: 'Grua',
    max_weight_kg: 5000, max_volume_m3: 10.0, max_height_cm: 200, max_width_cm: 200, max_length_cm: 500,
    required_cnh: 'C', requires_insurance: true, icon: '🐆', description: 'Guincho para reboque'},
  { id: 'munck', label: 'MUNK Crane', label_pt: 'Munck', label_es: 'MUNCK',
    max_weight_kg: 8000, max_volume_m3: 25.0, max_height_cm: 250, max_width_cm: 250, max_length_cm: 700,
    required_cnh: 'D', requires_insurance: true, icon: '🏗️', description: 'Munck com guindauto'},
  { id: 'cacamba', label: 'Dump Truck', label_pt: 'Cacamba', label_es: 'Volquete',
    max_weight_kg: 14000, max_volume_m3: 14.0, max_height_cm: 200, max_width_cm: 250, max_length_cm: 600,
    required_cnh: 'D', requires_insurance: true, icon: '🛻', description: 'Cacamba basculante'},
  { id: 'trator', label: 'Tractor', label_pt: 'Trator', label_es: 'Tractor',
    max_weight_kg: 5000, max_volume_m3: 5.0, max_height_cm: 200, max_width_cm: 200, max_length_cm: 400,
    required_cnh: 'C', requires_insurance: true, icon: '🚜', description: 'Trator agricola'},
  { id: 'maquinas_agricolas', label: 'Agricultural Machinery', label_pt: 'Maquinas Agricolas', label_es: 'Maquinaria Agricola',
    max_weight_kg: 20000, max_volume_m3: 60.0, max_height_cm: 350, max_width_cm: 350, max_length_cm: 1200,
    required_cnh: 'E', requires_insurance: true, icon: '🚜', description: 'Maquinas agricolas de grande porte'},
];
```


### B. RLS Policy Summary

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| rides | passenger, assigned driver, admin | passenger | passenger | - |
| ride_requests | driver, passenger (via ride) | system | driver | - |
| driver_locations | public (online), admin | driver | driver | - |
| dispatcher_rules | public | admin | admin | admin |
| driver_scores | driver, admin/dispatcher | system | - | - |
| driver_ratings | public | system | system | - |
| road_events | public (active) | user | reporter, admin | - |
| passenger_preferences | passenger | passenger | passenger | - |
| freight_loads | company, driver (open), admin | company | company | admin |
| freight_bids | driver, company (on own load) | driver | company | - |

### C. Index Strategy

| Table | Indexes | Type |
|-------|---------|------|
| rides | passenger_id, status, created_at, city_id, (passenger_id, status) | B-tree |
| ride_requests | ride_id, driver_id, status, (driver_id, status), UNIQUE (ride_id, driver_id) WHERE active | B-tree |
| driver_locations | UNIQUE driver_id, online WHERE true, GIN category_ids | B-tree + GIN |
| dispatcher_rules | UNIQUE (city_id, weight_name), city_id, enabled WHERE true | B-tree |
| driver_scores | driver_id, score DESC | B-tree |
| driver_ratings | UNIQUE driver_id, avg_rating DESC | B-tree |
| road_events | city_id, status, type, severity, (lat,lng), expires WHERE active, (city_id,status,severity) WHERE active | B-tree |
| passenger_preferences | UNIQUE passenger_id | B-tree |
| freight_loads | company_id, status, category_id, status WHERE open/bidding | B-tree |
| freight_bids | load_id, driver_id, status, amount DESC | B-tree |

### D. Dispatcher Weight Names

1. proximity - Distance from rider to driver
2. rating - Driver average rating
3. acceptance_rate - Driver acceptance rate (last 100)
4. cancellation_rate - Driver cancellation rate (last 100)
5. earnings_balance - Lower earners get priority
6. trips_completed - Total trips completed
7. experience_months - Time since registration
8. battery_level - Driver device battery
9. speed_consistency - Driving speed consistency
10. category_match - Match with requested vehicle category
11. previous_cancellations - Recent cancellations penalty
12. current_ride_distance - Distance from current location
13. online_time - Time spent online
14. peak_time_multiplier - Surge hour priority
15. passenger_preference - Passenger favorite driver bonus

### E. City Configuration Reference

| City | Country | Currency | Locale | Default Language |
|------|---------|----------|--------|-----------------|
| Sao Paulo | BR | BRL | pt-BR | pt |
| Rio de Janeiro | BR | BRL | pt-BR | pt |
| New York | US | USD | en-US | en |
| Los Angeles | US | USD | en-US | en |
| Lisbon | PT | EUR | pt-PT | pt |
| Porto | PT | EUR | pt-PT | pt |
| Mexico City | MX | MXN | es-MX | es |

---

*End of NEXT_TASK.md - Execute all 10 steps in order. Never skip steps.*