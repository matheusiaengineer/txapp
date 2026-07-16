-- =========================================================================
-- TXD SMART DISPATCHER 2.0 & TRIPS ENGINE
-- =========================================================================

-- 1. Estados Universais da Viagem (Corrida/Entrega/Frete)
CREATE TYPE trip_status AS ENUM (
    'REQUEST_CREATED',
    'SEARCHING_DRIVER',
    'DRIVER_NOTIFIED',
    'DRIVER_ACCEPTED',
    'GOING_TO_PICKUP',
    'ARRIVED',
    'PASSENGER_ON_BOARD',
    'IN_PROGRESS',
    'FINISHING',
    'COMPLETED',
    'PAYMENT_PENDING',
    'PAYMENT_CONFIRMED',
    'FINISHED',
    'CANCELLED',
    'NO_DRIVER_FOUND',
    'TIMEOUT',
    'EXPIRED',
    'REJECTED'
);

-- 2. Métricas do Motorista para o Algoritmo de Score
ALTER TABLE public.driver_profiles
ADD COLUMN acceptance_rate DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN rating DECIMAL(3,2) DEFAULT 5.00,
ADD COLUMN total_trips INTEGER DEFAULT 0,
ADD COLUMN online_time_hours DECIMAL(10,2) DEFAULT 0;

-- 3. Tabela Central de Viagens (Trips)
-- Suporta Passageiros, Entregas e Fretes de forma agnóstica
CREATE TABLE public.trips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    passenger_id UUID REFERENCES public.profiles(id) NOT NULL,
    driver_id UUID REFERENCES public.driver_profiles(id), -- Null até dar o match
    vehicle_category_id UUID REFERENCES public.vehicle_categories(id) NOT NULL,
    
    -- Localização
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lng DOUBLE PRECISION NOT NULL,
    origin_address TEXT NOT NULL,
    dest_lat DOUBLE PRECISION NOT NULL,
    dest_lng DOUBLE PRECISION NOT NULL,
    dest_address TEXT NOT NULL,
    
    -- Status
    status trip_status DEFAULT 'REQUEST_CREATED' NOT NULL,
    
    -- Precificação e Distância
    estimated_distance_km DECIMAL(10,2) NOT NULL,
    estimated_duration_min INTEGER NOT NULL,
    estimated_fare DECIMAL(10,2) NOT NULL,
    final_fare DECIMAL(10,2),
    
    -- Metadados Dinâmicos (Para empresas, urgência, peso, etc)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Tempos (Observabilidade)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- 4. Tabela de Ofertas (Disparos do Dispatcher)
-- Para sabermos quem rejeitou, quem deixou expirar (Timeout 15s)
CREATE TABLE public.trip_offers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.driver_profiles(id) NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, EXPIRED
    score_calculated DECIMAL(10,2), -- O score gerado pelo algoritmo naquele instante
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Segurança RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_offers ENABLE ROW LEVEL SECURITY;

-- Políticas de Viagens (Trips)
CREATE POLICY "Passageiro vê próprias viagens" ON public.trips FOR SELECT USING (auth.uid() = passenger_id);
CREATE POLICY "Passageiro cria viagens" ON public.trips FOR INSERT WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "Motorista vê viagens vinculadas a ele" ON public.trips FOR SELECT USING (auth.uid() = driver_id);

-- Políticas de Ofertas (Offers)
CREATE POLICY "Motorista vê próprias ofertas" ON public.trip_offers FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Motorista atualiza própria oferta (Aceitar/Recusar)" ON public.trip_offers FOR UPDATE USING (auth.uid() = driver_id);
