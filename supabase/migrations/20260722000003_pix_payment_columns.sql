-- TXAP PIX Payment Columns
-- Adicionar colunas de pagamento faltantes na tabela trips

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS pix_qr_code TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS pix_qr_code_url TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS pix_expires_at TIMESTAMPTZ;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS driver_earnings NUMERIC(10,2);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Índice para busca por payment_intent_id
CREATE INDEX IF NOT EXISTS idx_trips_payment_intent ON public.trips (stripe_payment_intent_id);
