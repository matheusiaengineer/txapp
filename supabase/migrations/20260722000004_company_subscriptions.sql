-- TXAP Company Subscriptions & Plans
CREATE TABLE IF NOT EXISTS public.company_subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    price_weekly DECIMAL(10,2) NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    max_products INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    priority_score INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.company_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.company_subscription_plans(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    auto_renew BOOLEAN DEFAULT TRUE,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_subscription_id TEXT,
    stripe_payment_method_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (company_id)
);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS has_own_delivery BOOLEAN DEFAULT FALSE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS needs_delivery_partner BOOLEAN DEFAULT FALSE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS delivery_zone_radius_km DECIMAL(10,2) DEFAULT 5;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS service_categories TEXT[] DEFAULT '{}';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.company_delivery_partners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
    commission_percent DECIMAL(5,2) DEFAULT 15.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (company_id, driver_id)
);

CREATE TABLE IF NOT EXISTS public.company_invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.company_subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    stripe_invoice_id TEXT,
    payment_intent_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.company_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invoices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Leitura publica de planos" ON public.company_subscription_plans FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Empresa ve propria assinatura" ON public.company_subscriptions FOR SELECT USING (auth.uid() = company_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Empresa gerencia assinatura" ON public.company_subscriptions FOR ALL USING (auth.uid() = company_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Empresa ve parceiros" ON public.company_delivery_partners FOR SELECT USING (auth.uid() = company_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Motorista ve parcerias" ON public.company_delivery_partners FOR SELECT USING (auth.uid() = driver_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Empresa ve faturas" ON public.company_invoices FOR SELECT USING (auth.uid() = company_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company ON public.company_subscriptions (company_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status ON public.company_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_company_invoices_company ON public.company_invoices (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_invoices_status ON public.company_invoices (status);
CREATE INDEX IF NOT EXISTS idx_companies_featured ON public.companies (is_featured, priority_score DESC) WHERE is_featured = TRUE;

INSERT INTO public.company_subscription_plans (name, price_weekly, description, features, max_products, is_featured, priority_score) VALUES
('Gratis', 0, 'Listagem basica no diretorio', '["Aparece na busca", "1 foto"]', 3, FALSE, 0),
('Destaque', 300, 'Aparece primeiro para todos os usuarios', '["Aparece no topo da busca", "Badge Destaque", "Ate 20 produtos", "Relatorio semanal", "Suporte prioritario"]', 20, TRUE, 50),
('Premium', 500, 'Tudo do Destaque + entrega TXAP integrada', '["Tudo do Destaque", "Entrega integrada com motoboys TXAP", "Sem taxa por entrega", "Gestao de pedidos", "Ate 50 produtos", "Relatorio completo"]', 50, TRUE, 100)
ON CONFLICT DO NOTHING;

DROP TRIGGER IF EXISTS update_company_subscriptions_updated_at ON public.company_subscriptions;
CREATE TRIGGER update_company_subscriptions_updated_at BEFORE UPDATE ON public.company_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
