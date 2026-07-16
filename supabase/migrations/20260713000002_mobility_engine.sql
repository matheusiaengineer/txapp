-- =========================================================================
-- TXD MOBILITY ENGINE - Estrutura Base
-- =========================================================================

-- Tipos Enum para Eventos Viários (Road Intelligence)
CREATE TYPE road_event_type AS ENUM (
    'accident', 'traffic_jam', 'road_work', 'police', 
    'speed_camera', 'gas_station', 'ev_station', 'toll', 'weather_hazard'
);

CREATE TYPE distance_unit AS ENUM ('km', 'mi');
CREATE TYPE currency_code AS ENUM ('BRL', 'USD', 'EUR');

-- Cidades de Operação (Internacionalização base)
CREATE TABLE public.cities (
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

-- Motor de Precificação Dinâmico
-- (Não haverá preço "chumbado" no código, tudo vem desta tabela)
CREATE TABLE public.pricing_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    vehicle_category TEXT NOT NULL, -- Ex: 'carro', 'moto', 'caminhao'
    base_fare DECIMAL(10,2) NOT NULL, -- Tarifa base (R$ / $)
    price_per_unit DECIMAL(10,2) NOT NULL, -- Valor por Km / Milha
    price_per_minute DECIMAL(10,2) NOT NULL, -- Valor por minuto
    min_fare DECIMAL(10,2) NOT NULL, -- Tarifa mínima
    platform_fee_percent DECIMAL(5,2) DEFAULT 15.00, -- 15% para a plataforma
    surge_multiplier DECIMAL(5,2) DEFAULT 1.00, -- Tarifa Dinâmica
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Road Intelligence (Eventos reportados ou integrados)
CREATE TABLE public.road_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id),
    type road_event_type NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    reported_by UUID REFERENCES public.profiles(id), -- Quem reportou (opcional)
    expires_at TIMESTAMP WITH TIME ZONE, -- Quando o evento deve sumir
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Segurança RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_events ENABLE ROW LEVEL SECURITY;

-- Cidades e Preços podem ser LIDOS por qualquer usuário autenticado (para cotar viagem)
CREATE POLICY "Leitura pública de cidades" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Leitura pública de preços" ON public.pricing_rules FOR SELECT USING (true);
CREATE POLICY "Leitura pública de eventos viários" ON public.road_events FOR SELECT USING (true);

-- APENAS ADMINS podem inserir/modificar cidades e preços (Políticas futuras de Admin)
-- Eventos podem ser reportados por motoristas verificados (KYC)
CREATE POLICY "Motoristas verificados podem reportar eventos" ON public.road_events 
    FOR INSERT WITH CHECK (
        auth.uid() = reported_by 
        AND EXISTS (
            SELECT 1 FROM public.driver_profiles 
            WHERE id = auth.uid() AND status = 'approved'
        )
    );
