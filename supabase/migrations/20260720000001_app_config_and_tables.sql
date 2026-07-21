-- =========================================================================
-- TXDAPP — MÓDULO 1: Banco de Dados e Configurações
-- Migration: 20260720000001
-- Descrição: app_config, saved_locations, drivers_online, coupons,
--   withdrawals, messages, ratings fix, RPCs, triggers, constraints,
--   índices, Realtime publication
-- =========================================================================

BEGIN;

-- =========================================================================
-- 1. TABELA app_config — Configurações dinâmicas do app
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Leitura pública de app_config"
    ON public.app_config FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Inserir configurações padrão
INSERT INTO public.app_config (key, value, description) VALUES
('global.price_per_km', '{"default": 2500, "min": 1500, "max": 5000}'::jsonb, 'Preço por km em centavos (padrão, mínimo, máximo)'),
('global.platform_fee_percent', '{"default": 15, "min": 5, "max": 35}'::jsonb, 'Taxa da plataforma em percentual'),
('global.search_radius_km', '{"default": 10, "min": 3, "max": 50}'::jsonb, 'Raio de busca de motoristas em km'),
('global.min_fare', '{"default": 700}'::jsonb, 'Tarifa mínima em centavos'),
('global.cancellation_fee', '{"default": 500}'::jsonb, 'Taxa de cancelamento em centavos'),
('global.waiting_time_min', '{"default": 5}'::jsonb, 'Tempo de espera antes de cobrar taxa'),
('global.night_multiplier', '{"default": 1.3}'::jsonb, 'Multiplicador noturno'),
('global.night_start', '{"default": "22:00"}'::jsonb, 'Início do período noturno'),
('global.night_end', '{"default": "06:00"}'::jsonb, 'Fim do período noturno'),
('global.surge_enabled', '{"default": true}'::jsonb, 'Tarifa dinâmica ativada'),
('global.max_surge_multiplier', '{"default": 2.5}'::jsonb, 'Multiplicador máximo da tarifa dinâmica'),
('global.min_withdrawal', '{"default": 5000}'::jsonb, 'Saque mínimo em centavos'),
('global.referral_bonus', '{"default": 2000}'::jsonb, 'Bônus de indicação em centavos')
ON CONFLICT (key) DO NOTHING;

