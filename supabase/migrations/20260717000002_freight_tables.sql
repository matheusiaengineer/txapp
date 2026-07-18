-- Migration: Tabelas de frete, lances e carteira
-- =========================================================================

-- Tabela de Cargas (Freight Loads)
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

-- Tabela de Lances (Bids)
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

-- Tabela de Tracking
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

-- Tabela de Carteiras (Wallets)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0 NOT NULL,
    deposit_required DECIMAL(10,2) DEFAULT 0,
    is_qualified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Políticas loads
CREATE POLICY "Clientes veem próprias cargas"
    ON public.loads FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Transportadores veem cargas abertas"
    ON public.loads FOR SELECT USING (status = 'open');

CREATE POLICY "Clientes inserem cargas"
    ON public.loads FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Clientes atualizam próprias cargas"
    ON public.loads FOR UPDATE USING (auth.uid() = customer_id);

-- Políticas bids
CREATE POLICY "Transportadores veem próprios lances"
    ON public.bids FOR SELECT USING (auth.uid() = transporter_id);

CREATE POLICY "Clientes veem lances das próprias cargas"
    ON public.bids FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.loads WHERE id = bids.load_id AND customer_id = auth.uid())
    );

CREATE POLICY "Transportadores criam lances"
    ON public.bids FOR INSERT WITH CHECK (auth.uid() = transporter_id);

-- Políticas wallets
CREATE POLICY "Usuários veem própria carteira"
    ON public.wallets FOR SELECT USING (auth.uid() = profile_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_loads_customer ON public.loads (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_load ON public.bids (load_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_transporter ON public.bids (transporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_freight_tracking_code ON public.freight_tracking (code);
CREATE INDEX IF NOT EXISTS idx_wallets_profile ON public.wallets (profile_id);
