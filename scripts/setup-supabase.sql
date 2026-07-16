-- =========================================================================
-- TXDAPP - SETUP COMPLETO DO SUPABASE
-- =========================================================================
-- COMO USAR:
-- 1. Acesse https://supabase.com/dashboard/project/hqydwwfulatawjpottlf
-- 2. Vá em SQL Editor
-- 3. Cole TODO este SQL e execute
-- =========================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. FUNÇÃO handle_updated_at (usada em triggers)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'company', 'transporter', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE driver_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE address_type AS ENUM ('home', 'work', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('cnh', 'selfie', 'vehicle_doc', 'vehicle_photo', 'company_photo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE road_event_type AS ENUM ('accident', 'traffic_jam', 'road_work', 'police', 'speed_camera', 'gas_station', 'ev_station', 'toll', 'weather_hazard');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE distance_unit AS ENUM ('km', 'mi');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE currency_code AS ENUM ('BRL', 'USD', 'EUR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE driver_live_status AS ENUM ('OFFLINE', 'ONLINE', 'AVAILABLE', 'RESERVED', 'GOING_TO_PICKUP', 'WAITING_PASSENGER', 'IN_TRIP', 'IN_DELIVERY', 'IN_FREIGHT', 'PAUSED', 'EMERGENCY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE trip_status AS ENUM ('REQUEST_CREATED', 'SEARCHING_DRIVER', 'DRIVER_NOTIFIED', 'DRIVER_ACCEPTED', 'GOING_TO_PICKUP', 'ARRIVED', 'PASSENGER_ON_BOARD', 'IN_PROGRESS', 'FINISHING', 'COMPLETED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'FINISHED', 'CANCELLED', 'NO_DRIVER_FOUND', 'TIMEOUT', 'EXPIRED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =========================================================================
-- 4. TABELAS
-- =========================================================================

-- 4.1 PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'passenger',
    country TEXT DEFAULT 'BR',
    language TEXT DEFAULT 'pt-BR',
    accepted_terms BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.2 DRIVER_PROFILES
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    cpf TEXT UNIQUE NOT NULL,
    birth_date DATE,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'BR',
    status driver_status DEFAULT 'pending',
    current_live_status driver_live_status DEFAULT 'OFFLINE',
    acceptance_rate DECIMAL(5,2) DEFAULT 100.00,
    cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_trips INTEGER DEFAULT 0,
    online_time_hours DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.3 VEHICLES
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    license_plate TEXT UNIQUE NOT NULL,
    brand TEXT,
    model TEXT,
    color TEXT,
    year INTEGER,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.4 COMPANIES
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    corporate_name TEXT NOT NULL,
    trade_name TEXT,
    cnpj TEXT UNIQUE NOT NULL,
    responsible_name TEXT NOT NULL,
    address TEXT,
    opening_hours TEXT,
    service_description TEXT,
    status driver_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.5 ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT gen_random_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type address_type DEFAULT 'other',
    full_address TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.6 DOCUMENTS
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    url TEXT NOT NULL,
    status driver_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.7 RATINGS
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rater_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ratee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ride_id UUID,
    score INTEGER CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.8 CITIES
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    currency currency_code DEFAULT 'BRL',
    unit distance_unit DEFAULT 'km',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.9 VEHICLE_CATEGORIES
CREATE TABLE IF NOT EXISTS public.vehicle_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    max_passengers INTEGER DEFAULT 0,
    max_load_weight_kg DECIMAL(10,2) DEFAULT 0,
    max_load_volume_m3 DECIMAL(10,2) DEFAULT 0,
    requires_special_license BOOLEAN DEFAULT FALSE,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.10 PRICING_RULES
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    vehicle_category_id UUID REFERENCES public.vehicle_categories(id) ON DELETE CASCADE,
    base_fare DECIMAL(10,2) NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    price_per_minute DECIMAL(10,2) NOT NULL,
    min_fare DECIMAL(10,2) NOT NULL,
    platform_fee_percent DECIMAL(5,2) DEFAULT 15.00,
    surge_multiplier DECIMAL(5,2) DEFAULT 1.00,
    max_dispatch_radius_km DECIMAL(10,2) DEFAULT 5.0,
    search_expansion_interval_sec INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.11 ROAD_EVENTS
CREATE TABLE IF NOT EXISTS public.road_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id),
    type road_event_type NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    reported_by UUID REFERENCES public.profiles(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.12 DRIVER_HEARTBEATS
CREATE TABLE IF NOT EXISTS public.driver_heartbeats (
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    heading DECIMAL(5,2),
    speed DECIMAL(5,2),
    accuracy DECIMAL(10,2),
    battery_level INTEGER,
    status driver_live_status NOT NULL,
    last_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.13 TRACKING_HISTORY
CREATE TABLE IF NOT EXISTS public.tracking_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
    ride_id UUID,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    heading DECIMAL(5,2),
    speed DECIMAL(5,2),
    recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.14 TRIPS
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    passenger_id UUID REFERENCES public.profiles(id) NOT NULL,
    driver_id UUID REFERENCES public.driver_profiles(id),
    vehicle_category_id UUID REFERENCES public.vehicle_categories(id) NOT NULL,
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lng DOUBLE PRECISION NOT NULL,
    origin_address TEXT NOT NULL,
    dest_lat DOUBLE PRECISION NOT NULL,
    dest_lng DOUBLE PRECISION NOT NULL,
    dest_address TEXT NOT NULL,
    status trip_status DEFAULT 'REQUEST_CREATED' NOT NULL,
    estimated_distance_km DECIMAL(10,2) NOT NULL,
    estimated_duration_min INTEGER NOT NULL,
    estimated_fare DECIMAL(10,2) NOT NULL,
    final_fare DECIMAL(10,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    accepted_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- 4.15 TRIP_OFFERS
CREATE TABLE IF NOT EXISTS public.trip_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.driver_profiles(id) NOT NULL,
    status TEXT DEFAULT 'PENDING',
    score_calculated DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- =========================================================================
-- 5. TRIGGERS (updated_at)
-- =========================================================================

CREATE OR REPLACE FUNCTION create_updated_at_trigger(tbl text) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_' || tbl || '_updated_at'
    ) THEN
        EXECUTE format(
            'CREATE TRIGGER set_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()',
            tbl, tbl
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT create_updated_at_trigger('profiles');
SELECT create_updated_at_trigger('driver_profiles');
SELECT create_updated_at_trigger('vehicles');
SELECT create_updated_at_trigger('companies');
SELECT create_updated_at_trigger('driver_heartbeats');

-- =========================================================================
-- 6. SEEDS (Categorias base)
-- =========================================================================

INSERT INTO public.vehicle_categories (name, display_name, max_passengers, max_load_weight_kg, max_load_volume_m3, requires_special_license)
VALUES 
    ('car', 'Carro Popular', 4, 0, 0, FALSE),
    ('moto', 'Moto', 1, 20, 0, FALSE),
    ('van', 'Van de Carga', 0, 1500, 10, FALSE),
    ('truck', 'Caminhão', 0, 8000, 40, TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.cities (name, state, country, currency, unit, timezone)
VALUES ('São Paulo', 'SP', 'BR', 'BRL', 'km', 'America/Sao_Paulo')
ON CONFLICT DO NOTHING;

-- =========================================================================
-- 7. ROW LEVEL SECURITY
-- =========================================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.profiles;
CREATE POLICY "Usuários podem ver seus próprios perfis" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Inserir próprio perfil" ON public.profiles;
CREATE POLICY "Inserir próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Driver Profiles
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Motoristas podem ver seus dados" ON public.driver_profiles;
CREATE POLICY "Motoristas podem ver seus dados" ON public.driver_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Motoristas podem atualizar seus dados" ON public.driver_profiles;
CREATE POLICY "Motoristas podem atualizar seus dados" ON public.driver_profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Inserir próprio driver profile" ON public.driver_profiles;
CREATE POLICY "Inserir próprio driver profile" ON public.driver_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Motoristas podem gerenciar seus veículos" ON public.vehicles;
CREATE POLICY "Motoristas podem gerenciar seus veículos" ON public.vehicles FOR ALL USING (auth.uid() = driver_id);

-- Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Empresas podem gerenciar seus perfis" ON public.companies;
CREATE POLICY "Empresas podem gerenciar seus perfis" ON public.companies FOR ALL USING (auth.uid() = id);

-- Addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus endereços" ON public.addresses;
CREATE POLICY "Usuários podem gerenciar seus endereços" ON public.addresses FOR ALL USING (auth.uid() = profile_id);

-- Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver seus documentos" ON public.documents;
CREATE POLICY "Usuários podem ver seus documentos" ON public.documents FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Usuários podem enviar documentos" ON public.documents;
CREATE POLICY "Usuários podem enviar documentos" ON public.documents FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Cities
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de cidades" ON public.cities;
CREATE POLICY "Leitura pública de cidades" ON public.cities FOR SELECT USING (true);

-- Vehicle Categories
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de categorias" ON public.vehicle_categories;
CREATE POLICY "Leitura pública de categorias" ON public.vehicle_categories FOR SELECT USING (true);

-- Pricing Rules
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de preços" ON public.pricing_rules;
CREATE POLICY "Leitura pública de preços" ON public.pricing_rules FOR SELECT USING (true);

-- Road Events
ALTER TABLE public.road_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de eventos viários" ON public.road_events;
CREATE POLICY "Leitura pública de eventos viários" ON public.road_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Motoristas verificados podem reportar eventos" ON public.road_events;
CREATE POLICY "Motoristas verificados podem reportar eventos" ON public.road_events FOR INSERT WITH CHECK (
    auth.uid() = reported_by AND EXISTS (
        SELECT 1 FROM public.driver_profiles WHERE id = auth.uid() AND status = 'approved'
    )
);

-- Driver Heartbeats
ALTER TABLE public.driver_heartbeats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Motoristas atualizam próprio heartbeat" ON public.driver_heartbeats;
CREATE POLICY "Motoristas atualizam próprio heartbeat" ON public.driver_heartbeats FOR ALL USING (auth.uid() = driver_id);
DROP POLICY IF EXISTS "Leitura pública de heartbeats ativos" ON public.driver_heartbeats;
CREATE POLICY "Leitura pública de heartbeats ativos" ON public.driver_heartbeats FOR SELECT USING (status != 'OFFLINE');

-- Tracking History
ALTER TABLE public.tracking_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Motoristas gravam próprio histórico" ON public.tracking_history;
CREATE POLICY "Motoristas gravam próprio histórico" ON public.tracking_history FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Passageiro vê próprias viagens" ON public.trips;
CREATE POLICY "Passageiro vê próprias viagens" ON public.trips FOR SELECT USING (auth.uid() = passenger_id);
DROP POLICY IF EXISTS "Passageiro cria viagens" ON public.trips;
CREATE POLICY "Passageiro cria viagens" ON public.trips FOR INSERT WITH CHECK (auth.uid() = passenger_id);
DROP POLICY IF EXISTS "Motorista vê viagens vinculadas" ON public.trips;
CREATE POLICY "Motorista vê viagens vinculadas" ON public.trips FOR SELECT USING (auth.uid() = driver_id);

-- Trip Offers
ALTER TABLE public.trip_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Motorista vê próprias ofertas" ON public.trip_offers;
CREATE POLICY "Motorista vê próprias ofertas" ON public.trip_offers FOR SELECT USING (auth.uid() = driver_id);
DROP POLICY IF EXISTS "Motorista atualiza própria oferta" ON public.trip_offers;
CREATE POLICY "Motorista atualiza própria oferta" ON public.trip_offers FOR UPDATE USING (auth.uid() = driver_id);

-- =========================================================================
-- 8. STORAGE BUCKETS
-- =========================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('drivers', 'drivers', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('companies', 'companies', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicles', 'vehicles', false) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Avatar público" ON storage.objects;
CREATE POLICY "Avatar público" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Upload de avatar próprio" ON storage.objects;
CREATE POLICY "Upload de avatar próprio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Ler próprios docs motorista" ON storage.objects;
CREATE POLICY "Ler próprios docs motorista" ON storage.objects FOR SELECT USING (bucket_id = 'drivers' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Upload próprios docs motorista" ON storage.objects;
CREATE POLICY "Upload próprios docs motorista" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'drivers' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Ler próprios documentos" ON storage.objects;
CREATE POLICY "Ler próprios documentos" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Upload próprios documentos" ON storage.objects;
CREATE POLICY "Upload próprios documentos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Ler próprios docs empresa" ON storage.objects;
CREATE POLICY "Ler próprios docs empresa" ON storage.objects FOR SELECT USING (bucket_id = 'companies' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Upload próprios docs empresa" ON storage.objects;
CREATE POLICY "Upload próprios docs empresa" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'companies' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Ler fotos próprio veículo" ON storage.objects;
CREATE POLICY "Ler fotos próprio veículo" ON storage.objects FOR SELECT USING (bucket_id = 'vehicles' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Upload fotos veículo" ON storage.objects;
CREATE POLICY "Upload fotos veículo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =========================================================================
-- 9. REALTIME
-- =========================================================================

-- =========================================================================
-- 10. VERIFICAÇÃO
-- =========================================================================

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('profiles','driver_profiles','vehicles','companies','addresses','documents','ratings','cities','vehicle_categories','pricing_rules','road_events','driver_heartbeats','tracking_history','trips','trip_offers')
ORDER BY table_name;
