-- Negotiations: sistema de oferta e contra-oferta entre passageiro e motorista

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

ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;

-- RLS
DO $$ BEGIN
    CREATE POLICY "Passageiro ve proprias negociacoes"
        ON public.negotiations FOR SELECT USING (auth.uid() = passenger_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Motorista ve negociacoes recebidas"
        ON public.negotiations FOR SELECT USING (auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Passageiro cria negociacao"
        ON public.negotiations FOR INSERT WITH CHECK (auth.uid() = passenger_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Motorista responde negociacao"
        ON public.negotiations FOR UPDATE USING (auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Passageiro atualiza negociacao"
        ON public.negotiations FOR UPDATE USING (auth.uid() = passenger_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Indices
CREATE INDEX IF NOT EXISTS idx_negotiations_passenger ON public.negotiations (passenger_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_negotiations_driver ON public.negotiations (driver_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_negotiations_trip ON public.negotiations (trip_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON public.negotiations (status, expires_at);
