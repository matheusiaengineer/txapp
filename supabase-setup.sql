BEGIN;

-- 1. app_config
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_config_read" ON public.app_config;
CREATE POLICY "app_config_read" ON public.app_config FOR SELECT USING (true);
INSERT INTO public.app_config (key, value) VALUES
  ('global.price_per_km', '{"default": 2500}'),
  ('global.platform_fee_percent', '{"default": 15}'),
  ('global.search_radius_km', '{"default": 10}'),
  ('global.min_fare', '{"default": 700}')
ON CONFLICT (key) DO NOTHING;

-- 2. drivers_online
CREATE TABLE IF NOT EXISTS public.drivers_online (
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    heading REAL DEFAULT 0,
    status TEXT DEFAULT 'ONLINE',
    last_updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.drivers_online ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "drivers_online_self" ON public.drivers_online;
DROP POLICY IF EXISTS "drivers_online_read" ON public.drivers_online;
CREATE POLICY "drivers_online_self" ON public.drivers_online FOR ALL USING (auth.uid() = driver_id);
CREATE POLICY "drivers_online_read" ON public.drivers_online FOR SELECT USING (status = 'ONLINE');

-- 3. saved_locations
CREATE TABLE IF NOT EXISTS public.saved_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'other' CHECK (type IN ('home','work','other')),
    full_address TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_locations_user" ON public.saved_locations;
CREATE POLICY "saved_locations_user" ON public.saved_locations FOR ALL USING (auth.uid() = user_id);

-- 4. Missing columns on wallet_transactions
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMIT;