-- =========================================================================
-- 2. TABELA saved_locations — Endereços favoritos (Casa/Trabalho)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.saved_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('home', 'work', 'other')) DEFAULT 'other',
    full_address TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    complement TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Usuários gerenciam seus endereços salvos"
    ON public.saved_locations FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_saved_locations_user ON public.saved_locations (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_type ON public.saved_locations (user_id, type);

-- =========================================================================
-- 3. TABELA drivers_online — Rastreamento em tempo real (substitui driver_heartbeats para consultas frequentes)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.drivers_online (
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    heading REAL DEFAULT 0,
    speed REAL DEFAULT 0,
    accuracy REAL DEFAULT 0,
    battery_level INTEGER DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'BUSY', 'OFFLINE')),
    vehicle_category TEXT,
    last_updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.drivers_online ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Motoristas atualizam própria localização"
    ON public.drivers_online FOR ALL USING (auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Leitura pública de motoristas online"
    ON public.drivers_online FOR SELECT USING (status != 'OFFLINE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_drivers_online_status ON public.drivers_online (status);
CREATE INDEX IF NOT EXISTS idx_drivers_online_location ON public.drivers_online USING GIST (ll_to_earth(lat, lng));
CREATE INDEX IF NOT EXISTS idx_drivers_online_last_update ON public.drivers_online (last_updated_at DESC);

-- =========================================================================
-- 4. TABELA coupons — Cupons de desconto
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Leitura pública de cupons ativos"
    ON public.coupons FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_active_expires ON public.coupons (is_active, expires_at);

-- RPC para validar cupom
CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  SELECT * INTO v_coupon FROM public.coupons
  WHERE code = UPPER(p_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cupom não encontrado');
  END IF;

  IF v_coupon.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cupom expirado');
  END IF;

  IF v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cupom já atingiu o limite de usos');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'min_order_value', v_coupon.min_order_value,
    'max_discount', v_coupon.max_discount,
    'description', v_coupon.description
  );
END;
$$;

-- Trigger para incrementar current_uses ao usar cupom
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.coupons
  SET current_uses = current_uses + 1
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- =========================================================================
-- 5. TABELA withdrawals — Saques dos motoristas
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    pix_key TEXT NOT NULL,
    pix_key_type TEXT NOT NULL CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')) DEFAULT 'cpf',
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    gateway_transaction_id TEXT,
    gateway_response JSONB DEFAULT '{}'::jsonb,
    fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount - fee) STORED,
    processed_at TIMESTAMPTZ,
    failed_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Motorista vê próprios saques"
    ON public.withdrawals FOR SELECT USING (auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Motorista cria saque"
    ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_withdrawals_driver ON public.withdrawals (driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals (status);

-- RPC para solicitar saque
CREATE OR REPLACE FUNCTION request_withdrawal(
  p_driver_id UUID,
  p_amount INTEGER,
  p_pix_key TEXT,
  p_pix_key_type TEXT DEFAULT 'cpf'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance INTEGER;
  v_min_withdrawal INTEGER;
  v_withdrawal_id UUID;
BEGIN
  -- Buscar saldo calculado
  SELECT COALESCE(SUM(
    CASE WHEN type IN ('deposit', 'refund', 'bonus', 'cashback', 'ride_earning', 'freight_earning')
      THEN amount ELSE -amount END
  ), 0) INTO v_balance
  FROM public.wallet_transactions
  WHERE profile_id = p_driver_id AND status = 'confirmed';

  -- Buscar saque mínimo da config
  SELECT (value->>'default')::INTEGER INTO v_min_withdrawal
  FROM public.app_config WHERE key = 'global.min_withdrawal';

  IF v_min_withdrawal IS NULL THEN v_min_withdrawal := 5000; END IF;

  IF v_balance < v_min_withdrawal THEN
    RETURN jsonb_build_object('success', false, 'message', format('Saldo insuficiente. Mínimo: R$ %.2f', v_min_withdrawal / 100.0));
  END IF;

  IF p_amount > v_balance THEN
    RETURN jsonb_build_object('success', false, 'message', 'Saldo insuficiente para este saque');
  END IF;

  INSERT INTO public.withdrawals (driver_id, amount, pix_key, pix_key_type, status)
  VALUES (p_driver_id, p_amount / 100.0, p_pix_key, p_pix_key_type, 'pending')
  RETURNING id INTO v_withdrawal_id;

  -- Inserir transação de débito
  INSERT INTO public.wallet_transactions (
    profile_id, wallet_id, type, amount, balance_before, balance_after,
    status, description, reference_type, reference_id
  )
  SELECT
    p_driver_id,
    w.id,
    'withdrawal',
    p_amount / 100.0,
    v_balance / 100.0,
    (v_balance - p_amount) / 100.0,
    'confirmed',
    'Saque para PIX',
    'withdrawal',
    v_withdrawal_id
  FROM public.wallets w WHERE w.profile_id = p_driver_id;

  RETURN jsonb_build_object('success', true, 'withdrawal_id', v_withdrawal_id, 'amount', p_amount);
END;
$$;

-- =========================================================================
-- 6. TABELA messages — Chat entre passageiro e motorista
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'system')),
    file_url TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Participantes da viagem veem mensagens"
    ON public.messages FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND (t.passenger_id = auth.uid() OR t.driver_id = auth.uid()))
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Participantes da viagem enviam mensagens"
    ON public.messages FOR INSERT WITH CHECK (
      sender_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.trips t WHERE t.id = trip_id AND (t.passenger_id = auth.uid() OR t.driver_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_trip ON public.messages (trip_id, created_at ASC);

-- =========================================================================
-- 7. CORREÇÃO: TABELA ratings — Com RLS e triggers
-- =========================================================================
DO $$ BEGIN
  ALTER TABLE public.ratings
    ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS rating_type TEXT CHECK (rating_type IN ('driver_to_passenger', 'passenger_to_driver')) DEFAULT 'passenger_to_driver',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Trigger para atualizar rating do motorista
CREATE OR REPLACE FUNCTION update_driver_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_rating DECIMAL;
BEGIN
  IF NEW.rating_type = 'passenger_to_driver' THEN
    SELECT ROUND(AVG(score)::DECIMAL, 2) INTO v_new_rating
    FROM public.ratings
    WHERE ratee_id = NEW.ratee_id AND rating_type = 'passenger_to_driver';

    UPDATE public.driver_profiles
    SET rating = v_new_rating
    WHERE id = NEW.ratee_id;

    -- Se nota < 3.0, bloquear conta do motorista
    IF v_new_rating < 3.0 THEN
      UPDATE public.driver_profiles SET status = 'rejected' WHERE id = NEW.ratee_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_driver_rating ON public.ratings;
CREATE TRIGGER trg_update_driver_rating
  AFTER INSERT ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_rating();

-- =========================================================================
-- 8. TABELA notifications — Alertas no app (substitui a existente se necessário)
-- =========================================================================
-- Já existe: 20260718000001_notifications.sql
-- Garantir que está na publicação Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.notifications;

-- =========================================================================
-- 9. CONSTRAINTS ADICIONAIS
-- =========================================================================

-- Garantir que balance da carteira nunca seja negativo (constraint de validação via trigger)
CREATE OR REPLACE FUNCTION check_wallet_balance_non_negative()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT COALESCE(SUM(
    CASE WHEN type IN ('deposit', 'refund', 'bonus', 'cashback', 'ride_earning', 'freight_earning')
      THEN amount ELSE -amount END
  ), 0) INTO v_balance
  FROM public.wallet_transactions
  WHERE profile_id = NEW.profile_id AND status = 'confirmed';

  IF v_balance < 0 THEN
    RAISE EXCEPTION 'Saldo da carteira não pode ser negativo (saldo atual: %)', v_balance
      USING HINT = 'Transação rejeitada para evitar saldo negativo';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_wallet_balance ON public.wallet_transactions;
CREATE TRIGGER trg_check_wallet_balance
  BEFORE INSERT ON public.wallet_transactions
  FOR EACH ROW
  WHEN (NEW.type IN ('withdrawal', 'payment', 'ride_payment', 'freight_payment', 'platform_fee'))
  EXECUTE FUNCTION check_wallet_balance_non_negative();

-- Constraint: trip_status só aceita valores válidos (já existe no enum)
-- Garantir que o CHECK de trip_status esteja correto (já é ENUM, seguro por definição)

-- =========================================================================
-- 10. REALTIME PUBLICATION — Garantir tabelas essenciais
-- =========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.drivers_online;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.trip_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.wallet_transactions;

-- =========================================================================
-- 11. TRIGGER: Criar carteira automaticamente ao registrar usuário
-- =========================================================================
-- Já existe em 20260718000004_wallet_transactions.sql (trg_ensure_wallet)
-- Re-criar para garantir
CREATE OR REPLACE FUNCTION public.ensure_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (profile_id, balance, is_qualified)
    VALUES (NEW.id, 0, false)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_ensure_wallet ON public.profiles;
CREATE TRIGGER trg_ensure_wallet
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_wallet();

-- =========================================================================
-- 12. TRIGGER: updated_at para todas as tabelas que faltam
-- =========================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger updated_at para tabelas que não têm
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['app_config', 'saved_locations', 'withdrawals', 'coupons', 'ratings', 'messages', 'drivers_online'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON public.%s
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END;
$$;

-- =========================================================================
-- 13. RPC: calculate_ride_price(distance, vehicle_type)
-- =========================================================================
CREATE OR REPLACE FUNCTION calculate_ride_price(
  p_distance_km DECIMAL,
  p_vehicle_type TEXT DEFAULT 'carro',
  p_city_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_price_per_km INTEGER;
  v_base_fare INTEGER;
  v_min_fare INTEGER;
  v_total INTEGER;
  v_config JSONB;
BEGIN
  -- Buscar preço por km da configuração global
  SELECT value INTO v_config FROM public.app_config WHERE key = 'global.price_per_km';
  v_price_per_km := COALESCE((v_config->>'default')::INTEGER, 2500);

  SELECT value INTO v_config FROM public.app_config WHERE key = 'global.min_fare';
  v_min_fare := COALESCE((v_config->>'default')::INTEGER, 700);

  -- Base fare fixa de 500 centavos
  v_base_fare := 500;

  -- Calcular total em centavos
  v_total := v_base_fare + CEIL(p_distance_km * v_price_per_km);

  -- Aplicar tarifa mínima
  IF v_total < v_min_fare THEN
    v_total := v_min_fare;
  END IF;

  RETURN jsonb_build_object(
    'total_cents', v_total,
    'total_brl', (v_total / 100.0)::DECIMAL(10,2),
    'base_fare_cents', v_base_fare,
    'distance_fare_cents', v_total - v_base_fare,
    'distance_km', p_distance_km,
    'price_per_km_cents', v_price_per_km
  );
END;
$$;

-- =========================================================================
-- 14. RPC: get_driver_earnings(driver_id, date_range)
-- =========================================================================
CREATE OR REPLACE FUNCTION get_driver_earnings(
  p_driver_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_earned DECIMAL;
  v_total_trips INTEGER;
  v_total_distance DECIMAL;
  v_total_time INTEGER;
  v_weekly JSONB;
BEGIN
  -- Total ganho no período
  SELECT COALESCE(SUM(t.final_fare), 0) INTO v_total_earned
  FROM public.trips t
  WHERE t.driver_id = p_driver_id
    AND t.status = 'FINISHED'
    AND t.completed_at BETWEEN p_start_date AND p_end_date;

  -- Total de corridas
  SELECT COUNT(*) INTO v_total_trips
  FROM public.trips t
  WHERE t.driver_id = p_driver_id
    AND t.status = 'FINISHED'
    AND t.completed_at BETWEEN p_start_date AND p_end_date;

  -- Total de distância
  SELECT COALESCE(SUM(t.estimated_distance_km), 0) INTO v_total_distance
  FROM public.trips t
  WHERE t.driver_id = p_driver_id
    AND t.status = 'FINISHED'
    AND t.completed_at BETWEEN p_start_date AND p_end_date;

  -- Total de tempo (min)
  SELECT COALESCE(SUM(t.estimated_duration_min), 0) INTO v_total_time
  FROM public.trips t
  WHERE t.driver_id = p_driver_id
    AND t.status = 'FINISHED'
    AND t.completed_at BETWEEN p_start_date AND p_end_date;

  -- Agrupamento semanal
  SELECT jsonb_agg(jsonb_build_object(
    'week', to_char(week_start, 'YYYY-MM-DD'),
    'earnings', weekly_earnings,
    'trips', weekly_trips
  ) ORDER BY week_start) INTO v_weekly
  FROM (
    SELECT
      date_trunc('week', t.completed_at)::DATE AS week_start,
      COALESCE(SUM(t.final_fare), 0) AS weekly_earnings,
      COUNT(*) AS weekly_trips
    FROM public.trips t
    WHERE t.driver_id = p_driver_id
      AND t.status = 'FINISHED'
      AND t.completed_at BETWEEN p_start_date AND p_end_date
    GROUP BY date_trunc('week', t.completed_at)
  ) weekly;

  RETURN jsonb_build_object(
    'total_earned', v_total_earned,
    'total_trips', v_total_trips,
    'total_distance_km', v_total_distance,
    'total_time_min', v_total_time,
    'average_per_trip', CASE WHEN v_total_trips > 0 THEN v_total_earned / v_total_trips ELSE 0 END,
    'weekly_breakdown', COALESCE(v_weekly, '[]'::jsonb),
    'period_start', p_start_date,
    'period_end', p_end_date
  );
END;
$$;

-- =========================================================================
-- 15. RPC: process_ride_payment(ride_id) — Split de taxa
-- =========================================================================
CREATE OR REPLACE FUNCTION process_ride_payment(p_ride_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_trip RECORD;
  v_passenger_wallet UUID;
  v_driver_wallet UUID;
  v_platform_wallet UUID;
  v_platform_fee_percent DECIMAL;
  v_platform_fee DECIMAL;
  v_driver_earning DECIMAL;
  v_balance_before_passenger DECIMAL;
  v_balance_before_driver DECIMAL;
  v_config JSONB;
BEGIN
  -- Buscar trip
  SELECT * INTO v_trip FROM public.trips WHERE id = p_ride_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Corrida não encontrada');
  END IF;

  IF v_trip.status NOT IN ('FINISHED', 'COMPLETED') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Corrida não está finalizada');
  END IF;

  -- Buscar carteiras
  SELECT id INTO v_passenger_wallet FROM public.wallets WHERE profile_id = v_trip.passenger_id;
  SELECT id INTO v_driver_wallet FROM public.wallets WHERE profile_id = v_trip.driver_id;

  -- Buscar taxa da plataforma
  SELECT value INTO v_config FROM public.app_config WHERE key = 'global.platform_fee_percent';
  v_platform_fee_percent := COALESCE((v_config->>'default')::DECIMAL, 15) / 100;

  v_platform_fee := ROUND(v_trip.final_fare * v_platform_fee_percent, 2);
  v_driver_earning := v_trip.final_fare - v_platform_fee;

  -- Saldo antes do passageiro
  SELECT COALESCE(SUM(
    CASE WHEN type IN ('deposit', 'refund', 'bonus', 'cashback') THEN amount ELSE -amount END
  ), 0) INTO v_balance_before_passenger
  FROM public.wallet_transactions
  WHERE profile_id = v_trip.passenger_id AND status = 'confirmed';

  -- Debitar passageiro
  INSERT INTO public.wallet_transactions (profile_id, wallet_id, type, amount, balance_before, balance_after, status, description, reference_type, reference_id)
  VALUES (
    v_trip.passenger_id, v_passenger_wallet, 'ride_payment',
    v_trip.final_fare, v_balance_before_passenger, v_balance_before_passenger - v_trip.final_fare,
    'confirmed', 'Pagamento da corrida', 'trip', p_ride_id
  );

  -- Saldo antes do motorista
  SELECT COALESCE(SUM(
    CASE WHEN type IN ('deposit', 'refund', 'bonus', 'cashback', 'ride_earning') THEN amount ELSE -amount END
  ), 0) INTO v_balance_before_driver
  FROM public.wallet_transactions
  WHERE profile_id = v_trip.driver_id AND status = 'confirmed';

  -- Creditar motorista (menos taxa)
  INSERT INTO public.wallet_transactions (profile_id, wallet_id, type, amount, balance_before, balance_after, status, description, reference_type, reference_id)
  VALUES (
    v_trip.driver_id, v_driver_wallet, 'ride_earning',
    v_driver_earning, v_balance_before_driver, v_balance_before_driver + v_driver_earning,
    'confirmed', 'Ganhos da corrida (líquido)', 'trip', p_ride_id
  );

  -- Taxa da plataforma (registro contábil)
  INSERT INTO public.wallet_transactions (profile_id, wallet_id, type, amount, balance_before, balance_after, status, description, reference_type, reference_id)
  VALUES (
    v_trip.driver_id, v_driver_wallet, 'platform_fee',
    v_platform_fee, v_balance_before_driver + v_driver_earning, v_balance_before_driver + v_driver_earning,
    'confirmed', 'Taxa da plataforma', 'trip', p_ride_id
  );

  -- Atualizar status da trip
  UPDATE public.trips SET status = 'PAYMENT_CONFIRMED' WHERE id = p_ride_id;

  RETURN jsonb_build_object(
    'success', true,
    'passenger_debit', v_trip.final_fare,
    'driver_credit', v_driver_earning,
    'platform_fee', v_platform_fee,
    'trip_id', p_ride_id
  );
END;
$$;

-- =========================================================================
-- 16. VIEWS — driver_dashboard_view e company_dashboard_view
-- =========================================================================

-- Driver Dashboard View
CREATE OR REPLACE VIEW public.driver_dashboard_view AS
SELECT
  dp.id AS driver_id,
  dp.cpf,
  dp.status AS driver_status,
  dp.rating,
  dp.total_trips,
  dp.acceptance_rate,
  dp.cancellation_rate,
  dp.modalities,
  p.full_name,
  p.email,
  p.phone,
  p.avatar,
  COALESCE(weekly.weekly_earnings, 0) AS weekly_earnings,
  COALESCE(weekly.weekly_trips, 0) AS weekly_trips,
  COALESCE(monthly.monthly_earnings, 0) AS monthly_earnings,
  COALESCE(monthly.monthly_trips, 0) AS monthly_trips,
  COALESCE(wlt.balance, 0) AS wallet_balance,
  COALESCE(online.status, 'OFFLINE') AS online_status
FROM public.driver_profiles dp
JOIN public.profiles p ON p.id = dp.id
LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(t.final_fare), 0) AS weekly_earnings,
    COUNT(*) AS weekly_trips
  FROM public.trips t
  WHERE t.driver_id = dp.id
    AND t.status = 'FINISHED'
    AND t.completed_at >= date_trunc('week', now())
) weekly ON true
LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(t.final_fare), 0) AS monthly_earnings,
    COUNT(*) AS monthly_trips
  FROM public.trips t
  WHERE t.driver_id = dp.id
    AND t.status = 'FINISHED'
    AND t.completed_at >= date_trunc('month', now())
) monthly ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(
    CASE WHEN wt.type IN ('deposit', 'refund', 'bonus', 'cashback', 'ride_earning') THEN wt.amount ELSE -wt.amount END
  ), 0) AS balance
  FROM public.wallet_transactions wt
  WHERE wt.profile_id = dp.id AND wt.status = 'confirmed'
) wlt ON true
LEFT JOIN public.drivers_online online ON online.driver_id = dp.id;

-- Company Dashboard View
CREATE OR REPLACE VIEW public.company_dashboard_view AS
SELECT
  c.id AS company_id,
  c.corporate_name,
  c.trade_name,
  c.cnpj,
  c.status,
  p.full_name AS responsible_name,
  p.email,
  p.phone,
  COALESCE(driver_count.driver_count, 0) AS total_drivers,
  COALESCE(active_drivers.active_count, 0) AS active_drivers,
  COALESCE(monthly_spend.total_spent, 0) AS monthly_spend,
  COALESCE(monthly_spend.trip_count, 0) AS monthly_trips,
  COALESCE(wlt.balance, 0) AS wallet_balance
FROM public.companies c
JOIN public.profiles p ON p.id = c.id
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS driver_count
  FROM public.driver_profiles dp
  WHERE dp.company_id = c.id
) driver_count ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS active_count
  FROM public.driver_profiles dp
  JOIN public.drivers_online d ON d.driver_id = dp.id AND d.status != 'OFFLINE'
  WHERE dp.company_id = c.id
) active_drivers ON true
LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(t.final_fare), 0) AS total_spent,
    COUNT(*) AS trip_count
  FROM public.trips t
  JOIN public.driver_profiles dp ON dp.id = t.driver_id
  WHERE dp.company_id = c.id
    AND t.status = 'FINISHED'
    AND t.completed_at >= date_trunc('month', now())
) monthly_spend ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(
    CASE WHEN wt.type IN ('deposit', 'refund', 'bonus', 'cashback') THEN wt.amount ELSE -wt.amount END
  ), 0) AS balance
  FROM public.wallet_transactions wt
  WHERE wt.profile_id = c.id AND wt.status = 'confirmed'
) wlt ON true;

