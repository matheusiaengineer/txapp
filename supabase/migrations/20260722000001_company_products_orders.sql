-- TXAP Company Products & Orders
-- Catálogo de produtos, serviços e pedidos para empresas

-- Categorias de produto/serviço
DO $$ BEGIN CREATE TYPE service_category AS ENUM (
  'delivery', 'supermarket', 'pharmacy', 'restaurant',
  'water', 'gas', 'mechanic', 'electrician',
  'plumber', 'cleaning', 'petshop', 'other'
); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'preparing', 'in_delivery',
  'delivered', 'cancelled'
); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Serviços que uma empresa oferece
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

-- Produtos que uma empresa vende (água, gás, mercado, etc.)
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

-- Pedidos de produtos para empresas
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

-- Diretório público de profissionais com localização
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

-- Adicionar localização às empresas
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT FALSE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS delivery_radius_km DECIMAL(10,2) DEFAULT 5;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS min_order_value DECIMAL(10,2) DEFAULT 0;

-- RLS
ALTER TABLE public.company_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_directory ENABLE ROW LEVEL SECURITY;

-- Policies: serviços e produtos (leitura pública, escrita só da empresa)
DO $$ BEGIN
  CREATE POLICY "Leitura pública de serviços" ON public.company_services
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Empresa gerencia serviços" ON public.company_services
    FOR ALL USING (auth.uid() = company_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Leitura pública de produtos" ON public.company_products
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Empresa gerencia produtos" ON public.company_products
    FOR ALL USING (auth.uid() = company_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Policies: pedidos (cliente vê próprios, empresa vê recebidos)
DO $$ BEGIN
  CREATE POLICY "Cliente vê próprios pedidos" ON public.company_orders
    FOR SELECT USING (auth.uid() = customer_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Cliente cria pedidos" ON public.company_orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Empresa vê pedidos recebidos" ON public.company_orders
    FOR SELECT USING (auth.uid() = company_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Empresa atualiza pedidos" ON public.company_orders
    FOR UPDATE USING (auth.uid() = company_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Policies: diretório profissional
DO $$ BEGIN
  CREATE POLICY "Leitura pública do diretório" ON public.professional_directory
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Profissional gerencia próprio perfil" ON public.professional_directory
    FOR ALL USING (auth.uid() = profile_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Índices geo
CREATE INDEX IF NOT EXISTS idx_company_products_company ON public.company_products (company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_company_products_category ON public.company_products (category);
CREATE INDEX IF NOT EXISTS idx_company_orders_customer ON public.company_orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_orders_company ON public.company_orders (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_professional_directory_location ON public.professional_directory USING GIST (ll_to_earth(lat, lng));
CREATE INDEX IF NOT EXISTS idx_professional_directory_profession ON public.professional_directory (profession);
CREATE INDEX IF NOT EXISTS idx_companies_location ON public.companies USING GIST (ll_to_earth(lat, lng));

-- RPC: nearby_companies - busca empresas próximas por geolocalização
CREATE OR REPLACE FUNCTION nearby_companies(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_radius_km DOUBLE PRECISION DEFAULT 10)
RETURNS SETOF public.companies
LANGUAGE sql
AS $$
  SELECT *
  FROM public.companies
  WHERE lat IS NOT NULL
    AND lng IS NOT NULL
    AND earth_distance(ll_to_earth(lat, lng), ll_to_earth(p_lat, p_lng)) / 1000 <= p_radius_km
  ORDER BY earth_distance(ll_to_earth(lat, lng), ll_to_earth(p_lat, p_lng))
  LIMIT 50;
$$;

-- RPC: nearby_professionals - busca profissionais próximos por geolocalização
CREATE OR REPLACE FUNCTION nearby_professionals(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_radius_km DOUBLE PRECISION DEFAULT 10, p_profession TEXT DEFAULT NULL)
RETURNS SETOF public.professional_directory
LANGUAGE sql
AS $$
  SELECT *
  FROM public.professional_directory
  WHERE lat IS NOT NULL
    AND lng IS NOT NULL
    AND is_available = true
    AND (p_profession IS NULL OR profession = p_profession)
    AND earth_distance(ll_to_earth(lat, lng), ll_to_earth(p_lat, p_lng)) / 1000 <= p_radius_km
  ORDER BY earth_distance(ll_to_earth(lat, lng), ll_to_earth(p_lat, p_lng))
  LIMIT 50;
$$;

-- Trigger: updated_at
DROP TRIGGER IF EXISTS update_company_products_updated_at ON public.company_products;
CREATE TRIGGER update_company_products_updated_at
  BEFORE UPDATE ON public.company_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_orders_updated_at ON public.company_orders;
CREATE TRIGGER update_company_orders_updated_at
  BEFORE UPDATE ON public.company_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_professional_directory_updated_at ON public.professional_directory;
CREATE TRIGGER update_professional_directory_updated_at
  BEFORE UPDATE ON public.professional_directory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
