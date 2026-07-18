-- =========================================================================
-- TXDAPP - COMPLETE DATABASE MIGRATION
-- =========================================================================
-- Pode ser executado integralmente no Supabase SQL Editor.
-- 100% idempotente: seguro rodar em qualquer estado do banco.
-- =========================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- =========================================================================
-- Tipos ENUM (com proteção contra duplicate_object)
-- =========================================================================
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'company', 'transporter', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE driver_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE address_type AS ENUM ('home', 'work', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('cnh', 'selfie', 'vehicle_doc', 'vehicle_photo'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE road_event_type AS ENUM ('accident','traffic_jam','road_work','police','speed_camera','gas_station','ev_station','toll','weather_hazard'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE distance_unit AS ENUM ('km', 'mi'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE currency_code AS ENUM ('BRL', 'USD', 'EUR'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE driver_live_status AS ENUM ('OFFLINE','ONLINE','AVAILABLE','RESERVED','GOING_TO_PICKUP','WAITING_PASSENGER','IN_TRIP','IN_DELIVERY','IN_FREIGHT','PAUSED','EMERGENCY'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE trip_status AS ENUM ('REQUEST_CREATED','SEARCHING_DRIVER','DRIVER_NOTIFIED','DRIVER_ACCEPTED','GOING_TO_PICKUP','ARRIVED','PASSENGER_ON_BOARD','IN_PROGRESS','FINISHING','COMPLETED','PAYMENT_PENDING','PAYMENT_CONFIRMED','FINISHED','CANCELLED','NO_DRIVER_FOUND','TIMEOUT','EXPIRED','REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ENUM values adicionais
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'employee';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'cnh_selfie';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'crlv';

-- =========================================================================
-- Tabelas: Estrutura Base (Migration 1)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'passenger',
    country TEXT DEFAULT 'BR',
    language TEXT DEFAULT 'pt-BR',
    accepted_terms BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.driver_profiles (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    cpf TEXT UNIQUE NOT NULL,
    birth_date DATE,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'BR',
    status driver_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    license_plate TEXT UNIQUE NOT NULL,
    brand TEXT,
    model TEXT,
    color TEXT,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    corporate_name TEXT NOT NULL,
    trade_name TEXT,
    cnpj TEXT UNIQUE NOT NULL,
    responsible_name TEXT NOT NULL,
    address TEXT,
    status driver_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type address_type DEFAULT 'other',
    full_address TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    url TEXT NOT NULL,
    status driver_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rater_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ratee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ride_id UUID,
    score INTEGER CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Base
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Policies Base
DO $$ BEGIN CREATE POLICY "Usuários podem ver seus próprios perfis" ON public.profiles FOR SELECT USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Usuários podem inserir próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON public.profiles FOR UPDATE USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motoristas podem ver seus dados" ON public.driver_profiles FOR SELECT USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motoristas podem inserir seus dados" ON public.driver_profiles FOR INSERT WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motoristas podem atualizar seus dados" ON public.driver_profiles FOR UPDATE USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motoristas podem gerenciar seus veículos" ON public.vehicles FOR ALL USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Empresas podem gerenciar seus perfis" ON public.companies FOR ALL USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Usuários podem gerenciar seus endereços" ON public.addresses FOR ALL USING (auth.uid() = profile_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Usuários podem ver seus documentos" ON public.documents FOR SELECT USING (auth.uid() = profile_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Usuários podem enviar documentos" ON public.documents FOR INSERT WITH CHECK (auth.uid() = profile_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now()); RETURN NEW; END; $$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- Storage Buckets (Migration 2)
-- =========================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('drivers', 'drivers', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('companies', 'companies', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicles', 'vehicles', false) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN CREATE POLICY "Avatar público" ON storage.objects FOR SELECT USING (bucket_id = 'avatars'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Upload de avatar próprio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Ler próprios documentos de motorista" ON storage.objects FOR SELECT USING (bucket_id = 'drivers' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Upload de próprios documentos de motorista" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'drivers' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Ler próprios documentos" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Upload de próprios documentos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Ler próprios documentos da empresa" ON storage.objects FOR SELECT USING (bucket_id = 'companies' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Upload de próprios documentos da empresa" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'companies' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Ler fotos do próprio veículo" ON storage.objects FOR SELECT USING (bucket_id = 'vehicles' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Upload de fotos do veículo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicles' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =========================================================================
-- Mobility Engine (Migration 3): cidades, preços, eventos
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    currency currency_code DEFAULT 'BRL',
    unit distance_unit DEFAULT 'km',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    vehicle_category TEXT NOT NULL,
    base_fare DECIMAL(10,2) NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    price_per_minute DECIMAL(10,2) NOT NULL,
    min_fare DECIMAL(10,2) NOT NULL,
    platform_fee_percent DECIMAL(5,2) DEFAULT 15.00,
    surge_multiplier DECIMAL(5,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.road_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id),
    type road_event_type NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    reported_by UUID REFERENCES public.profiles(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Leitura pública de cidades" ON public.cities FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Leitura pública de preços" ON public.pricing_rules FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Leitura pública de eventos viários" ON public.road_events FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motoristas verificados podem reportar eventos" ON public.road_events FOR INSERT WITH CHECK (auth.uid() = reported_by AND EXISTS (SELECT 1 FROM public.driver_profiles WHERE id = auth.uid() AND status = 'approved')); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =========================================================================
-- Vehicle Categories (Migration 4)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.vehicle_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    max_passengers INTEGER DEFAULT 0,
    max_load_weight_kg DECIMAL(10,2) DEFAULT 0,
    max_load_volume_m3 DECIMAL(10,2) DEFAULT 0,
    requires_special_license BOOLEAN DEFAULT FALSE,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pricing_rules DROP COLUMN IF EXISTS vehicle_category;
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS vehicle_category_id UUID REFERENCES public.vehicle_categories(id) ON DELETE CASCADE;
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS max_dispatch_radius_km DECIMAL(10,2) DEFAULT 5.0;
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS search_expansion_interval_sec INTEGER DEFAULT 15;

INSERT INTO public.vehicle_categories (name, display_name, max_passengers) VALUES ('car', 'Carro Popular', 4) ON CONFLICT (name) DO NOTHING;
INSERT INTO public.vehicle_categories (name, display_name, max_passengers, max_load_weight_kg) VALUES ('moto', 'Moto', 1, 20) ON CONFLICT (name) DO NOTHING;
INSERT INTO public.vehicle_categories (name, display_name, max_passengers, max_load_weight_kg, max_load_volume_m3) VALUES ('van', 'Van de Carga', 0, 1500, 10) ON CONFLICT (name) DO NOTHING;
INSERT INTO public.vehicle_categories (name, display_name, max_passengers, max_load_weight_kg, max_load_volume_m3, requires_special_license) VALUES ('truck', 'Caminhão', 0, 8000, 40, TRUE) ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Leitura pública de categorias" ON public.vehicle_categories FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =========================================================================
-- Live Tracking (Migration 5): heartbeats, tracking_history
-- =========================================================================
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS current_live_status driver_live_status DEFAULT 'OFFLINE';

CREATE TABLE IF NOT EXISTS public.driver_heartbeats (
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    heading DECIMAL(5,2),
    speed DECIMAL(5,2),
    accuracy DECIMAL(10,2),
    battery_level INTEGER,
    status driver_live_status NOT NULL,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tracking_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
    ride_id UUID,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    heading DECIMAL(5,2),
    speed DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_heartbeats;

ALTER TABLE public.driver_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Motoristas atualizam próprio heartbeat" ON public.driver_heartbeats FOR ALL USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Leitura pública de heartbeats ativos" ON public.driver_heartbeats FOR SELECT USING (status != 'OFFLINE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motoristas gravam próprio histórico" ON public.tracking_history FOR INSERT WITH CHECK (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DROP TRIGGER IF EXISTS update_driver_heartbeats_updated_at ON public.driver_heartbeats;
CREATE TRIGGER update_driver_heartbeats_updated_at BEFORE UPDATE ON public.driver_heartbeats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- Smart Dispatcher (Migration 6): trips, trip_offers
-- =========================================================================
ALTER TABLE public.driver_profiles
ADD COLUMN IF NOT EXISTS acceptance_rate DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS online_time_hours DECIMAL(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.trips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.trip_offers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.driver_profiles(id) NOT NULL,
    status TEXT DEFAULT 'PENDING',
    score_calculated DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_offers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Passageiro vê próprias viagens" ON public.trips FOR SELECT USING (auth.uid() = passenger_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Passageiro cria viagens" ON public.trips FOR INSERT WITH CHECK (auth.uid() = passenger_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motorista vê viagens vinculadas a ele" ON public.trips FOR SELECT USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motorista vê próprias ofertas" ON public.trip_offers FOR SELECT USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motorista atualiza própria oferta" ON public.trip_offers FOR UPDATE USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =========================================================================
-- Biometric & Sub-profile (Migration 7): modalidades, biometria, CRM
-- =========================================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sub_profile TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS push_subscription JSONB DEFAULT NULL;

ALTER TABLE public.driver_profiles
ADD COLUMN IF NOT EXISTS modalities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.biometric_credentials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
    device_type TEXT DEFAULT 'platform',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.employee_profiles (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    department TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    invite_token TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    segment TEXT NOT NULL,
    channel TEXT NOT NULL,
    template TEXT NOT NULL,
    coupon_code TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.company_clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_order_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_clients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Usuários veem próprias credenciais" ON public.biometric_credentials FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Usuários inserem próprias credenciais" ON public.biometric_credentials FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Usuários deletam próprias credenciais" ON public.biometric_credentials FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Funcionários veem próprio perfil" ON public.employee_profiles FOR SELECT USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Funcionários inserem próprio perfil" ON public.employee_profiles FOR INSERT WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Empresa gerencia funcionários" ON public.employee_profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.companies WHERE id = employee_profiles.company_id AND id = auth.uid())); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Empresa gerencia campanhas" ON public.campaigns FOR ALL USING (auth.uid() = company_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Empresa vê próprios clientes" ON public.company_clients FOR SELECT USING (auth.uid() = company_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Empresa insere clientes" ON public.company_clients FOR INSERT WITH CHECK (auth.uid() = company_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Empresa atualiza clientes" ON public.company_clients FOR UPDATE USING (auth.uid() = company_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DROP TRIGGER IF EXISTS update_employee_profiles_updated_at ON public.employee_profiles;
CREATE TRIGGER update_employee_profiles_updated_at BEFORE UPDATE ON public.employee_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_clients_updated_at ON public.company_clients;
CREATE TRIGGER update_company_clients_updated_at BEFORE UPDATE ON public.company_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- Geo Indexes (Migration 8): índices espaciais e performance
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_driver_heartbeats_location ON public.driver_heartbeats USING GIST (ll_to_earth(lat, lng));
CREATE INDEX IF NOT EXISTS idx_driver_heartbeats_status_time ON public.driver_heartbeats (status, last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_company ON public.driver_profiles (company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracking_history_driver_time ON public.tracking_history (driver_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_passenger ON public.trips (passenger_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON public.trips (driver_id, created_at DESC);

-- =========================================================================
-- Freight Tables (Migration 9): cargas, lances, tracking, carteira
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.loads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    origin_address TEXT NOT NULL,
    origin_lat DOUBLE PRECISION, origin_lng DOUBLE PRECISION,
    dest_address TEXT NOT NULL,
    dest_lat DOUBLE PRECISION, dest_lng DOUBLE PRECISION,
    description TEXT, weight_kg DECIMAL(10,2), volume_m3 DECIMAL(10,2),
    vehicle_type TEXT DEFAULT 'carro', photos TEXT[] DEFAULT '{}',
    pickup_date TIMESTAMP WITH TIME ZONE, delivery_date TIMESTAMP WITH TIME ZONE,
    budget_min DECIMAL(10,2), budget_max DECIMAL(10,2),
    status TEXT DEFAULT 'open', accepted_bid_id UUID,
    customer_name TEXT, customer_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE NOT NULL,
    transporter_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL, message TEXT, status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.freight_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    lat DOUBLE PRECISION, lng DOUBLE PRECISION,
    status TEXT DEFAULT 'pending', description TEXT,
    updated_by UUID REFERENCES public.driver_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0 NOT NULL,
    deposit_required DECIMAL(10,2) DEFAULT 0,
    is_qualified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Clientes veem próprias cargas" ON public.loads FOR SELECT USING (auth.uid() = customer_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Transportadores veem cargas abertas" ON public.loads FOR SELECT USING (status = 'open'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Clientes inserem cargas" ON public.loads FOR INSERT WITH CHECK (auth.uid() = customer_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Clientes atualizam próprias cargas" ON public.loads FOR UPDATE USING (auth.uid() = customer_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Transportadores veem próprios lances" ON public.bids FOR SELECT USING (auth.uid() = transporter_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Clientes veem lances das próprias cargas" ON public.bids FOR SELECT USING (EXISTS (SELECT 1 FROM public.loads WHERE id = bids.load_id AND customer_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Transportadores criam lances" ON public.bids FOR INSERT WITH CHECK (auth.uid() = transporter_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Usuários veem própria carteira" ON public.wallets FOR SELECT USING (auth.uid() = profile_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_loads_customer ON public.loads (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_load ON public.bids (load_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_transporter ON public.bids (transporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_freight_tracking_code ON public.freight_tracking (code);
CREATE INDEX IF NOT EXISTS idx_wallets_profile ON public.wallets (profile_id);

-- =========================================================================
-- FIM - TXDAPP COMPLETE DATABASE MIGRATION
-- =========================================================================
