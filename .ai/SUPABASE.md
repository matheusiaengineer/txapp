# TXAPP Supabase Database Schema

## Visão Geral
Banco de dados principal da plataforma TXAPP. PostgreSQL com extensão PostGIS (geoespacial), pgcrypto (UUID), Supabase Realtime (subscriptions), Row Level Security (multi-tenant por cidade/país).

---

## Configuração Inicial

```sql
-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Configuração de busca textual (português)
CREATE TEXT SEARCH CONFIGURATION pt (COPY = portuguese);

-- Schema público padrão
SET search_path TO public;
```

---

## Enums

```sql
CREATE TYPE user_role AS ENUM (
  'passenger', 'driver', 'company', 'admin', 'superadmin'
);

CREATE TYPE kyc_status AS ENUM (
  'not_started', 'pending', 'approved', 'rejected'
);

CREATE TYPE ride_status AS ENUM (
  'searching', 'offered', 'accepted', 'started', 'completed', 'cancelled'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'authorized', 'completed', 'refunded', 'failed'
);

CREATE TYPE request_status AS ENUM (
  'pending', 'offered', 'accepted', 'rejected', 'timeout'
);

CREATE TYPE event_severity AS ENUM (
  'low', 'medium', 'high', 'critical'
);

CREATE TYPE event_verification AS ENUM (
  'collaborative', 'admin', 'automatic'
);

CREATE TYPE event_status AS ENUM (
  'pending', 'verified', 'expired', 'removed'
);

CREATE TYPE reputation_level AS ENUM (
  'newcomer', 'bronze', 'silver', 'gold', 'platinum'
);

CREATE TYPE vote_type AS ENUM (
  'upvote', 'downvote'
);

CREATE TYPE load_status AS ENUM (
  'open', 'bidding', 'in_progress', 'picked_up', 'in_transit',
  'delivered', 'completed', 'cancelled'
);

CREATE TYPE bid_status AS ENUM (
  'pending', 'accepted', 'rejected', 'countered'
);

CREATE TYPE tracking_status AS ENUM (
  'assigned', 'picked_up', 'in_transit', 'delivered', 'returned'
);

CREATE TYPE transaction_type AS ENUM (
  'deposit', 'withdrawal', 'payment', 'refund', 'commission',
  'cashback', 'referral_bonus', 'split'
);

CREATE TYPE transaction_status AS ENUM (
  'pending', 'completed', 'failed', 'refunded'
);

CREATE TYPE subscription_plan AS ENUM (
  'basic', 'pro', 'enterprise'
);

CREATE TYPE subscription_status AS ENUM (
  'active', 'canceled', 'past_due'
);

CREATE TYPE doc_status AS ENUM (
  'pending', 'approved', 'rejected'
);
```

---

## Tabelas

### 1. profiles

Tabela central de usuários. Unifica passageiros, motoristas, empresas e administradores.

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'passenger',
  document_type TEXT,                           -- CPF, CNPJ, SSN, DNI, CURP, NIF, Aadhaar
  document_number TEXT,                         -- criptografado via pgp_sym_encrypt
  birth_date    DATE,
  gender        TEXT,
  nationality   TEXT,
  city_id       TEXT NOT NULL,                  -- ref: city_configs.id
  locale        TEXT NOT NULL DEFAULT 'pt-BR',
  currency      TEXT NOT NULL DEFAULT 'BRL',
  language      TEXT NOT NULL DEFAULT 'pt',
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  kyc_status    kyc_status NOT NULL DEFAULT 'not_started',
  kyc_attempts  INT NOT NULL DEFAULT 0,
  onboarded     BOOLEAN NOT NULL DEFAULT false,
  suspended     BOOLEAN NOT NULL DEFAULT false,
  suspension_reason TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_profiles_email ON profiles (email);
CREATE INDEX idx_profiles_phone ON profiles (phone);
CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_profiles_city_id ON profiles (city_id);
CREATE INDEX idx_profiles_kyc_status ON profiles (kyc_status);
CREATE INDEX idx_profiles_suspended ON profiles (suspended) WHERE suspended = true;
CREATE INDEX idx_profiles_created_at ON profiles (created_at DESC);
```

**RLS Policies:**

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuário pode ler apenas o próprio perfil
CREATE POLICY "profiles_owner_select"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin pode ler todos os perfis
CREATE POLICY "profiles_admin_select"
  ON profiles FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- Motorista pode ver dados do passageiro durante corrida ativa
CREATE POLICY "profiles_driver_during_ride"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.driver_id = auth.uid()
        AND r.passenger_id = profiles.id
        AND r.status IN ('accepted', 'started')
    )
  );

-- Usuário pode atualizar próprio perfil (campos limitados)
CREATE POLICY "profiles_owner_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin pode atualizar qualquer perfil
CREATE POLICY "profiles_admin_update"
  ON profiles FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- Apenas superadmin pode inserir admins
CREATE POLICY "profiles_insert_restricted"
  ON profiles FOR INSERT
  WITH CHECK (
    (role NOT IN ('admin', 'superadmin')) OR
    (auth.jwt() ->> 'role' = 'superadmin')
  );
```

**Realtime:** Não habilitado (dados sensíveis).

---

### 2. driver_locations

Rastreamento de localização de motoristas em tempo real.

```sql
CREATE TABLE driver_locations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id        UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lat              DOUBLE PRECISION NOT NULL,
  lng              DOUBLE PRECISION NOT NULL,
  location         GEOGRAPHY(Point, 4326) NOT NULL,
  accuracy         INT,                           -- em metros
  speed            DECIMAL(5,2),                  -- km/h
  heading          DECIMAL(5,2),                  -- graus (0-360)
  battery_level    INT CHECK (battery_level BETWEEN 0 AND 100),
  is_online        BOOLEAN NOT NULL DEFAULT false,
  category_ids     TEXT[] DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice geoespacial GiST (fundamental para queries de proximidade)
CREATE INDEX idx_driver_locations_location
  ON driver_locations USING GIST (location);

-- Índice para filtrar motoristas online
CREATE INDEX idx_driver_locations_online
  ON driver_locations (is_online) WHERE is_online = true;

-- Índice para agrupar por motorista
CREATE INDEX idx_driver_locations_driver
  ON driver_locations (driver_id);

-- Trigger: atualiza location automaticamente a partir de lat/lng
CREATE OR REPLACE FUNCTION update_driver_location_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_driver_location_geom
  BEFORE INSERT OR UPDATE ON driver_locations
  FOR EACH ROW EXECUTE FUNCTION update_driver_location_geom();
```

**RLS Policies:**

```sql
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Motorista atualiza sua própria localização
CREATE POLICY "driver_locations_owner_upsert"
  ON driver_locations FOR ALL
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- Dispatch/sistema pode ler todas as localizações
CREATE POLICY "driver_locations_dispatch_select"
  ON driver_locations FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'superadmin', 'dispatcher') OR
    driver_id = auth.uid()
  );

-- Passageiro pode ver motoristas próximos (apenas online, sem dados precisos)
CREATE POLICY "driver_locations_passenger_select"
  ON driver_locations FOR SELECT
  USING (
    is_online = true AND
    auth.jwt() ->> 'role' = 'passenger'
  );
```

**Realtime:** HABILITADO — canal `driver_locations` (motoristas publicam posição, dispatch consome).

---

### 3. rides

Tabela principal de corridas.

