-- TXAP v2.0 - Seguranca, 4 Tipos de Conta, Favoritos, Influenciadores, Admin

-- ============================================================
-- FASE A: SEGURANCA
-- ============================================================

-- Profiles: colunas de seguranca
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'passenger' CHECK (account_type IN ('passenger', 'driver_moto', 'driver_car', 'business'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_change_name BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name_last_changed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_attempts INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_signup_attempt_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(is_banned) WHERE is_banned = true;
CREATE INDEX IF NOT EXISTS idx_profiles_device ON profiles(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Banned devices (anti-fraude)
CREATE TABLE IF NOT EXISTS banned_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint TEXT NOT NULL UNIQUE,
  reason TEXT,
  banned_at TIMESTAMPTZ DEFAULT NOW(),
  banned_by UUID REFERENCES profiles(id)
);

ALTER TABLE banned_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_banned_devices" ON banned_devices FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Signup attempts log (rate limiting)
CREATE TABLE IF NOT EXISTS signup_attempts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  phone VARCHAR(20),
  cpf VARCHAR(14),
  device_fingerprint TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT false
);

ALTER TABLE signup_attempts_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_signup_log" ON signup_attempts_log FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_signup_ip ON signup_attempts_log(ip_address, attempted_at);
CREATE INDEX IF NOT EXISTS idx_signup_phone ON signup_attempts_log(phone, attempted_at);

-- ============================================================
-- FASE C: INFLUENCIADORES
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

ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_influencers" ON influencers FOR SELECT USING (true);
CREATE POLICY "admin_full_influencers" ON influencers FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ============================================================
-- FASE F: FAVORITOS
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

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(favorite_type);

-- ============================================================
-- CONFIGURACOES GLOBAIS (admin)
-- ============================================================

CREATE TABLE IF NOT EXISTS global_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

ALTER TABLE global_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_config" ON global_config FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

INSERT INTO global_config (key, value, description) VALUES
('platform_commission', '0.10', 'Comissao da plataforma (10%)'),
('min_price_per_km_moto', '1.00', 'Preco minimo por km para moto'),
('min_price_per_km_carro', '1.50', 'Preco minimo por km para carro'),
('max_price_per_km', '20.00', 'Preco maximo por km'),
('genesis_guarantee_amount', '500', 'Garantia Genesis em reais'),
('genesis_guarantee_days', '30', 'Dias da garantia Genesis'),
('social_fee_percent', '1.0', 'Porcentagem para fundo social TXAP')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FUNCOES
-- ============================================================

-- Validar CPF (algoritmo dos digitos verificadores)
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  numbers TEXT;
  cpf_clean TEXT;
  sum1 INT := 0;
  sum2 INT := 0;
  digit1 INT;
  digit2 INT;
BEGIN
  cpf_clean := regexp_replace(cpf, '[^0-9]', '', 'g');
  IF length(cpf_clean) != 11 THEN RETURN FALSE; END IF;
  IF cpf_clean ~ '^(\d)\1{10}$' THEN RETURN FALSE; END IF;

  FOR i IN 1..9 LOOP
    sum1 := sum1 + (substr(cpf_clean, i, 1)::INT * (11 - i));
  END LOOP;
  digit1 := (sum1 * 10) % 11;
  IF digit1 = 10 THEN digit1 := 0; END IF;
  IF substr(cpf_clean, 10, 1)::INT != digit1 THEN RETURN FALSE; END IF;

  FOR i IN 1..10 LOOP
    sum2 := sum2 + (substr(cpf_clean, i, 1)::INT * (12 - i));
  END LOOP;
  digit2 := (sum2 * 10) % 11;
  IF digit2 = 10 THEN digit2 := 0; END IF;
  IF substr(cpf_clean, 11, 1)::INT != digit2 THEN RETURN FALSE; END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-criar admin Matheus16k na primeira execucao
DO $$
DECLARE
  admin_id UUID;
  admin_email TEXT := COALESCE(current_setting('app.admin_email', true), 'matheus16k@gmail.com');
BEGIN
  SELECT id INTO admin_id FROM profiles WHERE email = admin_email;
  IF admin_id IS NULL THEN
    INSERT INTO profiles (email, full_name, role, account_type, phone_verified, cpf_verified)
    VALUES (admin_email, 'Matheus16k', 'admin', 'business', true, true);
  ELSE
    UPDATE profiles SET role = 'admin' WHERE id = admin_id AND role != 'admin';
  END IF;
END $$;
