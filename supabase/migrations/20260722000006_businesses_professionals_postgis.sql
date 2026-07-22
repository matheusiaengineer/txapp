-- TXAP - Businesses, Professionals, Events, Jobs, PostGIS, Breath Rate
-- Migration safe: usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

-- ============================================================
-- 1. POSTGIS (obrigatório para mapa)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 2. COLUNAS NOVAS EM profiles (segurança + motorista)
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_profiles_online ON profiles(is_online) WHERE is_online = true;

-- ============================================================
-- 3. banned_devices (cria se não existir + coluna ip_address)
-- ============================================================
CREATE TABLE IF NOT EXISTS banned_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint TEXT NOT NULL UNIQUE,
  reason TEXT,
  ip_address INET,
  banned_at TIMESTAMPTZ DEFAULT NOW(),
  banned_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- 4. signup_attempts_log (cria se não existir + índices)
-- ============================================================
CREATE TABLE IF NOT EXISTS signup_attempts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  phone VARCHAR(20),
  cpf VARCHAR(14),
  device_fingerprint TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_signup_ip ON signup_attempts_log(ip_address, attempted_at);
CREATE INDEX IF NOT EXISTS idx_signup_phone ON signup_attempts_log(phone, attempted_at);

-- ============================================================
-- 5. businesses (NOVA -取代 companies para cadastro universal)
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_businesses_categories ON businesses USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city, state);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_businesses_keywords ON businesses USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_businesses_featured ON businesses(is_featured) WHERE is_featured = true;

-- ============================================================
-- 6. business_products
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_products_business ON business_products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON business_products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON business_products(is_available) WHERE is_available = true;

-- ============================================================
-- 7. business_reviews
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_reviews_business ON business_reviews(business_id);

-- ============================================================
-- 8. professionals
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_professionals_profession ON professionals(profession);
CREATE INDEX IF NOT EXISTS idx_professionals_available ON professionals(is_available) WHERE is_available = true;

-- ============================================================
-- 9. city_events
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_events_city ON city_events(city, state);
CREATE INDEX IF NOT EXISTS idx_events_dates ON city_events(starts_at, ends_at);

-- ============================================================
-- 10. city_jobs
-- ============================================================
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

-- ============================================================
-- 11. orders (pedidos universal)
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_business ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================================
-- 12. city_launches — colunas adicionais
-- ============================================================
DO $$ BEGIN
  ALTER TABLE city_launches ADD COLUMN IF NOT EXISTS genesis_budget NUMERIC(10,2) DEFAULT 10000.00;
  ALTER TABLE city_launches ADD COLUMN IF NOT EXISTS current_motoristas INTEGER DEFAULT 0;
  ALTER TABLE city_launches ADD COLUMN IF NOT EXISTS current_comercios INTEGER DEFAULT 0;
  ALTER TABLE city_launches ADD COLUMN IF NOT EXISTS end_seed_date TIMESTAMPTZ;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================
-- 13. driver_guarantees — colunas adicionais
-- ============================================================
DO $$ BEGIN
  ALTER TABLE driver_guarantees ADD COLUMN IF NOT EXISTS unlock_date TIMESTAMPTZ;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================
-- 14. respiratory_snapshots — colunas adicionais
-- ============================================================
DO $$ BEGIN
  ALTER TABLE respiratory_snapshots ADD COLUMN IF NOT EXISTS avg_wait_time_minutes INTEGER;
  ALTER TABLE respiratory_snapshots ADD COLUMN IF NOT EXISTS breath_rate INTEGER CHECK (breath_rate BETWEEN 0 AND 100);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================
-- 15. favorites (cria se não existir + índices)
-- ============================================================
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
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(favorite_type);

-- ============================================================
-- 16. influencers (cria se não existir + índices)
-- ============================================================
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
CREATE INDEX IF NOT EXISTS idx_influencers_active ON influencers(is_active) WHERE is_active = true;

-- ============================================================
-- 17. wallet_transactions — colunas adicionais
-- ============================================================
DO $$ BEGIN
  ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS unlock_date TIMESTAMPTZ;
  CREATE INDEX IF NOT EXISTS idx_wallet_profile ON wallet_transactions(profile_id);
  CREATE INDEX IF NOT EXISTS idx_wallet_status ON wallet_transactions(status);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================
-- 18. global_config (cria se não existir + configs padrão)
-- ============================================================
CREATE TABLE IF NOT EXISTS global_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);
INSERT INTO global_config (key, value, description) VALUES
('platform_commission_fee', '"0.10"', 'Comissão da plataforma (10%)'),
('min_price_per_km_moto', '"1.00"', 'Preço mínimo por km para moto'),
('min_price_per_km_carro', '"1.50"', 'Preço mínimo por km para carro'),
('genesis_guarantee_amount', '"500"', 'Garantia Genesis para motoristas'),
('genesis_guarantee_days', '"30"', 'Dias da garantia Genesis'),
('subscription_destaque_price', '"300"', 'Preço assinatura Destaque (semanal)'),
('subscription_premium_price', '"500"', 'Preço assinatura Premium (semanal)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 19. FUNÇÃO: nearby_drivers (PostGIS)
-- ============================================================
CREATE OR REPLACE FUNCTION nearby_drivers(
  user_lat NUMERIC,
  user_lng NUMERIC,
  search_radius NUMERIC,
  v_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  lat NUMERIC,
  lng NUMERIC,
  vehicle_type TEXT,
  rating NUMERIC,
  price_per_km NUMERIC,
  distance_meters NUMERIC,
  is_online BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    ST_Y(p.location::geometry)::NUMERIC,
    ST_X(p.location::geometry)::NUMERIC,
    p.vehicle_type,
    p.rating,
    p.price_per_km,
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    )::NUMERIC,
    p.is_online
  FROM profiles p
  WHERE
    p.account_type LIKE 'driver_%'
    AND p.is_online = true
    AND p.is_banned = false
    AND p.location IS NOT NULL
    AND ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      search_radius
    )
    AND (v_type IS NULL OR p.vehicle_type = v_type)
  ORDER BY distance_meters ASC
  LIMIT 20;
END;
$$;

-- ============================================================
-- 20. FUNÇÃO: calculate_breath_rate
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_breath_rate(city_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_available INTEGER;
  v_active INTEGER;
  v_rate INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_available
  FROM profiles
  WHERE account_type LIKE 'driver_%'
    AND is_online = true
    AND current_city = (SELECT city_name FROM city_launches WHERE id = city_uuid);

  SELECT COUNT(*) INTO v_active
  FROM trips
  WHERE status IN ('pending', 'accepted', 'in_progress')
    AND city = (SELECT city_name FROM city_launches WHERE id = city_uuid);

  IF v_available = 0 THEN
    v_rate := 100;
  ELSE
    v_rate := LEAST(100, (v_active * 100 / GREATEST(v_available, 1)));
  END IF;

  RETURN v_rate;
END;
$$;