```sql
CREATE TABLE rides (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id        UUID NOT NULL REFERENCES profiles(id),
  driver_id           UUID REFERENCES profiles(id),
  origin_lat          DOUBLE PRECISION NOT NULL,
  origin_lng          DOUBLE PRECISION NOT NULL,
  origin_address      TEXT NOT NULL,
  destination_lat     DOUBLE PRECISION NOT NULL,
  destination_lng     DOUBLE PRECISION NOT NULL,
  destination_address TEXT NOT NULL,
  category_id         TEXT NOT NULL,
  status              ride_status NOT NULL DEFAULT 'searching',
  distance_km         DECIMAL(10,2),
  duration_min        DECIMAL(10,2),
  fare                DECIMAL(10,2),
  base_fare           DECIMAL(10,2) DEFAULT 0,
  distance_fare       DECIMAL(10,2) DEFAULT 0,
  time_fare           DECIMAL(10,2) DEFAULT 0,
  surge_multiplier    DECIMAL(3,2) DEFAULT 1.00,
  night_multiplier    DECIMAL(3,2) DEFAULT 1.00,
  commission          DECIMAL(10,2) DEFAULT 0,
  driver_earnings     DECIMAL(10,2) DEFAULT 0,
  payment_method      TEXT,
  payment_status      payment_status NOT NULL DEFAULT 'pending',
  currency            TEXT NOT NULL DEFAULT 'BRL',
  city_id             TEXT NOT NULL,
  cancellation_reason TEXT,
  cancelled_by        TEXT,                       -- 'passenger', 'driver', 'system', 'admin'
  driver_rating       INT CHECK (driver_rating BETWEEN 1 AND 5),
  passenger_rating    INT CHECK (passenger_rating BETWEEN 1 AND 5),
  passenger_comment   TEXT,
  driver_comment      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_rides_passenger_id ON rides (passenger_id);
CREATE INDEX idx_rides_driver_id ON rides (driver_id);
CREATE INDEX idx_rides_status ON rides (status);
CREATE INDEX idx_rides_city_id ON rides (city_id);
CREATE INDEX idx_rides_created_at ON rides (created_at DESC);
CREATE INDEX idx_rides_passenger_status ON rides (passenger_id, status);
CREATE INDEX idx_rides_driver_status ON rides (driver_id, status);
CREATE INDEX idx_rides_completed_at ON rides (completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_rides_city_date ON rides (city_id, created_at DESC);
```

**RLS Policies:**

```sql
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Passageiro vê suas próprias corridas
CREATE POLICY "rides_passenger_select"
  ON rides FOR SELECT
  USING (passenger_id = auth.uid());

-- Motorista vê corridas atribuídas a ele
CREATE POLICY "rides_driver_select"
  ON rides FOR SELECT
  USING (driver_id = auth.uid());

-- Admin vê todas
CREATE POLICY "rides_admin_select"
  ON rides FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- Passageiro pode criar corrida
CREATE POLICY "rides_passenger_insert"
  ON rides FOR INSERT
  WITH CHECK (passenger_id = auth.uid());

-- Motorista aceita/inicia/finaliza corrida
CREATE POLICY "rides_driver_update"
  ON rides FOR UPDATE
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- Passageiro cancela própria corrida (apenas se status < accepted)
CREATE POLICY "rides_passenger_cancel"
  ON rides FOR UPDATE
  USING (passenger_id = auth.uid() AND status IN ('searching', 'offered'))
  WITH CHECK (passenger_id = auth.uid());

-- Admin pode atualizar qualquer corrida
CREATE POLICY "rides_admin_update"
  ON rides FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

**Realtime:** HABILITADO — canal `rides` (notificações de status em tempo real para passenger e driver).

---

### 4. ride_requests

Ofertas de corrida enviadas aos motoristas pelo dispatcher inteligente.

```sql
CREATE TABLE ride_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id       UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id     UUID NOT NULL REFERENCES profiles(id),
  score         DECIMAL(5,2),                     -- pontuação do dispatcher (0-100)
  factors       JSONB DEFAULT '{}',               -- breakdown dos fatores usados no score
  cancel_risk   JSONB DEFAULT '{}',               -- análise de risco de cancelamento
  status        request_status NOT NULL DEFAULT 'pending',
  offered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at  TIMESTAMPTZ
);

CREATE INDEX idx_ride_requests_ride_id ON ride_requests (ride_id);
CREATE INDEX idx_ride_requests_driver_id ON ride_requests (driver_id);
CREATE INDEX idx_ride_requests_status ON ride_requests (status);
CREATE INDEX idx_ride_requests_driver_status ON ride_requests (driver_id, status);
```

**RLS:**

```sql
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ride_requests_driver_select"
  ON ride_requests FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "ride_requests_driver_update"
  ON ride_requests FOR UPDATE
  USING (driver_id = auth.uid() AND status = 'pending')
  WITH CHECK (driver_id = auth.uid() AND status IN ('accepted', 'rejected'));

CREATE POLICY "ride_requests_admin_all"
  ON ride_requests FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

**Realtime:** HABILITADO — canal `ride_requests` (motoristas recebem oferta em tempo real).

---

### 5. dispatcher_rules

Regras configuráveis por cidade para o algoritmo de dispatch inteligente.

```sql
CREATE TABLE dispatcher_rules (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id      TEXT NOT NULL,
  weight_name  TEXT NOT NULL,                     -- ex: distance, rating, acceptance_rate, surge
  weight_value INT NOT NULL CHECK (weight_value BETWEEN 0 AND 100),
  enabled      BOOLEAN NOT NULL DEFAULT true,
  priority     INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (city_id, weight_name)
);

CREATE INDEX idx_dispatcher_rules_city ON dispatcher_rules (city_id, priority);
```

**RLS:**

```sql
ALTER TABLE dispatcher_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dispatcher_rules_admin_all"
  ON dispatcher_rules FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin', 'dispatcher'));

CREATE POLICY "dispatcher_rules_read_all"
  ON dispatcher_rules FOR SELECT
  USING (true);
```

---

### 6. driver_scores

Scores calculados dos motoristas para dispatch.

```sql
CREATE TABLE driver_scores (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score          DECIMAL(5,2) NOT NULL,           -- 0-100 agregado
  factors        JSONB NOT NULL DEFAULT '{}',     -- ex: {"rating": 85, "acceptance": 72, "proximity": 90}
  calculated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_driver_scores_score
  ON driver_scores (score DESC, calculated_at DESC);

CREATE INDEX idx_driver_scores_driver
  ON driver_scores (driver_id);

CREATE UNIQUE INDEX idx_driver_scores_driver_latest
  ON driver_scores (driver_id, calculated_at DESC);
```

**RLS:**

```sql
ALTER TABLE driver_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_scores_driver_select"
  ON driver_scores FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "driver_scores_admin_all"
  ON driver_scores FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin', 'dispatcher'));
```

---

### 7. driver_ratings

Rating agregado por motorista (cache materializado).

```sql
CREATE TABLE driver_ratings (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id                       UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  avg_rating                      DECIMAL(3,2) DEFAULT 0.00,
  total_ratings                   INT DEFAULT 0,
  last_100_acceptance_rate        DECIMAL(5,2),   -- %
  last_100_cancellation_rate      DECIMAL(5,2),   -- %
  trips_completed                 INT DEFAULT 0,
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_driver_ratings_avg ON driver_ratings (avg_rating DESC);
```

**RLS:**

```sql
ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_ratings_public_select"
  ON driver_ratings FOR SELECT
  USING (true);

CREATE POLICY "driver_ratings_driver_select"
  ON driver_ratings FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "driver_ratings_admin_update"
  ON driver_ratings FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 8. passengers

Perfil estendido de passageiros.

```sql
CREATE TABLE passengers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id      UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_trips       INT NOT NULL DEFAULT 0,
  total_spent       DECIMAL(12,2) NOT NULL DEFAULT 0,
  avg_rating        DECIMAL(3,2) DEFAULT 0.00,
  home_address      JSONB,
  work_address      JSONB,
  preferred_payment TEXT,
  favorite_drivers  UUID[] DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_passengers_passenger_id ON passengers (passenger_id);
```

**RLS:**

```sql
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "passengers_owner_select"
  ON passengers FOR SELECT
  USING (passenger_id = auth.uid());

