--- Migration: 20260713000000_initial_schema.sql ---
-- Ativação da extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos Enum
CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'company', 'transporter', 'admin');
CREATE TYPE driver_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE address_type AS ENUM ('home', 'work', 'other');
CREATE TYPE document_type AS ENUM ('cnh', 'selfie', 'vehicle_doc', 'vehicle_photo');

-- Tabela de Perfis Base (Para todos os usuários)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'passenger',
    country TEXT DEFAULT 'BR',
    language TEXT DEFAULT 'pt-BR',
    accepted_terms BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Motoristas / Motoboys / Transportadores
CREATE TABLE public.driver_profiles (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    cpf TEXT UNIQUE NOT NULL,
    birth_date DATE,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'BR',
    status driver_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Veículos
CREATE TABLE public.vehicles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- moto, carro, suv, van, caminhonete, caminhao, carreta
    license_plate TEXT UNIQUE NOT NULL,
    brand TEXT,
    model TEXT,
    color TEXT,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Empresas
CREATE TABLE public.companies (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    corporate_name TEXT NOT NULL,
    trade_name TEXT,
    cnpj TEXT UNIQUE NOT NULL,
    responsible_name TEXT NOT NULL,
    address TEXT,
    status driver_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Endereços Salvos (Passageiros, etc)
CREATE TABLE public.addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type address_type DEFAULT 'other',
    full_address TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Documentos
CREATE TABLE public.documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    url TEXT NOT NULL,
    status driver_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Avaliações
CREATE TABLE public.ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rater_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ratee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ride_id UUID, -- Referência futura para tabela de corridas
    score INTEGER CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- CONFIGURAÇÕES DE SEGURANÇA (Row Level Security - RLS)
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Usuários podem ver seus próprios perfis" 
    ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para Driver Profiles
CREATE POLICY "Motoristas podem ver seus dados" 
    ON public.driver_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Motoristas podem atualizar seus dados" 
    ON public.driver_profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para Vehicles
CREATE POLICY "Motoristas podem gerenciar seus veículos" 
    ON public.vehicles FOR ALL USING (auth.uid() = driver_id);

-- Políticas para Companies
CREATE POLICY "Empresas podem gerenciar seus perfis" 
    ON public.companies FOR ALL USING (auth.uid() = id);

-- Políticas para Addresses
CREATE POLICY "Usuários podem gerenciar seus endereços" 
    ON public.addresses FOR ALL USING (auth.uid() = profile_id);

-- Políticas para Documents
CREATE POLICY "Usuários podem ver seus documentos" 
    ON public.documents FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Usuários podem enviar documentos" 
    ON public.documents FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Funções utilitárias (Trigger para updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


--- Migration: 20260713000001_storage_buckets.sql ---
-- Criação de Buckets de Storage

-- Avatar dos usuários
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Documentos de motoristas (CNH, Selfie)
INSERT INTO storage.buckets (id, name, public) VALUES ('drivers', 'drivers', false)
ON CONFLICT (id) DO NOTHING;

-- Documentos em geral
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Documentos de empresas (CNPJ, Alvará)
INSERT INTO storage.buckets (id, name, public) VALUES ('companies', 'companies', false)
ON CONFLICT (id) DO NOTHING;

-- Fotos e documentos de veículos
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicles', 'vehicles', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Segurança (Storage RLS)

-- Avatars: Qualquer um pode ver, apenas dono pode inserir/atualizar
CREATE POLICY "Avatar público" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Upload de avatar próprio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Restante (Privado): Apenas o próprio usuário (dono) ou um Admin pode ver/inserir
-- Assumimos que o caminho do arquivo siga o padrão: profile_id/nome_do_arquivo.ext
CREATE POLICY "Ler próprios documentos de motorista" ON storage.objects FOR SELECT USING (bucket_id = 'drivers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Upload de próprios documentos de motorista" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'drivers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Ler próprios documentos" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Upload de próprios documentos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Ler próprios documentos da empresa" ON storage.objects FOR SELECT USING (bucket_id = 'companies' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Upload de próprios documentos da empresa" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'companies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Ler fotos do próprio veículo" ON storage.objects FOR SELECT USING (bucket_id = 'vehicles' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Upload de fotos do veículo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicles' AND auth.uid()::text = (storage.foldername(name))[1]);


--- Migration: 20260713000002_mobility_engine.sql ---
-- =========================================================================
-- TXD MOBILITY ENGINE - Estrutura Base
-- =========================================================================

-- Tipos Enum para Eventos Viários (Road Intelligence)
CREATE TYPE road_event_type AS ENUM (
    'accident', 'traffic_jam', 'road_work', 'police', 
    'speed_camera', 'gas_station', 'ev_station', 'toll', 'weather_hazard'
);

CREATE TYPE distance_unit AS ENUM ('km', 'mi');
CREATE TYPE currency_code AS ENUM ('BRL', 'USD', 'EUR');

-- Cidades de Operação (Internacionalização base)
CREATE TABLE public.cities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    currency currency_code DEFAULT 'BRL',
    unit distance_unit DEFAULT 'km',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Motor de Precificação Dinâmico
-- (Não haverá preço "chumbado" no código, tudo vem desta tabela)
CREATE TABLE public.pricing_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    vehicle_category TEXT NOT NULL, -- Ex: 'carro', 'moto', 'caminhao'
    base_fare DECIMAL(10,2) NOT NULL, -- Tarifa base (R$ / $)
    price_per_unit DECIMAL(10,2) NOT NULL, -- Valor por Km / Milha
    price_per_minute DECIMAL(10,2) NOT NULL, -- Valor por minuto
    min_fare DECIMAL(10,2) NOT NULL, -- Tarifa mínima
    platform_fee_percent DECIMAL(5,2) DEFAULT 15.00, -- 15% para a plataforma
    surge_multiplier DECIMAL(5,2) DEFAULT 1.00, -- Tarifa Dinâmica
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Road Intelligence (Eventos reportados ou integrados)
CREATE TABLE public.road_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id),
    type road_event_type NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    reported_by UUID REFERENCES public.profiles(id), -- Quem reportou (opcional)
    expires_at TIMESTAMP WITH TIME ZONE, -- Quando o evento deve sumir
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Segurança RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_events ENABLE ROW LEVEL SECURITY;

-- Cidades e Preços podem ser LIDOS por qualquer usuário autenticado (para cotar viagem)
CREATE POLICY "Leitura pública de cidades" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Leitura pública de preços" ON public.pricing_rules FOR SELECT USING (true);
CREATE POLICY "Leitura pública de eventos viários" ON public.road_events FOR SELECT USING (true);

-- APENAS ADMINS podem inserir/modificar cidades e preços (Políticas futuras de Admin)
-- Eventos podem ser reportados por motoristas verificados (KYC)
CREATE POLICY "Motoristas verificados podem reportar eventos" ON public.road_events 
    FOR INSERT WITH CHECK (
        auth.uid() = reported_by 
        AND EXISTS (
            SELECT 1 FROM public.driver_profiles 
            WHERE id = auth.uid() AND status = 'approved'
        )
    );


--- Migration: 20260713000003_vehicle_categories.sql ---
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


--- Migration: 20260713000004_live_tracking.sql ---
-- =========================================================================
-- TXD LIVE MOBILITY ENGINE (REALTIME, TRACKING & STATES)
-- =========================================================================

-- Estados Universais do Motorista/Transportador
CREATE TYPE driver_live_status AS ENUM (
    'OFFLINE', 
    'ONLINE', 
    'AVAILABLE', 
    'RESERVED', 
    'GOING_TO_PICKUP', 
    'WAITING_PASSENGER', 
    'IN_TRIP', 
    'IN_DELIVERY', 
    'IN_FREIGHT', 
    'PAUSED', 
    'EMERGENCY'
);

-- Adicionando a coluna de status atual na tabela driver_profiles
ALTER TABLE public.driver_profiles
ADD COLUMN current_live_status driver_live_status DEFAULT 'OFFLINE';

-- Tabela de Heartbeat (Estado instantâneo - Sobrescrito ou mantido limpo via pg_cron/limpeza)
-- Nota: Para alta escala, o ideal é usar o Supabase Realtime Presence em memória. 
-- Esta tabela serve como backup de estado persistido.
CREATE TABLE public.driver_heartbeats (
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    heading DECIMAL(5,2), -- Direção 0 a 360
    speed DECIMAL(5,2), -- Velocidade em km/h
    accuracy DECIMAL(10,2), -- Precisão do GPS em metros
    battery_level INTEGER, -- 0 a 100
    status driver_live_status NOT NULL,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Histórico Completo de Trajetos (Tracking History)
-- Muito pesado. Em produção, usa-se particionamento por data.
CREATE TABLE public.tracking_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
    ride_id UUID, -- Referência futura para a tabela de corridas
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    heading DECIMAL(5,2),
    speed DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitando Realtime nas tabelas cruciais
-- Permite que clientes se inscrevam em mudanças no driver_heartbeats
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_heartbeats;

-- Segurança RLS
ALTER TABLE public.driver_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_history ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Motoristas atualizam próprio heartbeat" 
    ON public.driver_heartbeats FOR ALL USING (auth.uid() = driver_id);

CREATE POLICY "Leitura pública (restrita via app) de heartbeats ativos" 
    ON public.driver_heartbeats FOR SELECT USING (status != 'OFFLINE');

CREATE POLICY "Motoristas gravam próprio histórico" 
    ON public.tracking_history FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- trigger update
CREATE TRIGGER update_driver_heartbeats_updated_at
    BEFORE UPDATE ON public.driver_heartbeats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


--- Migration: 20260713000005_smart_dispatcher.sql ---
-- =========================================================================
-- TXD SMART DISPATCHER 2.0 & TRIPS ENGINE
-- =========================================================================

-- 1. Estados Universais da Viagem (Corrida/Entrega/Frete)
CREATE TYPE trip_status AS ENUM (
    'REQUEST_CREATED',
    'SEARCHING_DRIVER',
    'DRIVER_NOTIFIED',
    'DRIVER_ACCEPTED',
    'GOING_TO_PICKUP',
    'ARRIVED',
    'PASSENGER_ON_BOARD',
    'IN_PROGRESS',
    'FINISHING',
    'COMPLETED',
    'PAYMENT_PENDING',
    'PAYMENT_CONFIRMED',
    'FINISHED',
    'CANCELLED',
    'NO_DRIVER_FOUND',
    'TIMEOUT',
    'EXPIRED',
    'REJECTED'
);

-- 2. Métricas do Motorista para o Algoritmo de Score
ALTER TABLE public.driver_profiles
ADD COLUMN acceptance_rate DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN rating DECIMAL(3,2) DEFAULT 5.00,
ADD COLUMN total_trips INTEGER DEFAULT 0,
ADD COLUMN online_time_hours DECIMAL(10,2) DEFAULT 0;

-- 3. Tabela Central de Viagens (Trips)
-- Suporta Passageiros, Entregas e Fretes de forma agnóstica
CREATE TABLE public.trips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    passenger_id UUID REFERENCES public.profiles(id) NOT NULL,
    driver_id UUID REFERENCES public.driver_profiles(id), -- Null até dar o match
    vehicle_category_id UUID REFERENCES public.vehicle_categories(id) NOT NULL,
    
    -- Localização
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lng DOUBLE PRECISION NOT NULL,
    origin_address TEXT NOT NULL,
    dest_lat DOUBLE PRECISION NOT NULL,
    dest_lng DOUBLE PRECISION NOT NULL,
    dest_address TEXT NOT NULL,
    
    -- Status
    status trip_status DEFAULT 'REQUEST_CREATED' NOT NULL,
    
    -- Precificação e Distância
    estimated_distance_km DECIMAL(10,2) NOT NULL,
    estimated_duration_min INTEGER NOT NULL,
    estimated_fare DECIMAL(10,2) NOT NULL,
    final_fare DECIMAL(10,2),
    
    -- Metadados Dinâmicos (Para empresas, urgência, peso, etc)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Tempos (Observabilidade)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- 4. Tabela de Ofertas (Disparos do Dispatcher)
-- Para sabermos quem rejeitou, quem deixou expirar (Timeout 15s)
CREATE TABLE public.trip_offers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.driver_profiles(id) NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, EXPIRED
    score_calculated DECIMAL(10,2), -- O score gerado pelo algoritmo naquele instante
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Segurança RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_offers ENABLE ROW LEVEL SECURITY;

-- Políticas de Viagens (Trips)
CREATE POLICY "Passageiro vê próprias viagens" ON public.trips FOR SELECT USING (auth.uid() = passenger_id);
CREATE POLICY "Passageiro cria viagens" ON public.trips FOR INSERT WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "Motorista vê viagens vinculadas a ele" ON public.trips FOR SELECT USING (auth.uid() = driver_id);

-- Políticas de Ofertas (Offers)
CREATE POLICY "Motorista vê próprias ofertas" ON public.trip_offers FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Motorista atualiza própria oferta (Aceitar/Recusar)" ON public.trip_offers FOR UPDATE USING (auth.uid() = driver_id);

--- Migration: 20260716000001_biometric_subprofile.sql ---
-- =========================================================================

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

