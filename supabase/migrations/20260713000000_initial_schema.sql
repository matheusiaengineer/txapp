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
