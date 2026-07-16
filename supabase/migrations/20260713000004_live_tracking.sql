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