CREATE POLICY "passengers_owner_update"
  ON passengers FOR UPDATE
  USING (passenger_id = auth.uid())
  WITH CHECK (passenger_id = auth.uid());

CREATE POLICY "passengers_admin_all"
  ON passengers FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 9. companies

Empresas B2B (contratantes de frete).

```sql
CREATE TABLE companies (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name      TEXT NOT NULL,
  document_number   TEXT NOT NULL,
  document_type     TEXT NOT NULL,                -- CNPJ, EIN, NIF, etc
  address           TEXT,
  phone             TEXT,
  website           TEXT,
  logo_url          TEXT,
  rating            DECIMAL(3,2) DEFAULT 0.00,
  total_loads       INT DEFAULT 0,
  completed_loads   INT DEFAULT 0,
  avg_budget        DECIMAL(12,2) DEFAULT 0,
  payment_terms     TEXT,                         -- ex: net30, prepaid, upon_delivery
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_company_id ON companies (company_id);
CREATE INDEX idx_companies_document ON companies (document_number);
```

**RLS:**

```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_owner_select"
  ON companies FOR SELECT
  USING (company_id = auth.uid());

CREATE POLICY "companies_driver_select"
  ON companies FOR SELECT
  USING (auth.jwt() ->> 'role' = 'driver');

CREATE POLICY "companies_owner_update"
  ON companies FOR UPDATE
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

CREATE POLICY "companies_admin_all"
  ON companies FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 10. drivers

Perfil estendido de motoristas.

```sql
CREATE TABLE drivers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id           UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id          UUID REFERENCES vehicles(id),
  cnh_number          TEXT,                       -- criptografado
  cnh_category        TEXT,                       -- A, B, C, D, E (Brasil) ou equivalente
  cnh_expiry          DATE,
  has_own_vehicle     BOOLEAN DEFAULT true,
  is_online           BOOLEAN NOT NULL DEFAULT false,
  total_trips         INT NOT NULL DEFAULT 0,
  total_earnings      DECIMAL(12,2) NOT NULL DEFAULT 0,
  current_balance     DECIMAL(12,2) NOT NULL DEFAULT 0,
  bank_account        JSONB,                      -- criptografado
  pix_key             TEXT,                       -- criptografado (Brasil)
  stripe_account_id   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drivers_driver_id ON drivers (driver_id);
CREATE INDEX idx_drivers_online ON drivers (is_online) WHERE is_online = true;
```

**RLS:**

```sql
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_owner_all"
  ON drivers FOR ALL
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "drivers_admin_all"
  ON drivers FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- Motores de dispatch leem dados básicos (sem bank_account)
CREATE POLICY "drivers_public_select"
  ON drivers FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin', 'dispatcher'));
```

---

### 11. vehicles

Veículos registrados por motoristas.

```sql
CREATE TABLE vehicles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plate                 TEXT NOT NULL,
  model                 TEXT NOT NULL,
  brand                 TEXT NOT NULL,
  year                  INT CHECK (year >= 1990),
  color                 TEXT,
  category_ids          TEXT[] DEFAULT '{}',       -- categorias de corrida que este veículo atende
  has_air_conditioning  BOOLEAN DEFAULT false,
  has_wifi              BOOLEAN DEFAULT false,
  has_gps               BOOLEAN DEFAULT false,
  max_passengers        INT DEFAULT 4,
  max_weight_kg         DECIMAL(8,2),
  max_volume_m3         DECIMAL(8,2),
  photos                TEXT[] DEFAULT '{}',
  documents             JSONB DEFAULT '{}',        -- CRLV, seguro, etc
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (driver_id, plate)
);

CREATE INDEX idx_vehicles_driver_id ON vehicles (driver_id);
CREATE INDEX idx_vehicles_active ON vehicles (is_active) WHERE is_active = true;
CREATE INDEX idx_vehicles_categories ON vehicles USING GIN (category_ids);
```

**RLS:**

```sql
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_owner_all"
  ON vehicles FOR ALL
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "vehicles_admin_all"
  ON vehicles FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 12. road_events

Eventos de trânsito reportados colaborativamente.

```sql
CREATE TABLE road_events (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type            TEXT NOT NULL,             -- accident, traffic_jam, police_blitz, roadblock, construction, hazard, weather
  lat                   DOUBLE PRECISION NOT NULL,
  lng                   DOUBLE PRECISION NOT NULL,
  location              GEOGRAPHY(Point, 4326) NOT NULL,
  description           TEXT,
  severity              event_severity NOT NULL DEFAULT 'medium',
  reported_by           UUID NOT NULL REFERENCES profiles(id),
  verified_by           UUID REFERENCES profiles(id),
  verification_method   event_verification NOT NULL DEFAULT 'collaborative',
  status                event_status NOT NULL DEFAULT 'pending',
  expires_at            TIMESTAMPTZ,
  photos                JSONB[] DEFAULT '{}',
  upvotes               INT NOT NULL DEFAULT 0,
  downvotes             INT NOT NULL DEFAULT 0,
  city_id               TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_road_events_location ON road_events USING GIST (location);
CREATE INDEX idx_road_events_type ON road_events (event_type);
CREATE INDEX idx_road_events_status ON road_events (status);
CREATE INDEX idx_road_events_city ON road_events (city_id);
CREATE INDEX idx_road_events_severity ON road_events (severity);
CREATE INDEX idx_road_events_expires ON road_events (expires_at) WHERE status = 'verified';
```

**RLS:**

```sql
ALTER TABLE road_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "road_events_public_select"
  ON road_events FOR SELECT
  USING (status IN ('verified', 'pending'));

CREATE POLICY "road_events_driver_insert"
  ON road_events FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('driver', 'passenger') AND
    reported_by = auth.uid()
  );

CREATE POLICY "road_events_admin_all"
  ON road_events FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

CREATE POLICY "road_events_reporter_update"
  ON road_events FOR UPDATE
  USING (reported_by = auth.uid() AND status = 'pending')
  WITH CHECK (reported_by = auth.uid());
```

**Realtime:** HABILITADO — canal `road_events` (motoristas recebem eventos próximos em tempo real).

---

### 13. driver_road_reputation

Sistema de reputação baseado em reportes de eventos.

```sql
CREATE TABLE driver_road_reputation (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id         UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_reports     INT NOT NULL DEFAULT 0,
  verified_reports  INT NOT NULL DEFAULT 0,
  false_reports     INT NOT NULL DEFAULT 0,
  score             DECIMAL(5,2) DEFAULT 50.00,   -- 0-100, começa em 50
  level             reputation_level NOT NULL DEFAULT 'newcomer',
  last_calculated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_driver_road_reputation_score ON driver_road_reputation (score DESC);
```

**RLS:**

```sql
ALTER TABLE driver_road_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_road_reputation_public_select"
  ON driver_road_reputation FOR SELECT
  USING (true);

CREATE POLICY "driver_road_reputation_admin_update"
  ON driver_road_reputation FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 14. event_upvotes

Votos de verificação colaborativa em eventos.

```sql
CREATE TABLE event_upvotes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES road_events(id) ON DELETE CASCADE,
  driver_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote        vote_type NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, driver_id)
);

CREATE INDEX idx_event_upvotes_event ON event_upvotes (event_id);
CREATE INDEX idx_event_upvotes_driver ON event_upvotes (driver_id);
```

**RLS:**

```sql
ALTER TABLE event_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_upvotes_driver_all"
  ON event_upvotes FOR ALL
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "event_upvotes_admin_select"
  ON event_upvotes FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 15. passenger_preferences

Preferências avançadas de passageiros.