-- =========================================================================
-- 17. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips (status);
CREATE INDEX IF NOT EXISTS idx_trips_created ON public.trips (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_passenger_status ON public.trips (passenger_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_driver_status ON public.trips (driver_id, status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_profile_status ON public.wallet_transactions (profile_id, status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON public.wallet_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_status ON public.driver_profiles (status);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_rating ON public.driver_profiles (rating DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee ON public.ratings (ratee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON public.ratings (rater_id, created_at DESC);

-- =========================================================================
-- 18. STORAGE BUCKETS ADICIONAIS
-- =========================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc_docs', 'kyc_docs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('company_freights', 'company_freights', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para kyc_docs
DO $$ BEGIN
  CREATE POLICY "Usuário lê próprios documentos KYC"
    ON storage.objects FOR SELECT USING (
      bucket_id = 'kyc_docs' AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Usuário upload próprios documentos KYC"
    ON storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'kyc_docs' AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =========================================================================
-- 19. GARANTIR RLS EM TABELAS EXISTENTES
-- =========================================================================
ALTER TABLE IF EXISTS public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;

-- RLS para rides (se não existir)
DO $$ BEGIN
  CREATE POLICY "Passageiro vê próprias corridas"
    ON public.rides FOR SELECT USING (auth.uid() = passenger_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Motorista vê corridas designadas"
    ON public.rides FOR SELECT USING (auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Passageiro cria corrida"
    ON public.rides FOR INSERT WITH CHECK (auth.uid() = passenger_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- RLS para wallets (usuário só vê própria carteira)
DO $$ BEGIN
  CREATE POLICY "Usuário vê própria carteira"
    ON public.wallets FOR SELECT USING (auth.uid() = profile_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Sistema cria carteira"
    ON public.wallets FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =========================================================================
-- 20. FUNÇÃO PIX PAYMENT (simplificada para webhook)
-- =========================================================================
CREATE OR REPLACE FUNCTION create_pix_payment(
  p_profile_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Depósito via PIX'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_tx_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_wallet_id UUID;
BEGIN
  IF p_amount < 500 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor mínimo de R$ 5,00');
  END IF;

  SELECT id INTO v_wallet_id FROM public.wallets WHERE profile_id = p_profile_id;
  v_expires_at := now() + INTERVAL '30 minutes';

  INSERT INTO public.wallet_transactions (
    profile_id, wallet_id, type, amount, balance_before, balance_after,
    status, expires_at, description
  ) VALUES (
    p_profile_id, v_wallet_id, 'deposit', p_amount / 100.0,
    0, 0, 'pending', v_expires_at, p_description
  )
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'expires_at', v_expires_at,
    'amount_cents', p_amount,
    'pix_code', format('PIX-TXDAPP-%s', v_tx_id),
    'qr_code_text', format('pix.txdapp.com/qr/%s', v_tx_id)
  );
END;
$$;

-- =========================================================================
-- 21. CORREÇÃO: Expandir tipos de transação da wallet
-- =========================================================================
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type IN (
    'deposit', 'withdrawal', 'payment', 'refund', 'bonus', 'cashback',
    'ride_payment', 'ride_earning', 'freight_payment', 'freight_earning',
    'platform_fee', 'commission', 'transfer', 'escrow_block', 'escrow_release',
    'withdrawal_pending', 'withdrawal_failed', 'withdrawal_confirmed',
    'monthly_fee', 'advancement', 'fine', 'tip', 'boleto', 'credit_usage', 'invoice_payment'
  ));

-- Adicionar colunas que faltam na wallet_transactions (compatibilidade)
DO $$ BEGIN
  ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed'
    CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled', 'reversed', 'blocked', 'released', 'disputed'));
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Garantir que wallet_transactions tenha profile_id preenchido para transações existentes
UPDATE public.wallet_transactions wt
SET profile_id = w.profile_id
FROM public.wallets w
WHERE wt.wallet_id = w.id AND wt.profile_id IS NULL;

COMMIT;
