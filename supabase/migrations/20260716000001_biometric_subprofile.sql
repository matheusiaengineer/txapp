-- Migration: Novos campos para sub_perfil, modalidades e biometria

-- Adicionar sub_profile à tabela profiles
-- 'employee' para funcionário de empresa
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'employee';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sub_profile TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS push_subscription JSONB DEFAULT NULL;

-- Adicionar modalidades ao driver_profiles
ALTER TABLE public.driver_profiles
ADD COLUMN IF NOT EXISTS modalities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Criar enum para document_type se não existir
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'cnh_selfie';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'crlv';

-- Criar tabela de credenciais biométricas
CREATE TABLE IF NOT EXISTS public.biometric_credentials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
    device_type TEXT DEFAULT 'platform',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de funcionários (employee_profiles)
CREATE TABLE IF NOT EXISTS public.employee_profiles (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator', -- 'admin', 'operator', 'financeiro'
    department TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    invite_token TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de campanhas de remarketing
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    segment TEXT NOT NULL, -- 'inactive_30d', 'vip', 'new', 'birthday'
    channel TEXT NOT NULL, -- 'sms', 'whatsapp', 'email'
    template TEXT NOT NULL,
    coupon_code TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de clientes CRM para empresas
CREATE TABLE IF NOT EXISTS public.company_clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_order_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_clients ENABLE ROW LEVEL SECURITY;

-- Políticas biometric_credentials
CREATE POLICY "Usuários veem próprias credenciais"
    ON public.biometric_credentials FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem próprias credenciais"
    ON public.biometric_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprias credenciais"
    ON public.biometric_credentials FOR DELETE USING (auth.uid() = user_id);

-- Políticas employee_profiles
CREATE POLICY "Funcionários veem próprio perfil"
    ON public.employee_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Empresa gerencia funcionários"
    ON public.employee_profiles FOR ALL USING (
        EXISTS (SELECT 1 FROM public.companies WHERE id = employee_profiles.company_id AND id = auth.uid())
    );

-- Políticas campaigns
CREATE POLICY "Empresa gerencia campanhas"
    ON public.campaigns FOR ALL USING (auth.uid() = company_id);

-- Políticas company_clients
CREATE POLICY "Empresa vê próprios clientes"
    ON public.company_clients FOR SELECT USING (auth.uid() = company_id);

CREATE POLICY "Empresa insere clientes"
    ON public.company_clients FOR INSERT WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Empresa atualiza clientes"
    ON public.company_clients FOR UPDATE USING (auth.uid() = company_id);

-- Triggers
CREATE TRIGGER update_employee_profiles_updated_at
    BEFORE UPDATE ON public.employee_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_clients_updated_at
    BEFORE UPDATE ON public.company_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