```sql
CREATE TABLE passenger_preferences (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id        UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  favorite_routes     JSONB DEFAULT '[]',          -- [{origin, destination, label}]
  frequent_times      JSONB DEFAULT '{}',          -- {"weekday_morning": "07:30", ...}
  favorite_drivers    UUID[] DEFAULT '{}',
  favorite_categories TEXT[] DEFAULT '{}',
  preferred_payment   TEXT,
  preferred_language  TEXT,
  preferred_currency  TEXT,
  home_address        JSONB,
  work_address        JSONB,
  last_greeting_time  TIMESTAMPTZ,                 -- para não cumprimentar toda vez
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**RLS:**

```sql
ALTER TABLE passenger_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "passenger_preferences_owner_all"
  ON passenger_preferences FOR ALL
  USING (passenger_id = auth.uid())
  WITH CHECK (passenger_id = auth.uid());

CREATE POLICY "passenger_preferences_admin_select"
  ON passenger_preferences FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 16. passenger_ride_history (analytics)

Tabela analítica para histórico detalhado de corridas.

```sql
CREATE TABLE passenger_ride_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id    UUID NOT NULL REFERENCES profiles(id),
  ride_id         UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  origin          JSONB NOT NULL,                  -- {lat, lng, address}
  destination     JSONB NOT NULL,
  category_id     TEXT NOT NULL,
  driver_id       UUID NOT NULL REFERENCES profiles(id),
  fare            DECIMAL(10,2) NOT NULL,
  payment_method  TEXT,
  rating          INT CHECK (rating BETWEEN 1 AND 5),
  day_of_week     INT CHECK (day_of_week BETWEEN 0 AND 6),
  hour            INT CHECK (hour BETWEEN 0 AND 23),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_passenger_ride_history_passenger
  ON passenger_ride_history (passenger_id, created_at DESC);

CREATE INDEX idx_passenger_ride_history_driver
  ON passenger_ride_history (driver_id);

CREATE INDEX idx_passenger_ride_history_category
  ON passenger_ride_history (category_id);

CREATE INDEX idx_passenger_ride_history_time
  ON passenger_ride_history (day_of_week, hour);
```

**RLS:**

```sql
ALTER TABLE passenger_ride_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "passenger_ride_history_owner_select"
  ON passenger_ride_history FOR SELECT
  USING (passenger_id = auth.uid());

CREATE POLICY "passenger_ride_history_admin_select"
  ON passenger_ride_history FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 17. freight_loads

Cargas de frete publicadas por empresas.

```sql
CREATE TABLE freight_loads (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID NOT NULL REFERENCES profiles(id),
  title                 TEXT NOT NULL,
  description           TEXT,
  origin_address        TEXT NOT NULL,
  origin_lat            DOUBLE PRECISION NOT NULL,
  origin_lng            DOUBLE PRECISION NOT NULL,
  origin_location       GEOGRAPHY(Point, 4326) NOT NULL,
  destination_address   TEXT NOT NULL,
  destination_lat       DOUBLE PRECISION NOT NULL,
  destination_lng       DOUBLE PRECISION NOT NULL,
  destination_location  GEOGRAPHY(Point, 4326) NOT NULL,
  category_id           TEXT NOT NULL,
  weight_kg             DECIMAL(10,2),
  volume_m3             DECIMAL(10,2),
  height_cm             DECIMAL(8,2),
  width_cm              DECIMAL(8,2),
  length_cm             DECIMAL(8,2),
  requires_cnh          TEXT,                      -- categoria mínima de CNH
  requires_insurance    BOOLEAN DEFAULT false,
  requires_packaging    BOOLEAN DEFAULT false,
  budget_min            DECIMAL(12,2),
  budget_max            DECIMAL(12,2),
  status                load_status NOT NULL DEFAULT 'open',
  pickup_start          TIMESTAMPTZ,
  pickup_end            TIMESTAMPTZ,
  delivery_start        TIMESTAMPTZ,
  delivery_end          TIMESTAMPTZ,
  photos                JSONB[] DEFAULT '{}',
  special_instructions  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at            TIMESTAMPTZ
);

CREATE INDEX idx_freight_loads_company ON freight_loads (company_id);
CREATE INDEX idx_freight_loads_status ON freight_loads (status);
CREATE INDEX idx_freight_loads_origin ON freight_loads USING GIST (origin_location);
CREATE INDEX idx_freight_loads_dest ON freight_loads USING GIST (destination_location);
CREATE INDEX idx_freight_loads_category ON freight_loads (category_id);
CREATE INDEX idx_freight_loads_created ON freight_loads (created_at DESC);
CREATE INDEX idx_freight_loads_expires ON freight_loads (expires_at) WHERE expires_at IS NOT NULL;
```

**RLS:**

```sql
ALTER TABLE freight_loads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "freight_loads_company_all"
  ON freight_loads FOR ALL
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

CREATE POLICY "freight_loads_driver_select"
  ON freight_loads FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'driver' AND
    status IN ('open', 'bidding')
  );

CREATE POLICY "freight_loads_admin_all"
  ON freight_loads FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

**Realtime:** HABILITADO — canal `freight_loads` (motoristas veem novas cargas em tempo real).

---

### 18. freight_bids

Lances de motoristas em cargas de frete.

```sql
CREATE TABLE freight_bids (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id             UUID NOT NULL REFERENCES freight_loads(id) ON DELETE CASCADE,
  driver_id           UUID NOT NULL REFERENCES profiles(id),
  amount              DECIMAL(12,2) NOT NULL,
  message             TEXT,
  estimated_pickup    TIMESTAMPTZ,
  estimated_delivery  TIMESTAMPTZ,
  status              bid_status NOT NULL DEFAULT 'pending',
  countered_amount    DECIMAL(12,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_freight_bids_load ON freight_bids (load_id);
CREATE INDEX idx_freight_bids_driver ON freight_bids (driver_id);
CREATE INDEX idx_freight_bids_status ON freight_bids (status);
CREATE UNIQUE INDEX idx_freight_bids_unique_active
  ON freight_bids (load_id, driver_id) WHERE status = 'pending';
```

**RLS:**

```sql
ALTER TABLE freight_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "freight_bids_driver_all"
  ON freight_bids FOR ALL
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "freight_bids_company_select"
  ON freight_bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM freight_loads fl
      WHERE fl.id = load_id AND fl.company_id = auth.uid()
    )
  );

CREATE POLICY "freight_bids_company_update"
  ON freight_bids FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM freight_loads fl
      WHERE fl.id = load_id AND fl.company_id = auth.uid()
    ) AND status = 'pending'
  );
```

---

### 19. freight_tracking

Rastreamento de cargas em tempo real.

```sql
CREATE TABLE freight_tracking (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id       UUID NOT NULL REFERENCES freight_loads(id) ON DELETE CASCADE,
  driver_id     UUID NOT NULL REFERENCES profiles(id),
  status        tracking_status NOT NULL,
  location_lat  DOUBLE PRECISION,
  location_lng  DOUBLE PRECISION,
  location      GEOGRAPHY(Point, 4326),
  photo         TEXT,                             -- URL da foto de comprovante
  notes         TEXT,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_freight_tracking_load ON freight_tracking (load_id, timestamp DESC);
CREATE INDEX idx_freight_tracking_driver ON freight_tracking (driver_id);
CREATE INDEX idx_freight_tracking_location ON freight_tracking USING GIST (location) WHERE location IS NOT NULL;
```

**RLS:**

