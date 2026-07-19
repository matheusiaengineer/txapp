-- Driver Pricing: motorista define propria faixa de preco por km

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

ALTER TABLE public.driver_pricing ENABLE ROW LEVEL SECURITY;

-- RLS
DO $$ BEGIN
    CREATE POLICY "Motorista ve propria precificacao"
        ON public.driver_pricing FOR SELECT USING (auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Motoristas podem ver precos de outros"
        ON public.driver_pricing FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Motorista gerencia propria precificacao"
        ON public.driver_pricing FOR INSERT WITH CHECK (auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Motorista atualiza propria precificacao"
        ON public.driver_pricing FOR UPDATE USING (auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Motorista deleta propria precificacao"
        ON public.driver_pricing FOR DELETE USING (auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Indices
CREATE INDEX IF NOT EXISTS idx_driver_pricing_driver ON public.driver_pricing (driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_pricing_active ON public.driver_pricing (service_type, is_active);
