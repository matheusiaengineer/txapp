-- =========================================================================
-- TXD DYNAMIC VEHICLE CATEGORIES & SMART DISPATCHER
-- =========================================================================

-- Tabela Central de Categorias de Veículos (Totalmente dinâmica)
CREATE TABLE public.vehicle_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL, -- Moto, Carro, Van, Caminhao...
    display_name TEXT NOT NULL,
    max_passengers INTEGER DEFAULT 0,
    max_load_weight_kg DECIMAL(10,2) DEFAULT 0,
    max_load_volume_m3 DECIMAL(10,2) DEFAULT 0,
    requires_special_license BOOLEAN DEFAULT FALSE,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Regras de Precificação Refinada
-- Substitui a restrição text por chave estrangeira
ALTER TABLE public.pricing_rules 
DROP COLUMN vehicle_category,
ADD COLUMN vehicle_category_id UUID REFERENCES public.vehicle_categories(id) ON DELETE CASCADE;

-- Configurações de Raio e Cobertura por Cidade
ALTER TABLE public.pricing_rules
ADD COLUMN max_dispatch_radius_km DECIMAL(10,2) DEFAULT 5.0,
ADD COLUMN search_expansion_interval_sec INTEGER DEFAULT 15;

-- Inserindo categorias base
INSERT INTO public.vehicle_categories (name, display_name, max_passengers) VALUES ('car', 'Carro Popular', 4);
INSERT INTO public.vehicle_categories (name, display_name, max_passengers, max_load_weight_kg) VALUES ('moto', 'Moto', 1, 20);
INSERT INTO public.vehicle_categories (name, display_name, max_load_weight_kg, max_load_volume_m3) VALUES ('van', 'Van de Carga', 0, 1500, 10);
INSERT INTO public.vehicle_categories (name, display_name, max_load_weight_kg, max_load_volume_m3, requires_special_license) VALUES ('truck', 'Caminhão', 0, 8000, 40, TRUE);

-- RLS
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública de categorias" ON public.vehicle_categories FOR SELECT USING (true);