```sql
ALTER TABLE freight_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "freight_tracking_driver_insert"
  ON freight_tracking FOR INSERT
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "freight_tracking_company_select"
  ON freight_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM freight_loads fl
      WHERE fl.id = load_id AND fl.company_id = auth.uid()
    ) OR driver_id = auth.uid()
  );

CREATE POLICY "freight_tracking_admin_select"
  ON freight_tracking FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

**Realtime:** HABILITADO — canal `freight_tracking` (empresa acompanha carga ao vivo).

---

### 20. freight_categories

Catálogo de categorias de frete.

```sql
CREATE TABLE freight_categories (
  id                          TEXT PRIMARY KEY,      -- ex: "small_box", "pallet", "furniture", "vehicle"
  name                        TEXT NOT NULL,
  name_pt                     TEXT NOT NULL,
  icon                        TEXT,                  -- nome do ícone Lucide/Feather
  color                       TEXT,                  -- hex color
  max_weight_kg               DECIMAL(8,2),
  max_volume_m3               DECIMAL(8,2),
  max_height_cm               DECIMAL(6,2),
  max_width_cm                DECIMAL(6,2),
  max_length_cm               DECIMAL(6,2),
  requires_cnh                TEXT,                  -- categoria mínima
  requires_insurance          BOOLEAN DEFAULT false,
  requires_vehicle_documents  BOOLEAN DEFAULT false,
  enabled                     BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_freight_categories_enabled ON freight_categories (enabled) WHERE enabled = true;
```

**RLS:**

```sql
ALTER TABLE freight_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "freight_categories_public_select"
  ON freight_categories FOR SELECT
  USING (true);

CREATE POLICY "freight_categories_admin_all"
  ON freight_categories FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 21. wallets

Carteiras digitais de usuários.

```sql
CREATE TABLE wallets (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance             DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency            TEXT NOT NULL DEFAULT 'BRL',
  total_deposited     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_withdrawn     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_earned        DECIMAL(14,2) NOT NULL DEFAULT 0.00,  -- motoristas
  total_spent         DECIMAL(14,2) NOT NULL DEFAULT 0.00,  -- passageiros
  last_transaction_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallets_user ON wallets (user_id);
```

**RLS:**

```sql
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets_owner_select"
  ON wallets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "wallets_admin_all"
  ON wallets FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 22. transactions

Extrato financeiro de todas as movimentações.

```sql
CREATE TABLE transactions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id               UUID NOT NULL REFERENCES wallets(id),
  user_id                 UUID NOT NULL REFERENCES profiles(id),
  type                    transaction_type NOT NULL,
  amount                  DECIMAL(12,2) NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'BRL',
  status                  transaction_status NOT NULL DEFAULT 'pending',
  payment_method          TEXT,
  stripe_payment_intent_id TEXT,
  reference_type          TEXT,                    -- 'rides' | 'freight_loads' | 'withdrawal' | 'deposit'
  reference_id            UUID,
  description             TEXT,
  metadata                JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_wallet ON transactions (wallet_id, created_at DESC);
CREATE INDEX idx_transactions_user ON transactions (user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions (type);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_stripe ON transactions (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX idx_transactions_reference ON transactions (reference_type, reference_id);
```

**RLS:**

```sql
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_owner_select"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "transactions_admin_all"
  ON transactions FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 23. subscriptions

Assinaturas de empresas (planos B2B).

```sql
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID NOT NULL REFERENCES profiles(id),
  plan                  subscription_plan NOT NULL,
  status                subscription_status NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  current_period_start  TIMESTAMPTZ NOT NULL,
  current_period_end    TIMESTAMPTZ NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_company ON subscriptions (company_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE INDEX idx_subscriptions_stripe ON subscriptions (stripe_subscription_id);
```

**RLS:**

```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_owner_select"
  ON subscriptions FOR SELECT
  USING (company_id = auth.uid());

CREATE POLICY "subscriptions_admin_all"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 24. notifications

Notificações push/in-app para usuários.

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                       -- ride_update, bid_received, payment_received, etc
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',                  -- payload para deep linking
  read        BOOLEAN NOT NULL DEFAULT false,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id, read)
  WHERE read = false;
```

**RLS:**

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_owner_all"
  ON notifications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**Realtime:** HABILITADO — canal `notifications` (badges e notificações instantâneas).

---

### 25. kyc_documents

Documentos enviados para verificação KYC/KYB.

```sql
CREATE TABLE kyc_documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type     TEXT NOT NULL,                 -- passport, driver_license, id_card, selfie, proof_of_address
  document_url      TEXT NOT NULL,                 -- URL assinada do storage
  status            doc_status NOT NULL DEFAULT 'pending',
  rejection_reason  TEXT,
  reviewed_by       UUID REFERENCES profiles(id), -- admin que revisou
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyc_documents_user ON kyc_documents (user_id);
CREATE INDEX idx_kyc_documents_status ON kyc_documents (status);
```

**RLS:**

```sql
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kyc_documents_owner_all"
  ON kyc_documents FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "kyc_documents_admin_select"
  ON kyc_documents FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

CREATE POLICY "kyc_documents_admin_update"
  ON kyc_documents FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

### 26. audit_logs

Auditoria completa de ações administrativas e eventos críticos.

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id),
  action      TEXT NOT NULL,                       -- user.suspended, ride.cancelled, kyc.approved, etc
  entity_type TEXT NOT NULL,                       -- profiles, rides, kyc_documents, wallets
  entity_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);
```

**RLS:**

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_select"
  ON audit_logs FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

CREATE POLICY "audit_logs_system_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (true);                               -- inserção via trigger/função apenas
```

---

### 27. city_configs

Configurações por cidade (sincronizadas do Global Config Service).

```sql
CREATE TABLE city_configs (
  id              TEXT PRIMARY KEY,                 -- BR_SAO_PAULO, MX_CDMX, US_NYC
  country_code    TEXT NOT NULL,                    -- BR, MX, US, ES, PT, IN
  name            TEXT NOT NULL,                    -- São Paulo, Cidade do México, New York
  state           TEXT,
  timezone        TEXT NOT NULL,                    -- America/Sao_Paulo
  locale          TEXT NOT NULL DEFAULT 'pt-BR',
  currency        TEXT NOT NULL DEFAULT 'BRL',
  currency_symbol TEXT NOT NULL DEFAULT 'R$',
  language        TEXT NOT NULL DEFAULT 'pt',
  phone_code      TEXT NOT NULL,                    -- +55, +52, +1
  active          BOOLEAN NOT NULL DEFAULT true,
  config          JSONB NOT NULL DEFAULT '{}',      -- CityConfig completo (regras, taxas, limites)
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_city_configs_country ON city_configs (country_code);
CREATE INDEX idx_city_configs_active ON city_configs (active) WHERE active = true;
```

**RLS:**

```sql
ALTER TABLE city_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "city_configs_public_select"
  ON city_configs FOR SELECT
  USING (true);

CREATE POLICY "city_configs_admin_all"
  ON city_configs FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));
```

---

## Triggers

### updated_at automático (aplicado em todas as tabelas que possuem updated_at)

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em cada tabela (exemplo para profiles)
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Garantir que toda tabela com updated_at tenha o trigger correspondente:
-- drivers, vehicles, rides, freight_bids, freight_loads, companies,
-- driver_ratings, dispatcher_rules, city_configs, wallets,
-- kyc_documents, subscriptions, passengers, passenger_preferences
```

### Auditoria automática em tabelas críticas

```sql
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (
      auth.uid(),
      TG_TABLE_NAME || '.updated',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
    VALUES (
      auth.uid(),
      TG_TABLE_NAME || '.deleted',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar auditoria em tabelas sensíveis: profiles, rides, wallets, kyc_documents
CREATE TRIGGER trg_profiles_audit
  AFTER UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

---

## Functions

### 1. find_nearby_drivers

```sql
CREATE OR REPLACE FUNCTION find_nearby_drivers(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_meters DOUBLE PRECISION DEFAULT 5000,
  p_category_id TEXT DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  driver_id    UUID,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  distance_m   DOUBLE PRECISION,
  heading      DECIMAL,
  battery      INT,
  score        DECIMAL
) LANGUAGE SQL STABLE AS $$
  SELECT
    dl.driver_id,
    dl.lat,
    dl.lng,
    ST_Distance(dl.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS distance_m,
    dl.heading,
    dl.battery_level,
    COALESCE(ds.score, 50) AS score
  FROM driver_locations dl
  LEFT JOIN LATERAL (
    SELECT score FROM driver_scores
    WHERE driver_id = dl.driver_id
    ORDER BY calculated_at DESC
    LIMIT 1
  ) ds ON true
  WHERE dl.is_online = true
    AND ST_DWithin(dl.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
    AND (p_category_id IS NULL OR p_category_id = ANY(dl.category_ids))
  ORDER BY distance_m ASC
  LIMIT p_limit;
$$;
```

### 2. calculate_distance (Haversine)

```sql
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION LANGUAGE SQL IMMUTABLE AS $$
  SELECT ST_Distance(
    ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
  ) / 1000.0;  -- retorna em km
$$;
```

### 3. calculate_ride_fare

```sql
CREATE OR REPLACE FUNCTION calculate_ride_fare(
  p_distance_km DECIMAL,
  p_duration_min DECIMAL,
  p_category_id TEXT,
  p_city_id TEXT,
  p_is_night BOOLEAN DEFAULT false
)
RETURNS TABLE (
  base_fare         DECIMAL,
  distance_fare     DECIMAL,
  time_fare         DECIMAL,
  surge_multiplier  DECIMAL,
  night_multiplier  DECIMAL,
  total_fare        DECIMAL,
  commission        DECIMAL,
  driver_earnings   DECIMAL
) LANGUAGE PLPGSQL STABLE AS $$
DECLARE
  v_config JSONB;
  v_commission_rate DECIMAL;
BEGIN
  -- Buscar configuração da cidade
  SELECT config INTO v_config
  FROM city_configs
  WHERE id = p_city_id;

  -- Extrair valores da config (com fallbacks)
  base_fare := COALESCE((v_config->'fare'->>'baseFare')::DECIMAL, 5.00);
  distance_fare := COALESCE((v_config->'fare'->>'perKm')::DECIMAL, 2.50) * p_distance_km;
  time_fare := COALESCE((v_config->'fare'->>'perMin')::DECIMAL, 0.50) * p_duration_min;
  surge_multiplier := COALESCE((v_config->'fare'->>'surgeMultiplier')::DECIMAL, 1.00);
  night_multiplier := CASE WHEN p_is_night
    THEN COALESCE((v_config->'fare'->>'nightMultiplier')::DECIMAL, 1.20)
    ELSE 1.00
  END;
  v_commission_rate := COALESCE((v_config->'fare'->>'commissionRate')::DECIMAL, 0.20);

  total_fare := (base_fare + distance_fare + time_fare) * surge_multiplier * night_multiplier;
  commission := total_fare * v_commission_rate;
  driver_earnings := total_fare - commission;

  RETURN NEXT;
END;
$$;
```

### 4. create_wallet (on user signup)

```sql
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, currency)
  VALUES (NEW.id, COALESCE(NEW.currency, 'BRL'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_wallet_after_profile_insert
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_wallet_for_new_user();
```

### 5. update_driver_ratings (após corrida completada)

```sql
CREATE OR REPLACE FUNCTION update_driver_ratings_after_ride()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Atualizar ratings do motorista
    INSERT INTO driver_ratings (driver_id, avg_rating, total_ratings, trips_completed)
    VALUES (
      NEW.driver_id,
      NEW.driver_rating,
      1,
      1
    )
    ON CONFLICT (driver_id) DO UPDATE SET
      avg_rating = (
        (driver_ratings.avg_rating * driver_ratings.total_ratings + NEW.driver_rating) /
        (driver_ratings.total_ratings + 1)
      ),
      total_ratings = driver_ratings.total_ratings + 1,
      trips_completed = driver_ratings.trips_completed + 1,
      updated_at = now();

    -- Atualizar estatísticas do motorista
    UPDATE drivers SET
      total_trips = total_trips + 1,
      total_earnings = total_earnings + NEW.driver_earnings,
      current_balance = current_balance + NEW.driver_earnings,
      updated_at = now()
    WHERE driver_id = NEW.driver_id;

    -- Atualizar estatísticas do passageiro
    UPDATE passengers SET
      total_trips = total_trips + 1,
      total_spent = total_spent + NEW.fare,
      updated_at = now()
    WHERE passenger_id = NEW.passenger_id;

    -- Inserir histórico analítico
    INSERT INTO passenger_ride_history (
      passenger_id, ride_id, origin, destination, category_id,
      driver_id, fare, payment_method, rating, day_of_week, hour
    ) VALUES (
      NEW.passenger_id, NEW.id,
      row_to_json(row(NEW.origin_lat, NEW.origin_lng, NEW.origin_address)::origin_type),
      row_to_json(row(NEW.destination_lat, NEW.destination_lng, NEW.destination_address)::dest_type),
      NEW.category_id, NEW.driver_id, NEW.fare, NEW.payment_method,
      NEW.passenger_rating,
      EXTRACT(DOW FROM NEW.completed_at)::INT,
      EXTRACT(HOUR FROM NEW.completed_at)::INT
    );

    -- Atualizar carteira do motorista
    UPDATE wallets SET
      balance = balance + NEW.driver_earnings,
      total_earned = total_earned + NEW.driver_earnings,
      last_transaction_at = now()
    WHERE user_id = NEW.driver_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_driver_after_ride
  AFTER UPDATE ON rides
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_driver_ratings_after_ride();
```

### 6. verify_road_event (após atingir limite de upvotes)

```sql
CREATE OR REPLACE FUNCTION verify_road_event_on_upvotes()
RETURNS TRIGGER AS $$
DECLARE
  v_required_upvotes INT := 3;  -- configurável por cidade
  v_event_status event_status;
BEGIN
  SELECT status INTO v_event_status FROM road_events WHERE id = NEW.event_id;

  IF v_event_status = 'pending' THEN
    UPDATE road_events
    SET
      upvotes = (
        SELECT COUNT(*) FROM event_upvotes
        WHERE event_id = NEW.event_id AND vote = 'upvote'
      ),
      downvotes = (
        SELECT COUNT(*) FROM event_upvotes
        WHERE event_id = NEW.event_id AND vote = 'downvote'
      )
    WHERE id = NEW.event_id;

    -- Auto-verificar se atingiu limite de upvotes
    UPDATE road_events
    SET
      status = 'verified',
      verification_method = 'collaborative',
      verified_by = NEW.driver_id
    WHERE id = NEW.event_id
      AND status = 'pending'
      AND upvotes >= v_required_upvotes
      AND upvotes > downvotes * 2;  -- proporção 2:1
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_verify_event_on_upvote
  AFTER INSERT ON event_upvotes
  FOR EACH ROW EXECUTE FUNCTION verify_road_event_on_upvotes();
```

---

## Realtime — Configuração

No Supabase Dashboard (ou via SQL), habilitar Realtime nas seguintes tabelas:

```sql
-- Habilitar Realtime (publicação via Supabase Realtime)
-- Nota: No Supabase, isso é feito via Dashboard ou API de gerenciamento.
-- As colunas a seguir devem ser publicadas (apenas colunas não sensíveis).

-- Tabelas com Realtime habilitado:
-- 1. driver_locations   -> motoristas publicam posição, dispatch consome
-- 2. rides              -> notificações de mudança de status
-- 3. ride_requests      -> ofertas enviadas a motoristas
-- 4. road_events        -> eventos de trânsito próximos
-- 5. freight_loads      -> novas cargas disponíveis
-- 6. freight_tracking   -> rastreamento ao vivo de cargas
-- 7. notifications      -> notificações push/in-app

-- Template SQL (executar no editor SQL do Supabase):
-- SELECT supabase_realtime.enable_table('public', 'driver_locations');
-- SELECT supabase_realtime.enable_table('public', 'rides');
-- SELECT supabase_realtime.enable_table('public', 'ride_requests');
-- SELECT supabase_realtime.enable_table('public', 'road_events');
-- SELECT supabase_realtime.enable_table('public', 'freight_loads');
-- SELECT supabase_realtime.enable_table('public', 'freight_tracking');
-- SELECT supabase_realtime.enable_table('public', 'notifications');

-- Para habilitar via alteração de tabela (método alternativo):
ALTER TABLE driver_locations REPLICA IDENTITY FULL;
ALTER TABLE rides REPLICA IDENTITY FULL;
ALTER TABLE ride_requests REPLICA IDENTITY FULL;
ALTER TABLE road_events REPLICA IDENTITY FULL;
ALTER TABLE freight_loads REPLICA IDENTITY FULL;
ALTER TABLE freight_tracking REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
```

**Considerações de segurança no Realtime:**

- `driver_locations`: publica apenas `driver_id`, `lat`, `lng`, `heading`, `is_online`, `category_ids` (filtrar no client-side)
- `rides`: publica apenas campos não sensíveis (sem `payment_status`, `commission`, etc.)
- `notifications`: publica `type`, `title`, `body`, `data` (sem `user_id` exposto — usar canal privado por usuário)

---

## Backup Strategy

### 1. Backup Diário Automático (Supabase Pro)

O Supabase já oferece backup automático diário para projetos no plano Pro ou superior:
- Retenção: 7 dias (Pro) / 14 dias (Team) / 30 dias (Enterprise)
- Point-in-Time Recovery (PITR) disponível nos planos superiores
- Backup inclui: schema completo + dados

### 2. Backup Manual via Script (para exportação externa)

```bash
#!/bin/bash
# backup-txapp.sh — executar via cron/scheduler

BACKUP_DIR="/backups/txapp"
DB_URL="postgresql://postgres:[PASSWORD]@db.XXXXX.supabase.co:6543/postgres"
DATE=$(date +%Y-%m-%d_%H-%M)

pg_dump \
  --dbname="$DB_URL" \
  --format=custom \
  --file="$BACKUP_DIR/txapp_$DATE.dump" \
  --verbose \
  --no-owner \
  --compress=9

# Backup dos schemas apenas (para versionamento)
pg_dump \
  --dbname="$DB_URL" \
  --format=plain \
  --file="$BACKUP_DIR/txapp_schema_$DATE.sql" \
  --schema-only \
  --no-owner

# Remover backups mais antigos que 30 dias
find "$BACKUP_DIR" -name "txapp_*.dump" -mtime +30 -delete
find "$BACKUP_DIR" -name "txapp_schema_*.sql" -mtime +30 -delete
```

### 3. Tabelas com prioridade de backup

| Prioridade | Tabelas                          | Justificativa                          |
|------------|----------------------------------|----------------------------------------|
| Crítica    | profiles, rides, wallets, transactions | Dados financeiros e de usuário    |
| Alta       | drivers, vehicles, freight_loads, freight_bids | Dados operacionais |
| Média      | road_events, notifications, kyc_documents | Dados auxiliares          |
| Baixa      | driver_locations, audit_logs     | Dados temporários (locations) ou volumosos |

### 4. Estratégia de Retenção

| Tipo                | Frequência | Retenção | Destino               |
|---------------------|------------|----------|-----------------------|
| Backup automático   | Diário     | 7 dias   | Supabase Cloud        |
| Backup manual full  | Diário     | 30 dias  | AWS S3 / GCS / Azure  |
| Backup schema only  | A cada deploy | Indefinido | Git (versionado) |
| PITR                | Contínuo   | 7 dias   | Supabase Cloud        |

### 5. Restore Procedure

```bash
# Restore completo
pg_restore \
  --dbname="$DB_URL" \
  --clean \
  --if-exists \
  --no-owner \
  "$BACKUP_DIR/txapp_2024-01-01_00-00.dump"

# Restore de tabela específica
pg_restore \
  --dbname="$DB_URL" \
  --table=rides \
  --data-only \
  "$BACKUP_DIR/txapp_2024-01-01_00-00.dump"
```

### 6. Monitoramento

- Verificar diariamente se o backup foi concluído (via Supabase Dashboard ou script de health check)
- Alertas: se o backup falhar por 2+ dias consecutivos, notificar equipe via Slack/PagerDuty
- Teste de restore: executar restore em ambiente de staging a cada 30 dias

---

## Considerações de Performance

### Vácuo e Estatísticas

```sql
-- Configurar auto-vacuum para tabelas de alta rotatividade
ALTER TABLE driver_locations SET (autovacuum_vacuum_scale_factor = 0.01);
ALTER TABLE driver_locations SET (autovacuum_analyze_scale_factor = 0.005);

-- Manter estatísticas atualizadas em tabelas geoespaciais
ANALYZE driver_locations;
ANALYZE road_events;
ANALYZE freight_loads;
```

### Particionamento (futuro)

Para escalar, considerar particionamento por tempo nas tabelas:

- `rides`: particionar por mês (created_at)
- `transactions`: particionar por mês (created_at)
- `audit_logs`: particionar por mês (created_at)
- `passenger_ride_history`: particionar por mês (created_at)

### Conexões e Pooling

- Usar PgBouncer (transaction mode) para conexões vindas de serverless/edge functions
- Pool size: 15-20 conexões padrão (ajustar conforme carga)
- Timeout de idle: 10 minutos
- Prepared statements: habilitar no Supabase config

---

## Migrations Strategy

Todas as mudanças de schema devem ser versionadas via migrações SQL numeradas:

```
supabase/
  migrations/
    20240000000001_create_profiles.sql
    20240000000002_create_rides.sql
    20240000000003_create_driver_locations.sql
    ...
```

Usar o CLI do Supabase para gerenciar migrações:

```bash
supabase migration new add_vehicle_photos
supabase migration up
supabase db diff --use-migra
```

Nunca editar tabelas diretamente no Dashboard em produção. Sempre criar uma migration e aplicar via CI/CD.

---

## Índice Completo de Políticas RLS

| #  | Policy Name                                     | Tabela               | Ação   | Quem                                         |
|----|-------------------------------------------------|----------------------|--------|----------------------------------------------|
| 1  | profiles_owner_select                           | profiles             | SELECT | Proprietário                                 |
| 2  | profiles_admin_select                           | profiles             | SELECT | admin, superadmin                            |
| 3  | profiles_driver_during_ride                     | profiles             | SELECT | Motorista da corrida ativa                   |
| 4  | profiles_owner_update                           | profiles             | UPDATE | Proprietário                                 |
| 5  | profiles_admin_update                           | profiles             | UPDATE | admin, superadmin                            |
| 6  | profiles_insert_restricted                      | profiles             | INSERT | Qualquer (com restrição a roles admin)       |
| 7  | driver_locations_owner_upsert                   | driver_locations     | ALL    | Proprietário                                 |
| 8  | driver_locations_dispatch_select                | driver_locations     | SELECT | Proprietário, admin, superadmin, dispatcher  |
| 9  | driver_locations_passenger_select               | driver_locations     | SELECT | passenger (apenas online)                    |
| 10 | rides_passenger_select                          | rides                | SELECT | Proprietário da corrida                      |
| 11 | rides_driver_select                             | rides                | SELECT | Motorista designado                          |
| 12 | rides_admin_select                              | rides                | SELECT | admin, superadmin                            |
| 13 | rides_passenger_insert                          | rides                | INSERT | Proprietário                                 |
| 14 | rides_driver_update                             | rides                | UPDATE | Motorista designado                          |
| 15 | rides_passenger_cancel                          | rides                | UPDATE | Passageiro (status searching/offered)        |
| 16 | rides_admin_update                              | rides                | UPDATE | admin, superadmin                            |
| 17 | ride_requests_driver_select                     | ride_requests        | SELECT | Motorista alvo                               |
| 18 | ride_requests_driver_update                     | ride_requests        | UPDATE | Motorista (apenas se pending -> accepted/rejected) |
| 19 | ride_requests_admin_all                         | ride_requests        | ALL    | admin, superadmin                            |
| 20 | dispatcher_rules_admin_all                      | dispatcher_rules     | ALL    | admin, superadmin, dispatcher                |
| 21 | dispatcher_rules_read_all                       | dispatcher_rules     | SELECT | Todos                                        |
| 22 | driver_scores_driver_select                     | driver_scores        | SELECT | Proprietário                                 |
| 23 | driver_scores_admin_all                         | driver_scores        | ALL    | admin, superadmin, dispatcher                |
| 24 | driver_ratings_public_select                    | driver_ratings       | SELECT | Todos                                        |
| 25 | driver_ratings_driver_select                    | driver_ratings       | SELECT | Proprietário                                 |
| 26 | driver_ratings_admin_update                     | driver_ratings       | UPDATE | admin, superadmin                            |
| 27 | passengers_owner_select                         | passengers           | SELECT | Proprietário                                 |
| 28 | passengers_owner_update                         | passengers           | UPDATE | Proprietário                                 |
| 29 | passengers_admin_all                            | passengers           | ALL    | admin, superadmin                            |
| 30 | companies_owner_select                          | companies            | SELECT | Proprietário                                 |
| 31 | companies_driver_select                         | companies            | SELECT | driver                                       |
| 32 | companies_owner_update                          | companies            | UPDATE | Proprietário                                 |
| 33 | companies_admin_all                             | companies            | ALL    | admin, superadmin                            |
| 34 | drivers_owner_all                               | drivers              | ALL    | Proprietário                                 |
| 35 | drivers_admin_all                               | drivers              | ALL    | admin, superadmin                            |
| 36 | drivers_public_select                           | drivers              | SELECT | admin, superadmin, dispatcher                |
| 37 | vehicles_owner_all                              | vehicles             | ALL    | Proprietário (donos do veículo)              |
| 38 | vehicles_admin_all                              | vehicles             | ALL    | admin, superadmin                            |
| 39 | road_events_public_select                       | road_events          | SELECT | Todos (apenas verified/pending)              |
| 40 | road_events_driver_insert                       | road_events          | INSERT | driver, passenger                            |
| 41 | road_events_admin_all                           | road_events          | ALL    | admin, superadmin                            |
| 42 | road_events_reporter_update                     | road_events          | UPDATE | Reportador (apenas pending)                  |
| 43 | driver_road_reputation_public_select            | driver_road_reputation | SELECT | Todos                                      |
| 44 | driver_road_reputation_admin_update             | driver_road_reputation | ALL    | admin, superadmin                            |
| 45 | event_upvotes_driver_all                        | event_upvotes        | ALL    | Proprietário do voto                         |
| 46 | event_upvotes_admin_select                      | event_upvotes        | SELECT | admin, superadmin                            |
| 47 | passenger_preferences_owner_all                 | passenger_preferences | ALL    | Proprietário                                 |
| 48 | passenger_preferences_admin_select              | passenger_preferences | SELECT | admin, superadmin                            |
| 49 | passenger_ride_history_owner_select             | passenger_ride_history | SELECT | Proprietário                               |
| 50 | passenger_ride_history_admin_select             | passenger_ride_history | SELECT | admin, superadmin                            |
| 51 | freight_loads_company_all                       | freight_loads        | ALL    | Empresa proprietária                         |
| 52 | freight_loads_driver_select                     | freight_loads        | SELECT | driver (apenas open/bidding)                 |
| 53 | freight_loads_admin_all                         | freight_loads        | ALL    | admin, superadmin                            |
| 54 | freight_bids_driver_all                         | freight_bids         | ALL    | Motorista que deu o lance                    |
| 55 | freight_bids_company_select                     | freight_bids         | SELECT | Empresa dona da carga                        |
| 56 | freight_bids_company_update                     | freight_bids         | UPDATE | Empresa dona da carga (apenas pending)       |
| 57 | freight_tracking_driver_insert                  | freight_tracking     | INSERT | Motorista designado                          |
| 58 | freight_tracking_company_select                 | freight_tracking     | SELECT | Empresa dona da carga ou motorista           |
| 59 | freight_tracking_admin_select                   | freight_tracking     | SELECT | admin, superadmin                            |
| 60 | freight_categories_public_select                | freight_categories   | SELECT | Todos                                        |
| 61 | freight_categories_admin_all                    | freight_categories   | ALL    | admin, superadmin                            |
| 62 | wallets_owner_select                            | wallets              | SELECT | Proprietário                                 |
| 63 | wallets_admin_all                               | wallets              | ALL    | admin, superadmin                            |
| 64 | transactions_owner_select                       | transactions         | SELECT | Proprietário                                 |
| 65 | transactions_admin_all                          | transactions         | ALL    | admin, superadmin                            |
| 66 | subscriptions_owner_select                      | subscriptions        | SELECT | Empresa assinante                            |
| 67 | subscriptions_admin_all                         | subscriptions        | ALL    | admin, superadmin                            |
| 68 | notifications_owner_all                         | notifications        | ALL    | Proprietário                                 |
| 69 | kyc_documents_owner_all                         | kyc_documents        | ALL    | Proprietário                                 |
| 70 | kyc_documents_admin_select                      | kyc_documents        | SELECT | admin, superadmin                            |
| 71 | kyc_documents_admin_update                      | kyc_documents        | UPDATE | admin, superadmin                            |
| 72 | audit_logs_admin_select                         | audit_logs           | SELECT | admin, superadmin                            |
| 73 | audit_logs_system_insert                        | audit_logs           | INSERT | Todos (via trigger)                          |
| 74 | city_configs_public_select                      | city_configs         | SELECT | Todos                                        |
| 75 | city_configs_admin_all                          | city_configs         | ALL    | admin, superadmin                            |

---

## Padrão de Nomenclatura

| Tipo          | Padrão                          | Exemplo                              |
|---------------|---------------------------------|--------------------------------------|
| Tabelas       | plural snake_case               | `profiles`, `ride_requests`          |
| Colunas       | snake_case                      | `origin_address`, `kyc_status`       |
| PK            | `id` UUID                       | `id UUID DEFAULT uuid_generate_v4()` |
| FK            | `{tabela}_id`                   | `passenger_id`, `driver_id`          |
| Índices       | `idx_{tabela}_{coluna}[_sufixo]` | `idx_profiles_email`                |
| Triggers      | `trg_{tabela}_{descricao}`       | `trg_profiles_updated_at`           |
| Functions     | verb_snake_case                 | `find_nearby_drivers`               |
| RLS Policies  | `{tabela}_{role}_{acao}`         | `profiles_owner_select`             |
| Enums         | snake_case values                | `ride_status`, `payment_status`     |
| JSONB keys    | camelCase                       | `baseFare`, `surgeMultiplier`        |
| Constraint    | `{tabela}_{coluna}_check`        | `rides_driver_rating_check`         |

---

## Checklist de Deploy

- [ ] Extensões habilitadas (uuid-ossp, pgcrypto, postgis, pg_trgm)
- [ ] Enums criados antes das tabelas que os referenciam
- [ ] Todas as tabelas com `updated_at` trigger
- [ ] Todas as tabelas com RLS habilitado
- [ ] Índices GiST para tabelas geoespaciais (driver_locations, road_events, freight_loads)
- [ ] Realtime habilitado apenas nas tabelas necessárias
- [ ] Trigger de criação de wallet na inserção de profile
- [ ] Trigger de atualização de ratings após corrida
- [ ] Função `find_nearby_drivers` testada com explain analyze
- [ ] Backup automático configurado (diário + PITR)
- [ ] Migrações versionadas no diretório `supabase/migrations/`
- [ ] Testes de RLS: cada policy testada com diferentes roles
- [ ] Performance: `EXPLAIN ANALYZE` nas queries mais frequentes
- [ ] Configuração de `REPLICA IDENTITY FULL` em tabelas Realtime
