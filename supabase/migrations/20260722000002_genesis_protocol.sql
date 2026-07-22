-- TXAP Genesis Protocol
-- Módulos: City Launch, Respiratory Pricing, Primeiro Dólar

-- =========================================================================
-- 1. CITY LAUNCHES (TXAP Seed)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.city_launches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    city_name TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    status TEXT DEFAULT 'seeding' CHECK (status IN ('seeding', 'flash', 'live', 'completed')),
    target_motoristas INTEGER DEFAULT 20,
    target_comercios INTEGER DEFAULT 10,
    motoristas_registered INTEGER DEFAULT 0,
    comercios_registered INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    seed_end_date TIMESTAMP WITH TIME ZONE,
    flash_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Missions para motoristas no período de seed
CREATE TABLE IF NOT EXISTS public.seed_missions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city_launch_id UUID REFERENCES public.city_launches(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    mission_type TEXT NOT NULL CHECK (mission_type IN ('onboarding', 'first_ride_simulated', 'first_ride_real', 'referral')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 2. RESPIRATORY PRICING
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.respiratory_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
    available_drivers INTEGER NOT NULL DEFAULT 0,
    active_requests INTEGER NOT NULL DEFAULT 0,
    breath_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    dynamic_incentive DECIMAL(10,2) DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar coluna de respiratory incentive nas trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS respiratory_incentive DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS user_accepted_surcharge BOOLEAN DEFAULT FALSE;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS city_launch_id UUID REFERENCES public.city_launches(id) ON DELETE SET NULL;

-- Adicionar status 'simulated' para corridas simuladas de seed
ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'SIMULATED';

-- =========================================================================
-- 3. PRIMEIRO DÓLAR (Driver Guarantees)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.driver_guarantees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    city_launch_id UUID REFERENCES public.city_launches(id) ON DELETE CASCADE NOT NULL,
    guaranteed_amount DECIMAL(10,2) NOT NULL DEFAULT 500,
    earned_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    txap_subsidy DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    unlock_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (driver_id, city_launch_id)
);

-- Adicionar genesis_bonus, genesis_payment, respiratory_incentive aos tipos de transação
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type IN (
    'deposit', 'withdrawal', 'payment', 'refund', 'bonus', 'cashback',
    'ride_payment', 'ride_earning', 'freight_payment', 'freight_earning',
    'platform_fee', 'commission', 'transfer', 'escrow_block', 'escrow_release',
    'withdrawal_pending', 'withdrawal_failed', 'withdrawal_confirmed',
    'monthly_fee', 'advancement', 'fine', 'tip', 'boleto', 'credit_usage',
    'invoice_payment', 'genesis_bonus', 'genesis_payment', 'respiratory_incentive'
  ));

