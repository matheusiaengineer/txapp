-- =========================================================================
-- TXD FREIGHT MARKETPLACE - Cargas e Lances
-- =========================================================================

CREATE TYPE freight_load_status AS ENUM (
  'open', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE freight_bid_status AS ENUM (
  'pending', 'accepted', 'rejected', 'withdrawn'
);

CREATE TABLE public.freight_loads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  origin_address TEXT NOT NULL,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  dest_address TEXT NOT NULL,
  dest_lat DOUBLE PRECISION,
  dest_lng DOUBLE PRECISION,
  
  description TEXT NOT NULL,
  weight_kg DECIMAL(10,2),
  volume_m3 DECIMAL(10,2),
  vehicle_type TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  
  pickup_date TIMESTAMP WITH TIME ZONE,
  delivery_date TIMESTAMP WITH TIME ZONE,
  
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  
  status freight_load_status DEFAULT 'open' NOT NULL,
  accepted_bid_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.freight_bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  load_id UUID REFERENCES public.freight_loads(id) ON DELETE CASCADE NOT NULL,
  transporter_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
  
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  estimated_days INTEGER,
  
  status freight_bid_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.freight_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_bids ENABLE ROW LEVEL SECURITY;

-- Loads: customer sees own, transporters see open ones
CREATE POLICY "Cliente vê próprias cargas"
  ON public.freight_loads FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Transportadores veem cargas abertas"
  ON public.freight_loads FOR SELECT
  USING (status = 'open');

CREATE POLICY "Cliente cria carga"
  ON public.freight_loads FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Cliente atualiza própria carga"
  ON public.freight_loads FOR UPDATE
  USING (auth.uid() = customer_id);

-- Bids: transporters see own, customer sees bids on own loads
CREATE POLICY "Transportador vê próprios lances"
  ON public.freight_bids FOR SELECT
  USING (auth.uid() = transporter_id);

CREATE POLICY "Cliente vê lances das próprias cargas"
  ON public.freight_bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.freight_loads
      WHERE id = load_id AND customer_id = auth.uid()
    )
  );

CREATE POLICY "Transportador cria lance"
  ON public.freight_bids FOR INSERT
  WITH CHECK (auth.uid() = transporter_id);

CREATE POLICY "Transportador atualiza próprio lance"
  ON public.freight_bids FOR UPDATE
  USING (auth.uid() = transporter_id);

CREATE POLICY "Cliente aceita/rejeita lance da própria carga"
  ON public.freight_bids FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.freight_loads
      WHERE id = load_id AND customer_id = auth.uid()
    )
  );

CREATE TRIGGER update_freight_loads_updated_at
  BEFORE UPDATE ON public.freight_loads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_freight_bids_updated_at
  BEFORE UPDATE ON public.freight_bids
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
