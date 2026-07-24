-- =============================================================================
-- TXAP — MIGRAÇÃO COMPLETA DO BANCO DE DADOS
-- Data: Julho 2026
-- Instrução: Rode UMA VEZ no SQL Editor do Supabase
-- Seguro para re-executar (idempotente)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. EXTENSÕES
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- 2. TIPOS ENUM
-- =============================================================================
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'company', 'transporter', 'admin', 'driver_moto', 'driver_car', 'freight', 'business', 'employee'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE driver_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE address_type AS ENUM ('home', 'work', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('cnh', 'selfie', 'vehicle_doc', 'vehicle_photo'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE road_event_type AS ENUM ('accident', 'traffic_jam', 'road_work', 'police', 'speed_camera', 'gas_station', 'ev_station', 'toll', 'weather_hazard'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE distance_unit AS ENUM ('km', 'mi'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE currency_code AS ENUM ('BRL', 'USD', 'EUR'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE driver_live_status AS ENUM ('OFFLINE', 'ONLINE', 'AVAILABLE', 'RESERVED', 'GOING_TO_PICKUP', 'WAITING_PASSENGER', 'IN_TRIP', 'IN_DELIVERY', 'IN_FREIGHT', 'PAUSED', 'EMERGENCY'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE trip_status AS ENUM ('REQUEST_CREATED', 'SEARCHING_DRIVER', 'DRIVER_NOTIFIED', 'DRIVER_ACCEPTED', 'GOING_TO_PICKUP', 'ARRIVED', 'PASSENGER_ON_BOARD', 'IN_PROGRESS', 'FINISHING', 'COMPLETED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'FINISHED', 'CANCELLED', 'NO_DRIVER_FOUND', 'TIMEOUT', 'EXPIRED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE freight_load_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE freight_bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Adicionar valores a enums existentes
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'employee';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'cnh_selfie';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'crlv';
ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'SIMULATED';

DO $$ BEGIN CREATE TYPE service_category AS ENUM ('delivery', 'supermarket', 'pharmacy', 'restaurant', 'water', 'gas', 'mechanic', 'electrician', 'plumber', 'cleaning', 'petshop', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'in_delivery', 'delivered', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================================================
-- 3. FUNÇÃO UTILITÁRIA: updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- 4. TABELAS BASE
-- =============================================================================

-- 4.1 profiles
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

-- 4.2 driver_profiles
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

-- 4.3 vehicles
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

-- 4.4 companies
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

-- 4.5 addresses
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type address_type DEFAULT 'other',
    full_address TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.6 documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    url TEXT NOT NULL,
    status driver_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.7 ratings
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rater_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ratee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ride_id UUID,
    score INTEGER CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 5. TRIGGER: updated_at nos profiles
-- =============================================================================
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. STORAGE BUCKETS
-- =============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('drivers', 'drivers', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('companies', 'companies', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicles', 'vehicles', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_files', 'chat_files', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc_docs', 'kyc_docs', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('company_freights', 'company_freights', false) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. TABELAS DO MOTOR DE MOBILIDADE
-- =============================================================================

-- 7.1 cities
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

-- 7.2 pricing_rules
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7.3 road_events
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

-- 7.4 vehicle_categories
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

-- Categorias padrão
INSERT INTO public.vehicle_categories (name, display_name, max_passengers) VALUES ('car', 'Carro Popular', 4) ON CONFLICT (name) DO NOTHING;
INSERT INTO public.vehicle_categories (name, display_name, max_passengers, max_load_weight_kg) VALUES ('moto', 'Moto', 1, 20) ON CONFLICT (name) DO NOTHING;
INSERT INTO public.vehicle_categories (name, display_name, max_load_weight_kg, max_load_volume_m3) VALUES ('van', 'Van de Carga', 0, 1500, 10) ON CONFLICT (name) DO NOTHING;
INSERT INTO public.vehicle_categories (name, display_name, max_load_weight_kg, max_load_volume_m3, requires_special_license) VALUES ('truck', 'Caminhão', 0, 8000, 40, TRUE) ON CONFLICT (name) DO NOTHING;

-- 7.5 driver_heartbeats
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

-- 7.6 tracking_history
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

-- 7.7 trips
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

-- 7.8 trip_offers
CREATE TABLE IF NOT EXISTS public.trip_offers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.driver_profiles(id) NOT NULL,
    status TEXT DEFAULT 'PENDING',
    score_calculated DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- =============================================================================
-- 8. FREIGHT MARKETPLACE
-- =============================================================================

-- 8.1 freight_loads
CREATE TABLE IF NOT EXISTS public.freight_loads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    origin_address TEXT NOT NULL,
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    dest_address TEXT NOT NULL,
    dest_lat DOUBLE PRECISION,
    dest_lng DOUBLE PRECISION,
    description TEXT NOT NULL,
    weight_kg DECIMAL(10,2),
    volume_m3 DECIMAL(10,2),
    vehicle_type TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    pickup_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    status freight_load_status DEFAULT 'open' NOT NULL,
    accepted_bid_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8.2 freight_bids
CREATE TABLE IF NOT EXISTS public.freight_bids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    load_id UUID REFERENCES public.freight_loads(id) ON DELETE CASCADE NOT NULL,
    transporter_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    estimated_days INTEGER,
    status freight_bid_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 9. TABELAS ADICIONAIS (biometric, employee, campaigns, etc)
-- =============================================================================

-- 9.1 biometric_credentials
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

-- 9.2 employee_profiles
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

-- 9.3 campaigns
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

-- 9.4 company_clients
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

-- =============================================================================
-- 10. LOADS, BIDS, WALLETS, FREIGHT_TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.loads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    origin_address TEXT NOT NULL,
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    dest_address TEXT NOT NULL,
    dest_lat DOUBLE PRECISION,
    dest_lng DOUBLE PRECISION,
    description TEXT,
    weight_kg DECIMAL(10,2),
    volume_m3 DECIMAL(10,2),
    vehicle_type TEXT DEFAULT 'carro',
    photos TEXT[] DEFAULT '{}',
    pickup_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    status TEXT DEFAULT 'open',
    accepted_bid_id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE NOT NULL,
    transporter_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.freight_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    status TEXT DEFAULT 'pending',
    description TEXT,
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

-- =============================================================================
-- 11. NOTIFICAÇÕES, MENSAGENS, CHAT
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false NOT NULL,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.trip_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'passenger',
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    file_url TEXT,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'system')),
    file_url TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 12. WALLET TRANSACTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'deposit', 'withdrawal', 'payment', 'refund', 'bonus', 'cashback',
        'ride_payment', 'ride_earning', 'freight_payment', 'freight_earning',
        'platform_fee', 'commission', 'transfer', 'escrow_block', 'escrow_release',
        'withdrawal_pending', 'withdrawal_failed', 'withdrawal_confirmed',
        'monthly_fee', 'advancement', 'fine', 'tip', 'boleto', 'credit_usage',
        'invoice_payment', 'genesis_bonus', 'genesis_payment', 'respiratory_incentive'
    )),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_type TEXT,
    reference_id UUID,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled', 'reversed', 'blocked', 'released', 'disputed')),
    expires_at TIMESTAMPTZ,
    ip_address TEXT,
    geo_location JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    unlock_date TIMESTAMPTZ,
    hard_delete_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 13. DRIVER PRICING E NEGOTIATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.driver_pricing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    vehicle_category_id UUID REFERENCES public.vehicle_categories(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL DEFAULT 'carro',
    min_price_per_km DECIMAL(10,2) NOT NULL CHECK (min_price_per_km >= 0),
    suggested_price_per_km DECIMAL(10,2) NOT NULL CHECK (suggested_price_per_km >= min_price_per_km),
    min_trip_value DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (min_trip_value >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(driver_id, service_type)
);

CREATE TABLE IF NOT EXISTS public.negotiations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    passenger_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    service_type TEXT NOT NULL DEFAULT 'carro',
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    dest_lat DOUBLE PRECISION,
    dest_lng DOUBLE PRECISION,
    distance_km DECIMAL(10,2),
    requested_price DECIMAL(10,2),
    counter_price DECIMAL(10,2),
    driver_message TEXT,
    passenger_message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'countered', 'accepted', 'rejected', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 14. AUDIT, ERROR LOGS, COVERAGE, VERIFICATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    error_type TEXT NOT NULL,
    error_message TEXT,
    endpoint TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coverage_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    boundary GEOGRAPHY(POLYGON) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
    selfie_url TEXT,
    document_url TEXT,
    document_type TEXT,
    selfie_status TEXT DEFAULT 'pending' CHECK (selfie_status IN ('pending', 'approved', 'rejected')),
    document_status TEXT DEFAULT 'pending' CHECK (document_status IN ('pending', 'approved', 'rejected')),
    verified_at TIMESTAMPTZ,
    rejected_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 15. PAYMENT METHODS, SUPPORT TICKETS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    method_type TEXT NOT NULL CHECK (method_type IN ('card', 'pix', 'boleto')),
    provider TEXT NOT NULL DEFAULT 'stripe',
    card_last4 TEXT,
    card_brand TEXT,
    masked_number TEXT,
    holder_name TEXT,
    expiry_date TEXT,
    is_default BOOLEAN DEFAULT false,
    stripe_payment_method_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 16. APP CONFIG, SAVED LOCATIONS, DRIVERS ONLINE, COUPONS, WITHDRAWALS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.app_config (key, value, description) VALUES
('global.price_per_km', '{"default": 2500, "min": 1500, "max": 5000}'::jsonb, 'Preço por km em centavos'),
('global.platform_fee_percent', '{"default": 15, "min": 5, "max": 35}'::jsonb, 'Taxa da plataforma'),
('global.search_radius_km', '{"default": 10, "min": 3, "max": 50}'::jsonb, 'Raio de busca de motoristas'),
('global.min_fare', '{"default": 700}'::jsonb, 'Tarifa mínima em centavos'),
('global.cancellation_fee', '{"default": 500}'::jsonb, 'Taxa de cancelamento'),
('global.waiting_time_min', '{"default": 5}'::jsonb, 'Tempo de espera'),
('global.night_multiplier', '{"default": 1.3}'::jsonb, 'Multiplicador noturno'),
('global.night_start', '{"default": "22:00"}'::jsonb, 'Início noturno'),
('global.night_end', '{"default": "06:00"}'::jsonb, 'Fim noturno'),
('global.surge_enabled', '{"default": true}'::jsonb, 'Tarifa dinâmica'),
('global.max_surge_multiplier', '{"default": 2.5}'::jsonb, 'Máximo tarifa dinâmica'),
('global.min_withdrawal', '{"default": 5000}'::jsonb, 'Saque mínimo em centavos'),
('global.referral_bonus', '{"default": 2000}'::jsonb, 'Bônus indicação em centavos')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.saved_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('home', 'work', 'other')) DEFAULT 'other',
    full_address TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    complement TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.drivers_online (
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    heading REAL DEFAULT 0,
    speed REAL DEFAULT 0,
    accuracy REAL DEFAULT 0,
    battery_level INTEGER DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'BUSY', 'OFFLINE')),
    vehicle_category TEXT,
    last_updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    pix_key TEXT NOT NULL,
    pix_key_type TEXT NOT NULL CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')) DEFAULT 'cpf',
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    gateway_transaction_id TEXT,
    gateway_response JSONB DEFAULT '{}'::jsonb,
    fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount - fee) STORED,
    processed_at TIMESTAMPTZ,
    failed_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 17. COMPANY: PRODUCTS, ORDERS, SERVICES, PROFESSIONALS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.company_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    category service_category NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.company_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    unit TEXT DEFAULT 'un',
    category service_category DEFAULT 'other',
    image_url TEXT,
    stock_quantity INTEGER DEFAULT -1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.company_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    status order_status DEFAULT 'pending',
    payment_method TEXT,
    payment_id TEXT,
    delivery_address TEXT NOT NULL,
    delivery_lat DOUBLE PRECISION,
    delivery_lng DOUBLE PRECISION,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.professional_directory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    profession TEXT NOT NULL,
    specialty TEXT,
    description TEXT,
    phone TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    address TEXT,
    city TEXT,
    state TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 18. GENESIS PROTOCOL: CITY LAUNCHES, MISSIONS, GUARANTEES, SNAPSHOTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.city_launches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    city_name TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    status TEXT DEFAULT 'seeding' CHECK (status IN ('seeding', 'flash', 'live', 'completed')),
    target_motoristas INTEGER DEFAULT 20,
    target_comercios INTEGER DEFAULT 10,
    motoristas_registered INTEGER DEFAULT 0,
    comercios_registered INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    seed_end_date TIMESTAMP WITH TIME ZONE,
    flash_date TIMESTAMP WITH TIME ZONE,
    genesis_budget NUMERIC(10,2) DEFAULT 10000.00,
    current_motoristas INTEGER DEFAULT 0,
    current_comercios INTEGER DEFAULT 0,
    end_seed_date TIMESTAMPTZ,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.seed_missions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city_launch_id UUID REFERENCES public.city_launches(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    mission_type TEXT NOT NULL CHECK (mission_type IN ('onboarding', 'first_ride_simulated', 'first_ride_real', 'referral')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.respiratory_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
    available_drivers INTEGER NOT NULL DEFAULT 0,
    active_requests INTEGER NOT NULL DEFAULT 0,
    breath_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    dynamic_incentive DECIMAL(10,2) DEFAULT 0,
    avg_wait_time_minutes INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.driver_guarantees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    city_launch_id UUID REFERENCES public.city_launches(id) ON DELETE CASCADE NOT NULL,
    guaranteed_amount DECIMAL(10,2) NOT NULL DEFAULT 500,
    earned_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    txap_subsidy DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    unlock_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (driver_id, city_launch_id)
);

-- =============================================================================
-- 19. PIX COLUMNS EM TRIPS + COMPANY SUBSCRIPTIONS
-- =============================================================================

DO $$ BEGIN
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS pix_qr_code TEXT;
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS pix_qr_code_url TEXT;
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS pix_expires_at TIMESTAMPTZ;
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2);
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS driver_earnings NUMERIC(10,2);
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS respiratory_incentive DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS user_accepted_surcharge BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS city_launch_id UUID REFERENCES public.city_launches(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.company_subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    price_weekly DECIMAL(10,2) NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    max_products INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    priority_score INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.company_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.company_subscription_plans(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    auto_renew BOOLEAN DEFAULT TRUE,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_subscription_id TEXT,
    stripe_payment_method_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (company_id)
);

CREATE TABLE IF NOT EXISTS public.company_delivery_partners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    commission_percent DECIMAL(5,2) DEFAULT 15.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (company_id, driver_id)
);

CREATE TABLE IF NOT EXISTS public.company_invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.company_subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    stripe_invoice_id TEXT,
    payment_intent_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.company_subscription_plans (name, price_weekly, description, features, max_products, is_featured, priority_score) VALUES
('Gratis', 0, 'Listagem basica no diretorio', '["Aparece na busca", "1 foto"]', 3, FALSE, 0),
('Destaque', 300, 'Aparece primeiro para todos', '["Aparece no topo", "Badge Destaque", "Ate 20 produtos", "Relatorio semanal", "Suporte prioritario"]', 20, TRUE, 50),
('Premium', 500, 'Tudo do Destaque + entrega TXAP', '["Tudo do Destaque", "Entrega integrada", "Sem taxa por entrega", "Gestao de pedidos", "Ate 50 produtos", "Relatorio completo"]', 50, TRUE, 100)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 20. SEGURANÇA: COLUNAS PROFILES, BANNED DEVICES, SIGNUP LOG, ETC
-- =============================================================================

DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf_verified BOOLEAN DEFAULT false;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'passenger' CHECK (account_type IN ('passenger', 'driver_moto', 'driver_car', 'freight', 'business'));
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES profiles(id);
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_change_name BOOLEAN DEFAULT true;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name_last_changed_at TIMESTAMPTZ;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_attempts INTEGER DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_signup_attempt_at TIMESTAMPTZ;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sub_profile TEXT DEFAULT NULL;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_subscription JSONB DEFAULT NULL;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ip_address INET;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_from_device TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_status VARCHAR(20) DEFAULT 'pending';
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_city VARCHAR(100);
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20);
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS price_per_km NUMERIC(10,2);
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 5.0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_rides INTEGER DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location geography(POINT,4326);
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lat NUMERIC(10,8);
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lng NUMERIC(11,8);
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Driver profiles extras
DO $$ BEGIN
    ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS current_live_status driver_live_status DEFAULT 'OFFLINE';
    ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS acceptance_rate DECIMAL(5,2) DEFAULT 100.00;
    ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS cancellation_rate DECIMAL(5,2) DEFAULT 0.00;
    ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.00;
    ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0;
    ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS online_time_hours DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS modalities TEXT[] DEFAULT '{}';
    ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Companies extras
DO $$ BEGIN
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS whatsapp TEXT;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cover_image TEXT;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS delivery_radius_km DECIMAL(10,2) DEFAULT 5;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS min_order_value DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS has_own_delivery BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS needs_delivery_partner BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS delivery_zone_radius_km DECIMAL(10,2) DEFAULT 5;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS service_categories TEXT[] DEFAULT '{}';
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- =============================================================================
-- 21. BANNED DEVICES E SIGNUP LOG
-- =============================================================================

CREATE TABLE IF NOT EXISTS banned_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_fingerprint TEXT NOT NULL UNIQUE,
    reason TEXT,
    ip_address INET,
    banned_at TIMESTAMPTZ DEFAULT NOW(),
    banned_by UUID REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS signup_attempts_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT,
    phone VARCHAR(20),
    cpf VARCHAR(14),
    device_fingerprint TEXT,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT false
);

-- =============================================================================
-- 22. FAVORITES, INFLUENCERS, GLOBAL CONFIG
-- =============================================================================

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    favorite_type VARCHAR(20) NOT NULL CHECK (favorite_type IN ('driver', 'place', 'route')),
    driver_id UUID REFERENCES profiles(id),
    place_name VARCHAR(255),
    place_address TEXT,
    place_lat NUMERIC(10,8),
    place_lng NUMERIC(11,8),
    place_icon VARCHAR(10),
    route_from_lat NUMERIC(10,8),
    route_from_lng NUMERIC(11,8),
    route_to_lat NUMERIC(10,8),
    route_to_lng NUMERIC(11,8),
    route_from_name VARCHAR(255),
    route_to_name VARCHAR(255),
    route_vehicle_type VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instagram_handle VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    is_founder BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS global_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

INSERT INTO global_config (key, value, description) VALUES
('platform_commission', '0.10', 'Comissao da plataforma (10%)'),
('platform_commission_fee', '"0.10"', 'Comissão da plataforma (10%)'),
('min_price_per_km_moto', '1.00', 'Preco minimo por km para moto'),
('min_price_per_km_carro', '1.50', 'Preco minimo por km para carro'),
('max_price_per_km', '20.00', 'Preco maximo por km'),
('genesis_guarantee_amount', '500', 'Garantia Genesis em reais'),
('genesis_guarantee_days', '30', 'Dias da garantia Genesis'),
('social_fee_percent', '1.0', 'Porcentagem para fundo social TXAP'),
('subscription_destaque_price', '"300"', 'Preço assinatura Destaque'),
('subscription_premium_price', '"500"', 'Preço assinatura Premium')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- 23. BUSINESSES, PRODUCTS, REVIEWS, PROFESSIONALS, EVENTS, JOBS, ORDERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    categories TEXT[] NOT NULL DEFAULT '{}',
    services JSONB DEFAULT '{}',
    address TEXT NOT NULL,
    address_complement TEXT,
    neighborhood VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(9),
    lat NUMERIC(10,8),
    lng NUMERIC(11,8),
    location geography(POINT,4326),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    instagram VARCHAR(100),
    website TEXT,
    business_hours JSONB DEFAULT '{}',
    delivery_enabled BOOLEAN DEFAULT false,
    delivery_radius_km NUMERIC(5,2) DEFAULT 5.00,
    delivery_fee NUMERIC(10,2) DEFAULT 0.00,
    min_order_value NUMERIC(10,2) DEFAULT 0.00,
    free_delivery_from NUMERIC(10,2),
    accepts_pix BOOLEAN DEFAULT true,
    accepts_card BOOLEAN DEFAULT true,
    accepts_cash BOOLEAN DEFAULT true,
    accepts_wallet BOOLEAN DEFAULT true,
    stripe_connect_account_id TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'suspended')),
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'destaque', 'premium')),
    subscription_expires_at TIMESTAMPTZ,
    rating NUMERIC(2,1) DEFAULT 5.0,
    total_reviews INTEGER DEFAULT 0,
    keywords TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price NUMERIC(10,2) NOT NULL,
    compare_price NUMERIC(10,2),
    images TEXT[] DEFAULT '{}',
    stock_quantity INTEGER DEFAULT -1,
    is_available BOOLEAN DEFAULT true,
    variants JSONB DEFAULT '[]',
    is_featured BOOLEAN DEFAULT false,
    is_promo BOOLEAN DEFAULT false,
    promo_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    tags TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    profession VARCHAR(100) NOT NULL,
    sub_professions TEXT[] DEFAULT '{}',
    bio TEXT,
    experience_years INTEGER,
    service_area JSONB DEFAULT '{}',
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    available_hours JSONB DEFAULT '{}',
    price_per_hour NUMERIC(10,2),
    price_per_service NUMERIC(10,2),
    is_available BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    rating NUMERIC(2,1) DEFAULT 5.0,
    total_reviews INTEGER DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS city_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    location_name TEXT,
    address TEXT,
    lat NUMERIC(10,8),
    lng NUMERIC(11,8),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    image_url TEXT,
    organizer VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS city_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT[],
    job_type VARCHAR(50),
    salary_range VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    business_id UUID REFERENCES businesses(id),
    professional_id UUID REFERENCES professionals(id),
    order_type VARCHAR(50) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    subtotal NUMERIC(10,2) NOT NULL,
    delivery_fee NUMERIC(10,2) DEFAULT 0,
    discount NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    delivery_address TEXT,
    delivery_lat NUMERIC(10,8),
    delivery_lng NUMERIC(11,8),
    driver_id UUID REFERENCES profiles(id),
    driver_assigned_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(20),
    payment_status VARCHAR(20) DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    platform_fee NUMERIC(10,2),
    business_earnings NUMERIC(10,2),
    driver_earnings NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    user_rating INTEGER,
    user_review TEXT
);