-- RLS
ALTER TABLE public.city_launches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respiratory_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_guarantees ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Leitura pública de lançamentos" ON public.city_launches FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Admin gerencia lançamentos" ON public.city_launches FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Motorista vê próprias missões" ON public.seed_missions FOR SELECT USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Sistema insere missões" ON public.seed_missions FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Sistema atualiza missões" ON public.seed_missions FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Leitura pública de snapshots" ON public.respiratory_snapshots FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Motorista vê própria garantia" ON public.driver_guarantees FOR SELECT USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Sistema gerencia garantias" ON public.driver_guarantees FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_city_launches_status ON public.city_launches (status);
CREATE INDEX IF NOT EXISTS idx_seed_missions_driver ON public.seed_missions (driver_id, city_launch_id);
CREATE INDEX IF NOT EXISTS idx_seed_missions_status ON public.seed_missions (status);
CREATE INDEX IF NOT EXISTS idx_respiratory_snapshots_city ON public.respiratory_snapshots (city_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_guarantees_driver ON public.driver_guarantees (driver_id, status);

-- Triggers
DROP TRIGGER IF EXISTS update_city_launches_updated_at ON public.city_launches;
CREATE TRIGGER update_city_launches_updated_at BEFORE UPDATE ON public.city_launches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_guarantees_updated_at ON public.driver_guarantees;
CREATE TRIGGER update_driver_guarantees_updated_at BEFORE UPDATE ON public.driver_guarantees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- 4. RPC: Calcular Respiratory Rate
-- =========================================================================
CREATE OR REPLACE FUNCTION calculate_respiratory_rate(p_city_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_available INTEGER;
    v_active_requests INTEGER;
    v_breath_rate DECIMAL(5,2);
    v_incentive DECIMAL(10,2);
BEGIN
    SELECT COUNT(*) INTO v_available
    FROM public.driver_heartbeats dh
    JOIN public.driver_profiles dp ON dp.id = dh.driver_id
    WHERE dh.status IN ('AVAILABLE', 'ONLINE')
      AND dp.city = (SELECT name FROM public.cities WHERE id = p_city_id);

    SELECT COUNT(*) INTO v_active_requests
    FROM public.trips
    WHERE status IN ('SEARCHING_DRIVER', 'REQUEST_CREATED')
      AND vehicle_category_id IN (
        SELECT id FROM public.vehicle_categories
      );

    IF v_available = 0 AND v_active_requests > 0 THEN
        v_breath_rate := 100;
    ELSIF v_available > 0 THEN
        v_breath_rate := LEAST((v_active_requests::DECIMAL / v_available) * 50, 100);
    ELSE
        v_breath_rate := 0;
    END IF;

    IF v_breath_rate >= 70 THEN
        v_incentive := CEIL(v_breath_rate / 10) * 1.50;
    ELSIF v_breath_rate >= 40 THEN
        v_incentive := 1.00;
    ELSE
        v_incentive := 0;
    END IF;

    INSERT INTO public.respiratory_snapshots (city_id, available_drivers, active_requests, breath_rate, dynamic_incentive)
    VALUES (p_city_id, v_available, v_active_requests, v_breath_rate, v_incentive);

    RETURN jsonb_build_object(
        'available_drivers', v_available,
        'active_requests', v_active_requests,
        'breath_rate', v_breath_rate,
        'dynamic_incentive', v_incentive
    );
END;
$$;

-- =========================================================================
-- 5. RPC: Processar Genesis Bonus (Primeiro Dólar)
-- =========================================================================
CREATE OR REPLACE FUNCTION process_genesis_bonus(p_driver_id UUID, p_city_launch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_guarantee RECORD;
    v_subsidy DECIMAL(10,2);
    v_wallet_id UUID;
    v_current_balance DECIMAL(10,2);
BEGIN
    SELECT * INTO v_guarantee
    FROM public.driver_guarantees
    WHERE driver_id = p_driver_id
      AND city_launch_id = p_city_launch_id
      AND status = 'active';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Garantia não encontrada ou já processada');
    END IF;

    IF v_guarantee.earned_amount >= v_guarantee.guaranteed_amount THEN
        UPDATE public.driver_guarantees
        SET status = 'completed', txap_subsidy = 0
        WHERE id = v_guarantee.id;
        RETURN jsonb_build_object('success', true, 'message', 'Motorista já atingiu a meta');
    END IF;

    v_subsidy := v_guarantee.guaranteed_amount - v_guarantee.earned_amount;

    SELECT id, balance INTO v_wallet_id, v_current_balance
    FROM public.wallets
    WHERE profile_id = p_driver_id;

    INSERT INTO public.wallet_transactions (profile_id, wallet_id, type, amount, balance_before, balance_after, status, description, reference_type, reference_id, expires_at)
    VALUES (
        p_driver_id, v_wallet_id, 'genesis_bonus',
        v_subsidy, v_current_balance, v_current_balance + v_subsidy,
        'confirmed',
        'Bônus Garantido Primeiro Dólar TXAP',
        'city_launch', p_city_launch_id,
        timezone('utc'::text, now()) + interval '30 days'
    );

    UPDATE public.driver_guarantees
    SET txap_subsidy = v_subsidy, status = 'completed', unlock_date = timezone('utc'::text, now()) + interval '30 days'
    WHERE id = v_guarantee.id;

    RETURN jsonb_build_object('success', true, 'subsidy', v_subsidy, 'unlock_date', timezone('utc'::text, now()) + interval '30 days');
END;
$$;

-- =========================================================================
-- 6. Trigger: Atualizar earned_amount nas garantias após transação
-- =========================================================================
CREATE OR REPLACE FUNCTION update_driver_guarantee_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.type IN ('ride_earning', 'bonus', 'tip') AND NEW.status = 'confirmed' THEN
        UPDATE public.driver_guarantees
        SET earned_amount = earned_amount + NEW.amount
        WHERE driver_id = NEW.profile_id
          AND status = 'active'
          AND expires_at > NEW.created_at;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_driver_guarantee ON public.wallet_transactions;
CREATE TRIGGER trg_update_driver_guarantee
    AFTER INSERT ON public.wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_driver_guarantee_earnings();