-- =============================================================================
-- 24. INFLUENCER RANK
-- =============================================================================

CREATE TABLE IF NOT EXISTS influencer_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referred_user_id UUID REFERENCES profiles(id),
    referred_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
    reward_given BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS influencer_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL,
    target_count INTEGER NOT NULL,
    current_count INTEGER DEFAULT 0,
    reward_type VARCHAR(50),
    reward_value TEXT,
    is_active BOOLEAN DEFAULT true,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 25. RLS — HABILITAR PARA TODAS AS TABELAS
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers_online ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_launches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respiratory_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_attempts_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rides ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 26. POLÍTICAS RLS
-- =============================================================================

DO $$ BEGIN CREATE POLICY "Usuários podem ver seus próprios perfis" ON public.profiles FOR SELECT USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON public.profiles FOR UPDATE USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Usuários podem inserir próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Motoristas podem ver seus dados" ON public.driver_profiles FOR SELECT USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motoristas podem atualizar seus dados" ON public.driver_profiles FOR UPDATE USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motoristas podem inserir seus dados" ON public.driver_profiles FOR INSERT WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Motoristas podem gerenciar seus veículos" ON public.vehicles FOR ALL USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motoristas podem inserir próprio veículo" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Empresas podem gerenciar seus perfis" ON public.companies FOR ALL USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Empresas podem inserir própria empresa" ON public.companies FOR INSERT WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Usuários podem gerenciar seus endereços" ON public.addresses FOR ALL USING (auth.uid() = profile_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Usuários podem ver seus documentos" ON public.documents FOR SELECT USING (auth.uid() = profile_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Usuários podem enviar documentos" ON public.documents FOR INSERT WITH CHECK (auth.uid() = profile_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Leitura pública de cidades" ON public.cities FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Leitura pública de preços" ON public.pricing_rules FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Leitura pública de eventos viários" ON public.road_events FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Motoristas verificados podem reportar eventos" ON public.road_events FOR INSERT WITH CHECK (auth.uid() = reported_by AND EXISTS (SELECT 1 FROM public.driver_profiles WHERE id = auth.uid() AND status = 'approved')); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Leitura pública de categorias" ON public.vehicle_categories FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Motoristas atualizam próprio heartbeat" ON public.driver_heartbeats FOR ALL USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Leitura pública (restrita) de heartbeats ativos" ON public.driver_heartbeats FOR SELECT USING (status != 'OFFLINE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motoristas gravam próprio histórico" ON public.tracking_history FOR INSERT WITH CHECK (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Passageiro vê próprias viagens" ON public.trips FOR SELECT USING (auth.uid() = passenger_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Passageiro cria viagens" ON public.trips FOR INSERT WITH CHECK (auth.uid() = passenger_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motorista vê viagens vinculadas a ele" ON public.trips FOR SELECT USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Motorista vê próprias ofertas" ON public.trip_offers FOR SELECT USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motorista atualiza própria oferta" ON public.trip_offers FOR UPDATE USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Freight loads
DO $$ BEGIN CREATE POLICY "Cliente vê próprias cargas" ON public.freight_loads FOR SELECT USING (auth.uid() = customer_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Transportadores veem cargas abertas" ON public.freight_loads FOR SELECT USING (status = 'open'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Cliente cria carga" ON public.freight_loads FOR INSERT WITH CHECK (auth.uid() = customer_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Favorites
DO $$ BEGIN CREATE POLICY "user_own_favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Influencers
DO $$ BEGIN CREATE POLICY "public_read_influencers" ON public.influencers FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "admin_full_influencers" ON public.influencers FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Referrals
DO $$ BEGIN CREATE POLICY "influencer_see_own_referrals" ON public.influencer_referrals FOR SELECT USING (auth.uid() IN (SELECT created_by FROM influencers WHERE id = influencer_referrals.influencer_id)); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "admin_full_referrals" ON public.influencer_referrals FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Goals
DO $$ BEGIN CREATE POLICY "influencer_see_own_goals" ON public.influencer_goals FOR SELECT USING (auth.uid() IN (SELECT created_by FROM influencers WHERE id = influencer_goals.influencer_id)); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "admin_full_goals" ON public.influencer_goals FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Mais policies (demais tabelas seguem o mesmo padrão de segurança)
-- Storage
DO $$ BEGIN CREATE POLICY "Avatar público" ON storage.objects FOR SELECT USING (bucket_id = 'avatars'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Upload de avatar próprio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================================================
-- 27. ÍNDICES ADICIONAIS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_driver_heartbeats_location ON public.driver_heartbeats USING GIST (ll_to_earth(lat, lng));
CREATE INDEX IF NOT EXISTS idx_driver_heartbeats_status_time ON public.driver_heartbeats (status, last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_company ON public.driver_profiles (company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_load ON public.bids (load_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_transporter ON public.bids (transporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_history_driver_time ON public.tracking_history (driver_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_passenger ON public.trips (passenger_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON public.trips (driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_payment_intent ON public.trips (stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips (status);
CREATE INDEX IF NOT EXISTS idx_trips_created ON public.trips (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_passenger_status ON public.trips (passenger_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_driver_status ON public.trips (driver_id, status);
CREATE INDEX IF NOT EXISTS idx_loads_customer ON public.loads (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_load_desc ON public.bids (load_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_transporter_desc ON public.bids (transporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_freight_tracking_code ON public.freight_tracking (code);
CREATE INDEX IF NOT EXISTS idx_wallets_profile ON public.wallets (profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_messages_trip_created ON public.trip_messages (trip_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON public.wallet_transactions (wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON public.wallet_transactions (type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference ON public.wallet_transactions (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_profile_status ON public.wallet_transactions (profile_id, status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON public.wallet_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_profile ON public.wallet_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallet_status ON public.wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_driver_pricing_driver ON public.driver_pricing (driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_pricing_active ON public.driver_pricing (service_type, is_active);
CREATE INDEX IF NOT EXISTS idx_negotiations_passenger ON public.negotiations (passenger_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_negotiations_driver ON public.negotiations (driver_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_negotiations_trip ON public.negotiations (trip_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON public.negotiations (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_profile ON audit_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_app_errors_type ON app_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_coverage_areas_boundary ON coverage_areas USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_payment_methods_profile ON public.payment_methods(profile_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_profile ON public.support_tickets(profile_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_user ON public.saved_locations (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_type ON public.saved_locations (user_id, type);
CREATE INDEX IF NOT EXISTS idx_drivers_online_status ON public.drivers_online (status);
CREATE INDEX IF NOT EXISTS idx_drivers_online_location ON public.drivers_online USING GIST (ll_to_earth(lat, lng));
CREATE INDEX IF NOT EXISTS idx_drivers_online_last_update ON public.drivers_online (last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_active_expires ON public.coupons (is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_driver ON public.withdrawals (driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals (status);
CREATE INDEX IF NOT EXISTS idx_company_products_company ON public.company_products (company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_company_products_category ON public.company_products (category);
CREATE INDEX IF NOT EXISTS idx_company_orders_customer ON public.company_orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_orders_company ON public.company_orders (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_professional_directory_location ON public.professional_directory USING GIST (ll_to_earth(lat, lng));
CREATE INDEX IF NOT EXISTS idx_professional_directory_profession ON public.professional_directory (profession);
CREATE INDEX IF NOT EXISTS idx_companies_location ON public.companies USING GIST (ll_to_earth(lat, lng));
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company ON public.company_subscriptions (company_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status ON public.company_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_company_invoices_company ON public.company_invoices (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_invoices_status ON public.company_invoices (status);
CREATE INDEX IF NOT EXISTS idx_companies_featured ON public.companies (is_featured, priority_score DESC) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_city_launches_status ON public.city_launches (status);
CREATE INDEX IF NOT EXISTS idx_seed_missions_driver ON public.seed_missions (driver_id, city_launch_id);
CREATE INDEX IF NOT EXISTS idx_seed_missions_status ON public.seed_missions (status);
CREATE INDEX IF NOT EXISTS idx_respiratory_snapshots_city ON public.respiratory_snapshots (city_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_guarantees_driver ON public.driver_guarantees (driver_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(is_banned) WHERE is_banned = true;
CREATE INDEX IF NOT EXISTS idx_profiles_device ON profiles(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_profiles_online ON profiles(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_signup_ip ON signup_attempts_log(ip_address, attempted_at);
CREATE INDEX IF NOT EXISTS idx_signup_phone ON signup_attempts_log(phone, attempted_at);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(favorite_type);
CREATE INDEX IF NOT EXISTS idx_influencers_active ON influencers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_businesses_categories ON businesses USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city, state);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_businesses_keywords ON businesses USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_businesses_featured ON businesses(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_business ON business_products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON business_products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON business_products(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_reviews_business ON business_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_professionals_profession ON professionals(profession);
CREATE INDEX IF NOT EXISTS idx_professionals_available ON professionals(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_events_city ON city_events(city, state);
CREATE INDEX IF NOT EXISTS idx_events_dates ON city_events(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_business ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_referrals_influencer ON influencer_referrals(influencer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON influencer_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_goals_influencer ON influencer_goals(influencer_id);
CREATE INDEX IF NOT EXISTS idx_messages_trip ON public.messages (trip_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_profiles_role_desc ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_status_desc ON public.driver_profiles (status);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_rating_desc ON public.driver_profiles (rating DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee ON public.ratings (ratee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON public.ratings (rater_id, created_at DESC);

-- =============================================================================
-- 28. REALTIME PUBLICATION
-- =============================================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_heartbeats;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers_online;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_offers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 29. TRIGGERS ADICIONAIS
-- =============================================================================

-- Heartbeat updated_at
DROP TRIGGER IF EXISTS update_driver_heartbeats_updated_at ON public.driver_heartbeats;
CREATE TRIGGER update_driver_heartbeats_updated_at BEFORE UPDATE ON public.driver_heartbeats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Employee profiles
DROP TRIGGER IF EXISTS update_employee_profiles_updated_at ON public.employee_profiles;
CREATE TRIGGER update_employee_profiles_updated_at BEFORE UPDATE ON public.employee_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Company clients
DROP TRIGGER IF EXISTS update_company_clients_updated_at ON public.company_clients;
CREATE TRIGGER update_company_clients_updated_at BEFORE UPDATE ON public.company_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Freight loads
DROP TRIGGER IF EXISTS update_freight_loads_updated_at ON public.freight_loads;
CREATE TRIGGER update_freight_loads_updated_at BEFORE UPDATE ON public.freight_loads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Freight bids
DROP TRIGGER IF EXISTS update_freight_bids_updated_at ON public.freight_bids;
CREATE TRIGGER update_freight_bids_updated_at BEFORE UPDATE ON public.freight_bids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Wallet balance trigger
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.wallets SET balance = NEW.balance_after, updated_at = now() WHERE id = NEW.wallet_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_wallet_transaction ON public.wallet_transactions;
CREATE TRIGGER trg_wallet_transaction AFTER INSERT ON public.wallet_transactions FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

-- Wallet auto-creation
CREATE OR REPLACE FUNCTION public.ensure_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (profile_id, balance, is_qualified) VALUES (NEW.id, 0, false) ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_ensure_wallet ON public.profiles;
CREATE TRIGGER trg_ensure_wallet AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_wallet();

-- Block duplicate pending deposits
CREATE OR REPLACE FUNCTION check_pending_deposit(p_profile_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE AS $$
BEGIN RETURN EXISTS(SELECT 1 FROM wallet_transactions WHERE profile_id = p_profile_id AND status = 'pending'); END;
$$;

CREATE OR REPLACE FUNCTION trg_block_deposit_if_pending()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN IF NEW.type = 'deposit' AND check_pending_deposit(NEW.profile_id) THEN RAISE EXCEPTION 'A pending deposit already exists'; END IF; RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_block_deposit_if_pending ON wallet_transactions;
CREATE TRIGGER trg_block_deposit_if_pending BEFORE INSERT ON wallet_transactions FOR EACH ROW EXECUTE FUNCTION trg_block_deposit_if_pending();

-- Wallet audit trail
CREATE OR REPLACE FUNCTION trg_wallet_transaction_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN INSERT INTO audit_logs (profile_id, action, metadata) VALUES (NEW.profile_id, 'wallet.transaction.' || NEW.type, jsonb_build_object('transaction_id', NEW.id, 'amount', NEW.amount, 'status', NEW.status)); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_transaction_audit ON wallet_transactions;
CREATE TRIGGER trg_wallet_transaction_audit AFTER INSERT ON wallet_transactions FOR EACH ROW EXECUTE FUNCTION trg_wallet_transaction_audit();

-- Negative balance check
CREATE OR REPLACE FUNCTION check_wallet_balance_non_negative()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_balance INTEGER;
BEGIN
  SELECT COALESCE(SUM(CASE WHEN type IN ('deposit', 'refund', 'bonus', 'cashback', 'ride_earning', 'freight_earning') THEN amount ELSE -amount END), 0) INTO v_balance
  FROM public.wallet_transactions WHERE profile_id = NEW.profile_id AND status = 'confirmed';
  IF v_balance < 0 THEN RAISE EXCEPTION 'Saldo da carteira nao pode ser negativo (saldo atual: %)', v_balance; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_wallet_balance ON public.wallet_transactions;
CREATE TRIGGER trg_check_wallet_balance BEFORE INSERT ON public.wallet_transactions FOR EACH ROW WHEN (NEW.type IN ('withdrawal', 'payment', 'ride_payment', 'freight_payment', 'platform_fee')) EXECUTE FUNCTION check_wallet_balance_non_negative();

-- Driver rating trigger
CREATE OR REPLACE FUNCTION update_driver_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_new_rating DECIMAL;
BEGIN
  IF NEW.rating_type = 'passenger_to_driver' THEN
    SELECT ROUND(AVG(score)::DECIMAL, 2) INTO v_new_rating FROM public.ratings WHERE ratee_id = NEW.ratee_id AND rating_type = 'passenger_to_driver';
    UPDATE public.driver_profiles SET rating = v_new_rating WHERE id = NEW.ratee_id;
    IF v_new_rating < 3.0 THEN UPDATE public.driver_profiles SET status = 'rejected' WHERE id = NEW.ratee_id; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_driver_rating ON public.ratings;
CREATE TRIGGER trg_update_driver_rating AFTER INSERT ON public.ratings FOR EACH ROW EXECUTE FUNCTION update_driver_rating();

-- Driver guarantee earnings
CREATE OR REPLACE FUNCTION update_driver_guarantee_earnings()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type IN ('ride_earning', 'bonus', 'tip') AND NEW.status = 'confirmed' THEN
    UPDATE public.driver_guarantees SET earned_amount = earned_amount + NEW.amount WHERE driver_id = NEW.profile_id AND status = 'active' AND expires_at > NEW.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_driver_guarantee ON public.wallet_transactions;
CREATE TRIGGER trg_update_driver_guarantee AFTER INSERT ON public.wallet_transactions FOR EACH ROW EXECUTE FUNCTION update_driver_guarantee_earnings();

-- Auto-updated_at for multiple tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['app_config', 'saved_locations', 'withdrawals', 'coupons', 'ratings', 'messages', 'drivers_online', 'company_products', 'company_orders', 'professional_directory', 'city_launches', 'driver_guarantees', 'company_subscriptions'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s; CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', tbl, tbl, tbl, tbl);
  END LOOP;
END;
$$;

-- =============================================================================
-- 30. FUNÇÕES RPC
-- =============================================================================

-- validate_cpf
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf TEXT)
RETURNS BOOLEAN AS $$
DECLARE numbers TEXT; cpf_clean TEXT; sum1 INT := 0; sum2 INT := 0; digit1 INT; digit2 INT;
BEGIN
  cpf_clean := regexp_replace(cpf, '[^0-9]', '', 'g');
  IF length(cpf_clean) != 11 THEN RETURN FALSE; END IF;
  IF cpf_clean ~ '^(\d)\1{10}$' THEN RETURN FALSE; END IF;
  FOR i IN 1..9 LOOP sum1 := sum1 + (substr(cpf_clean, i, 1)::INT * (11 - i)); END LOOP;
  digit1 := (sum1 * 10) % 11; IF digit1 = 10 THEN digit1 := 0; END IF;
  IF substr(cpf_clean, 10, 1)::INT != digit1 THEN RETURN FALSE; END IF;
  FOR i IN 1..10 LOOP sum2 := sum2 + (substr(cpf_clean, i, 1)::INT * (12 - i)); END LOOP;
  digit2 := (sum2 * 10) % 11; IF digit2 = 10 THEN digit2 := 0; END IF;
  IF substr(cpf_clean, 11, 1)::INT != digit2 THEN RETURN FALSE; END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- calculate_respiratory_rate
CREATE OR REPLACE FUNCTION calculate_respiratory_rate(p_city_id UUID)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE v_available INTEGER; v_active_requests INTEGER; v_breath_rate DECIMAL(5,2); v_incentive DECIMAL(10,2);
BEGIN
  SELECT COUNT(*) INTO v_available FROM public.driver_heartbeats dh JOIN public.driver_profiles dp ON dp.id = dh.driver_id WHERE dh.status IN ('AVAILABLE', 'ONLINE') AND dp.city = (SELECT name FROM public.cities WHERE id = p_city_id);
  SELECT COUNT(*) INTO v_active_requests FROM public.trips WHERE status IN ('SEARCHING_DRIVER', 'REQUEST_CREATED');
  IF v_available = 0 AND v_active_requests > 0 THEN v_breath_rate := 100; ELSIF v_available > 0 THEN v_breath_rate := LEAST((v_active_requests::DECIMAL / v_available) * 50, 100); ELSE v_breath_rate := 0; END IF;
  IF v_breath_rate >= 70 THEN v_incentive := CEIL(v_breath_rate / 10) * 1.50; ELSIF v_breath_rate >= 40 THEN v_incentive := 1.00; ELSE v_incentive := 0; END IF;
  INSERT INTO public.respiratory_snapshots (city_id, available_drivers, active_requests, breath_rate, dynamic_incentive) VALUES (p_city_id, v_available, v_active_requests, v_breath_rate, v_incentive);
  RETURN jsonb_build_object('available_drivers', v_available, 'active_requests', v_active_requests, 'breath_rate', v_breath_rate, 'dynamic_incentive', v_incentive);
END;
$$;

-- calculate_breath_rate
CREATE OR REPLACE FUNCTION calculate_breath_rate(city_uuid UUID)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE v_available INTEGER; v_active INTEGER; v_rate INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_available FROM profiles WHERE account_type LIKE 'driver_%' AND is_online = true AND current_city = (SELECT city_name FROM city_launches WHERE id = city_uuid);
  SELECT COUNT(*) INTO v_active FROM trips WHERE status IN ('pending', 'accepted', 'in_progress') AND city = (SELECT city_name FROM city_launches WHERE id = city_uuid);
  IF v_available = 0 THEN v_rate := 100; ELSE v_rate := LEAST(100, (v_active * 100 / GREATEST(v_available, 1))); END IF;
  RETURN v_rate;
END;
$$;

-- calculate_ride_price
CREATE OR REPLACE FUNCTION calculate_ride_price(p_distance_km DECIMAL, p_vehicle_type TEXT DEFAULT 'carro', p_city_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql STABLE AS $$
DECLARE v_price_per_km INTEGER; v_base_fare INTEGER; v_min_fare INTEGER; v_total INTEGER; v_config JSONB;
BEGIN
  SELECT value INTO v_config FROM public.app_config WHERE key = 'global.price_per_km';
  v_price_per_km := COALESCE((v_config->>'default')::INTEGER, 2500);
  SELECT value INTO v_config FROM public.app_config WHERE key = 'global.min_fare';
  v_min_fare := COALESCE((v_config->>'default')::INTEGER, 700);
  v_base_fare := 500; v_total := v_base_fare + CEIL(p_distance_km * v_price_per_km);
  IF v_total < v_min_fare THEN v_total := v_min_fare; END IF;
  RETURN jsonb_build_object('total_cents', v_total, 'total_brl', (v_total / 100.0)::DECIMAL(10,2), 'base_fare_cents', v_base_fare, 'distance_fare_cents', v_total - v_base_fare, 'distance_km', p_distance_km, 'price_per_km_cents', v_price_per_km);
END;
$$;

-- validate_coupon
CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE AS $$
DECLARE v_coupon RECORD;
BEGIN
  SELECT * INTO v_coupon FROM public.coupons WHERE code = UPPER(p_code) AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'message', 'Cupom nao encontrado'); END IF;
  IF v_coupon.expires_at < now() THEN RETURN jsonb_build_object('valid', false, 'message', 'Cupom expirado'); END IF;
  IF v_coupon.current_uses >= v_coupon.max_uses THEN RETURN jsonb_build_object('valid', false, 'message', 'Cupom ja atingiu o limite'); END IF;
  RETURN jsonb_build_object('valid', true, 'coupon_id', v_coupon.id, 'discount_type', v_coupon.discount_type, 'discount_value', v_coupon.discount_value, 'min_order_value', v_coupon.min_order_value, 'max_discount', v_coupon.max_discount);
END;
$$;

-- request_withdrawal
CREATE OR REPLACE FUNCTION request_withdrawal(p_driver_id UUID, p_amount INTEGER, p_pix_key TEXT, p_pix_key_type TEXT DEFAULT 'cpf')
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE v_balance INTEGER; v_min_withdrawal INTEGER; v_withdrawal_id UUID;
BEGIN
  SELECT COALESCE(SUM(CASE WHEN type IN ('deposit', 'refund', 'bonus', 'cashback', 'ride_earning', 'freight_earning') THEN amount ELSE -amount END), 0) INTO v_balance FROM public.wallet_transactions WHERE profile_id = p_driver_id AND status = 'confirmed';
  SELECT (value->>'default')::INTEGER INTO v_min_withdrawal FROM public.app_config WHERE key = 'global.min_withdrawal';
  IF v_min_withdrawal IS NULL THEN v_min_withdrawal := 5000; END IF;
  IF v_balance < v_min_withdrawal THEN RETURN jsonb_build_object('success', false, 'message', format('Saldo insuficiente. Minimo: R$ %.2f', v_min_withdrawal / 100.0)); END IF;
  IF p_amount > v_balance THEN RETURN jsonb_build_object('success', false, 'message', 'Saldo insuficiente'); END IF;
  INSERT INTO public.withdrawals (driver_id, amount, pix_key, pix_key_type, status) VALUES (p_driver_id, p_amount / 100.0, p_pix_key, p_pix_key_type, 'pending') RETURNING id INTO v_withdrawal_id;
  INSERT INTO public.wallet_transactions (profile_id, wallet_id, type, amount, balance_before, balance_after, status, description, reference_type, reference_id)
  SELECT p_driver_id, w.id, 'withdrawal', p_amount / 100.0, v_balance / 100.0, (v_balance - p_amount) / 100.0, 'confirmed', 'Saque para PIX', 'withdrawal', v_withdrawal_id FROM public.wallets w WHERE w.profile_id = p_driver_id;
  RETURN jsonb_build_object('success', true, 'withdrawal_id', v_withdrawal_id, 'amount', p_amount);
END;
$$;

-- nearby_drivers (PostGIS)
CREATE OR REPLACE FUNCTION nearby_drivers(user_lat NUMERIC, user_lng NUMERIC, search_radius NUMERIC, v_type TEXT DEFAULT NULL)
RETURNS TABLE (id UUID, name TEXT, lat NUMERIC, lng NUMERIC, vehicle_type TEXT, rating NUMERIC, price_per_km NUMERIC, distance_meters NUMERIC, is_online BOOLEAN)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT p.id, p.full_name, ST_Y(p.location::geometry)::NUMERIC, ST_X(p.location::geometry)::NUMERIC, p.vehicle_type, p.rating, p.price_per_km, ST_Distance(p.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography)::NUMERIC, p.is_online
  FROM profiles p WHERE p.account_type LIKE 'driver_%' AND p.is_online = true AND p.is_banned = false AND p.location IS NOT NULL
  AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, search_radius)
  AND (v_type IS NULL OR p.vehicle_type = v_type) ORDER BY distance_meters ASC LIMIT 20;
END;
$$;

-- nearby_companies
CREATE OR REPLACE FUNCTION nearby_companies(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_radius_km DOUBLE PRECISION DEFAULT 10)
RETURNS SETOF public.companies LANGUAGE sql AS $$
  SELECT * FROM public.companies WHERE lat IS NOT NULL AND lng IS NOT NULL AND earth_distance(ll_to_earth(lat, lng), ll_to_earth(p_lat, p_lng)) / 1000 <= p_radius_km ORDER BY earth_distance(ll_to_earth(lat, lng), ll_to_earth(p_lat, p_lng)) LIMIT 50;
$$;

-- nearby_professionals
CREATE OR REPLACE FUNCTION nearby_professionals(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_radius_km DOUBLE PRECISION DEFAULT 10, p_profession TEXT DEFAULT NULL)
RETURNS SETOF public.professional_directory LANGUAGE sql AS $$
  SELECT * FROM public.professional_directory WHERE lat IS NOT NULL AND lng IS NOT NULL AND is_available = true AND (p_profession IS NULL OR profession = p_profession) AND earth_distance(ll_to_earth(lat, lng), ll_to_earth(p_lat, p_lng)) / 1000 <= p_radius_km ORDER BY earth_distance(ll_to_earth(lat, lng), ll_to_earth(p_lat, p_lng)) LIMIT 50;
$$;

-- get_driver_earnings
CREATE OR REPLACE FUNCTION get_driver_earnings(p_driver_id UUID, p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days', p_end_date TIMESTAMPTZ DEFAULT NOW())
RETURNS JSONB LANGUAGE plpgsql STABLE AS $$
DECLARE v_total_earned DECIMAL; v_total_trips INTEGER; v_total_distance DECIMAL; v_total_time INTEGER; v_weekly JSONB;
BEGIN
  SELECT COALESCE(SUM(t.final_fare), 0) INTO v_total_earned FROM public.trips t WHERE t.driver_id = p_driver_id AND t.status = 'FINISHED' AND t.completed_at BETWEEN p_start_date AND p_end_date;
  SELECT COUNT(*) INTO v_total_trips FROM public.trips t WHERE t.driver_id = p_driver_id AND t.status = 'FINISHED' AND t.completed_at BETWEEN p_start_date AND p_end_date;
  SELECT COALESCE(SUM(t.estimated_distance_km), 0) INTO v_total_distance FROM public.trips t WHERE t.driver_id = p_driver_id AND t.status = 'FINISHED' AND t.completed_at BETWEEN p_start_date AND p_end_date;
  SELECT COALESCE(SUM(t.estimated_duration_min), 0) INTO v_total_time FROM public.trips t WHERE t.driver_id = p_driver_id AND t.status = 'FINISHED' AND t.completed_at BETWEEN p_start_date AND p_end_date;
  SELECT jsonb_agg(jsonb_build_object('week', to_char(week_start, 'YYYY-MM-DD'), 'earnings', weekly_earnings, 'trips', weekly_trips) ORDER BY week_start) INTO v_weekly
  FROM (SELECT date_trunc('week', t.completed_at)::DATE AS week_start, COALESCE(SUM(t.final_fare), 0) AS weekly_earnings, COUNT(*) AS weekly_trips FROM public.trips t WHERE t.driver_id = p_driver_id AND t.status = 'FINISHED' AND t.completed_at BETWEEN p_start_date AND p_end_date GROUP BY date_trunc('week', t.completed_at)) weekly;
  RETURN jsonb_build_object('total_earned', v_total_earned, 'total_trips', v_total_trips, 'total_distance_km', v_total_distance, 'total_time_min', v_total_time, 'average_per_trip', CASE WHEN v_total_trips > 0 THEN v_total_earned / v_total_trips ELSE 0 END, 'weekly_breakdown', COALESCE(v_weekly, '[]'::jsonb), 'period_start', p_start_date, 'period_end', p_end_date);
END;
$$;

-- process_genesis_bonus
CREATE OR REPLACE FUNCTION process_genesis_bonus(p_driver_id UUID, p_city_launch_id UUID)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE v_guarantee RECORD; v_subsidy DECIMAL(10,2); v_wallet_id UUID; v_current_balance DECIMAL(10,2);
BEGIN
  SELECT * INTO v_guarantee FROM public.driver_guarantees WHERE driver_id = p_driver_id AND city_launch_id = p_city_launch_id AND status = 'active';
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Garantia nao encontrada'); END IF;
  IF v_guarantee.earned_amount >= v_guarantee.guaranteed_amount THEN
    UPDATE public.driver_guarantees SET status = 'completed', txap_subsidy = 0 WHERE id = v_guarantee.id;
    RETURN jsonb_build_object('success', true, 'message', 'Motorista ja atingiu a meta');
  END IF;
  v_subsidy := v_guarantee.guaranteed_amount - v_guarantee.earned_amount;
  SELECT id, balance INTO v_wallet_id, v_current_balance FROM public.wallets WHERE profile_id = p_driver_id;
  INSERT INTO public.wallet_transactions (profile_id, wallet_id, type, amount, balance_before, balance_after, status, description, reference_type, reference_id, expires_at)
  VALUES (p_driver_id, v_wallet_id, 'genesis_bonus', v_subsidy, v_current_balance, v_current_balance + v_subsidy, 'confirmed', 'Bonus Garantido Primeiro Dolar TXAP', 'city_launch', p_city_launch_id, timezone('utc'::text, now()) + interval '30 days');
  UPDATE public.driver_guarantees SET txap_subsidy = v_subsidy, status = 'completed', unlock_date = timezone('utc'::text, now()) + interval '30 days' WHERE id = v_guarantee.id;
  RETURN jsonb_build_object('success', true, 'subsidy', v_subsidy, 'unlock_date', timezone('utc'::text, now()) + interval '30 days');
END;
$$;

-- process_ride_payment
CREATE OR REPLACE FUNCTION process_ride_payment(p_ride_id UUID)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE v_trip RECORD; v_passenger_wallet UUID; v_driver_wallet UUID; v_platform_fee_percent DECIMAL; v_platform_fee DECIMAL; v_driver_earning DECIMAL; v_balance_before_passenger DECIMAL; v_balance_before_driver DECIMAL; v_config JSONB;
BEGIN
  SELECT * INTO v_trip FROM public.trips WHERE id = p_ride_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Corrida nao encontrada'); END IF;
  IF v_trip.status NOT IN ('FINISHED', 'COMPLETED') THEN RETURN jsonb_build_object('success', false, 'error', 'Corrida nao finalizada'); END IF;
  SELECT id INTO v_passenger_wallet FROM public.wallets WHERE profile_id = v_trip.passenger_id;
  SELECT id INTO v_driver_wallet FROM public.wallets WHERE profile_id = v_trip.driver_id;
  SELECT value INTO v_config FROM public.app_config WHERE key = 'global.platform_fee_percent';
  v_platform_fee_percent := COALESCE((v_config->>'default')::DECIMAL, 15) / 100;
  v_platform_fee := ROUND(v_trip.final_fare * v_platform_fee_percent, 2); v_driver_earning := v_trip.final_fare - v_platform_fee;
  SELECT COALESCE(SUM(CASE WHEN type IN ('deposit', 'refund', 'bonus', 'cashback') THEN amount ELSE -amount END), 0) INTO v_balance_before_passenger FROM public.wallet_transactions WHERE profile_id = v_trip.passenger_id AND status = 'confirmed';
  INSERT INTO public.wallet_transactions (profile_id, wallet_id, type, amount, balance_before, balance_after, status, description, reference_type, reference_id)
  VALUES (v_trip.passenger_id, v_passenger_wallet, 'ride_payment', v_trip.final_fare, v_balance_before_passenger, v_balance_before_passenger - v_trip.final_fare, 'confirmed', 'Pagamento da corrida', 'trip', p_ride_id);
  SELECT COALESCE(SUM(CASE WHEN type IN ('deposit', 'refund', 'bonus', 'cashback', 'ride_earning') THEN amount ELSE -amount END), 0) INTO v_balance_before_driver FROM public.wallet_transactions WHERE profile_id = v_trip.driver_id AND status = 'confirmed';
  INSERT INTO public.wallet_transactions (profile_id, wallet_id, type, amount, balance_before, balance_after, status, description, reference_type, reference_id)
  VALUES (v_trip.driver_id, v_driver_wallet, 'ride_earning', v_driver_earning, v_balance_before_driver, v_balance_before_driver + v_driver_earning, 'confirmed', 'Ganhos da corrida (liquido)', 'trip', p_ride_id);
  INSERT INTO public.wallet_transactions (profile_id, wallet_id, type, amount, balance_before, balance_after, status, description, reference_type, reference_id)
  VALUES (v_trip.driver_id, v_driver_wallet, 'platform_fee', v_platform_fee, v_balance_before_driver + v_driver_earning, v_balance_before_driver + v_driver_earning, 'confirmed', 'Taxa da plataforma', 'trip', p_ride_id);
  UPDATE public.trips SET status = 'PAYMENT_CONFIRMED' WHERE id = p_ride_id;
  RETURN jsonb_build_object('success', true, 'passenger_debit', v_trip.final_fare, 'driver_credit', v_driver_earning, 'platform_fee', v_platform_fee, 'trip_id', p_ride_id);
END;
$$;

-- create_pix_payment
CREATE OR REPLACE FUNCTION create_pix_payment(p_profile_id UUID, p_amount INTEGER, p_description TEXT DEFAULT 'Deposito via PIX')
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE v_tx_id UUID; v_expires_at TIMESTAMPTZ; v_wallet_id UUID;
BEGIN
  IF p_amount < 500 THEN RETURN jsonb_build_object('success', false, 'error', 'Valor minimo de R$ 5,00'); END IF;
  SELECT id INTO v_wallet_id FROM public.wallets WHERE profile_id = p_profile_id;
  v_expires_at := now() + INTERVAL '30 minutes';
  INSERT INTO public.wallet_transactions (profile_id, wallet_id, type, amount, balance_before, balance_after, status, expires_at, description)
  VALUES (p_profile_id, v_wallet_id, 'deposit', p_amount / 100.0, 0, 0, 'pending', v_expires_at, p_description) RETURNING id INTO v_tx_id;
  RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id, 'expires_at', v_expires_at, 'amount_cents', p_amount, 'pix_code', format('PIX-TXDAPP-%s', v_tx_id), 'qr_code_text', format('pix.txdapp.com/qr/%s', v_tx_id));
END;
$$;

-- is_point_in_coverage
CREATE OR REPLACE FUNCTION is_point_in_coverage(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS(SELECT 1 FROM coverage_areas WHERE ST_DWithin(ST_MakePoint(p_lng, p_lat)::GEOGRAPHY, boundary, 0) AND is_active = true);
$$;

-- =============================================================================
-- 31. VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW public.driver_dashboard_view AS
SELECT dp.id AS driver_id, dp.cpf, dp.status AS driver_status, dp.rating, dp.total_trips, dp.acceptance_rate, dp.cancellation_rate, dp.modalities,
  p.full_name, p.email, p.phone,
  COALESCE(weekly.weekly_earnings, 0) AS weekly_earnings, COALESCE(weekly.weekly_trips, 0) AS weekly_trips,
  COALESCE(monthly.monthly_earnings, 0) AS monthly_earnings, COALESCE(monthly.monthly_trips, 0) AS monthly_trips,
  COALESCE(wlt.balance, 0) AS wallet_balance, COALESCE(online.status, 'OFFLINE') AS online_status
FROM public.driver_profiles dp JOIN public.profiles p ON p.id = dp.id
LEFT JOIN LATERAL (SELECT COALESCE(SUM(t.final_fare), 0) AS weekly_earnings, COUNT(*) AS weekly_trips FROM public.trips t WHERE t.driver_id = dp.id AND t.status = 'FINISHED' AND t.completed_at >= date_trunc('week', now())) weekly ON true
LEFT JOIN LATERAL (SELECT COALESCE(SUM(t.final_fare), 0) AS monthly_earnings, COUNT(*) AS monthly_trips FROM public.trips t WHERE t.driver_id = dp.id AND t.status = 'FINISHED' AND t.completed_at >= date_trunc('month', now())) monthly ON true
LEFT JOIN LATERAL (SELECT COALESCE(SUM(CASE WHEN wt.type IN ('deposit', 'refund', 'bonus', 'cashback', 'ride_earning') THEN wt.amount ELSE -wt.amount END), 0) AS balance FROM public.wallet_transactions wt WHERE wt.profile_id = dp.id AND wt.status = 'confirmed') wlt ON true
LEFT JOIN public.drivers_online online ON online.driver_id = dp.id;

CREATE OR REPLACE VIEW public.company_dashboard_view AS
SELECT c.id AS company_id, c.corporate_name, c.trade_name, c.cnpj, c.status, p.full_name AS responsible_name, p.email, p.phone,
  COALESCE(driver_count.driver_count, 0) AS total_drivers, COALESCE(active_drivers.active_count, 0) AS active_drivers,
  COALESCE(monthly_spend.total_spent, 0) AS monthly_spend, COALESCE(monthly_spend.trip_count, 0) AS monthly_trips,
  COALESCE(wlt.balance, 0) AS wallet_balance
FROM public.companies c JOIN public.profiles p ON p.id = c.id
LEFT JOIN LATERAL (SELECT COUNT(*) AS driver_count FROM public.driver_profiles dp WHERE dp.company_id = c.id) driver_count ON true
LEFT JOIN LATERAL (SELECT COUNT(*) AS active_count FROM public.driver_profiles dp JOIN public.drivers_online d ON d.driver_id = dp.id AND d.status != 'OFFLINE') active_drivers ON true
LEFT JOIN LATERAL (SELECT COALESCE(SUM(t.final_fare), 0) AS total_spent, COUNT(*) AS trip_count FROM public.trips t JOIN public.driver_profiles dp ON dp.id = t.driver_id WHERE dp.company_id = c.id AND t.status = 'FINISHED' AND t.completed_at >= date_trunc('month', now())) monthly_spend ON true
LEFT JOIN LATERAL (SELECT COALESCE(SUM(CASE WHEN wt.type IN ('deposit', 'refund', 'bonus', 'cashback') THEN wt.amount ELSE -wt.amount END), 0) AS balance FROM public.wallet_transactions wt WHERE wt.profile_id = c.id AND wt.status = 'confirmed') wlt ON true;

-- =============================================================================
-- 32. MATERIALIZED VIEW (wallet balance)
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS wallet_balance_snapshot;
CREATE MATERIALIZED VIEW wallet_balance_snapshot AS
SELECT profile_id, SUM(CASE WHEN type IN ('deposit', 'refund', 'bonus', 'cashback') THEN amount ELSE -amount END) AS balance
FROM wallet_transactions WHERE status = 'confirmed' GROUP BY profile_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_balance_snapshot_profile ON wallet_balance_snapshot(profile_id);

-- =============================================================================
-- 33. ADMIN AUTO-CREATE
-- =============================================================================

DO $$
DECLARE admin_id UUID; admin_email TEXT := COALESCE(current_setting('app.admin_email', true), 'matheus16k@gmail.com');
BEGIN
  SELECT id INTO admin_id FROM profiles WHERE email = admin_email;
  IF admin_id IS NULL THEN
    INSERT INTO profiles (email, full_name, role, account_type, phone_verified, cpf_verified) VALUES (admin_email, 'Matheus16k', 'admin', 'business', true, true);
  ELSE
    UPDATE profiles SET role = 'admin' WHERE id = admin_id AND role != 'admin';
  END IF;
END $$;

-- =============================================================================
-- 30. TABELA DE BACKUP DE CREDENCIAIS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.credential_backup (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    cpf TEXT,
    full_name TEXT,
    account_type VARCHAR(20),
    ip_address TEXT,
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credential_backup_email ON credential_backup(email);
CREATE INDEX IF NOT EXISTS idx_credential_backup_cpf ON credential_backup(cpf);

COMMIT;
