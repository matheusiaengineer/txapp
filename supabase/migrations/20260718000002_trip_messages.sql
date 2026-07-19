-- =========================================================================
-- TXD TRIP CHAT (Passageiro ↔ Motorista)
-- =========================================================================

CREATE TABLE public.trip_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'passenger',
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_messages;

ALTER TABLE public.trip_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip participants can read messages"
    ON public.trip_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = trip_id
            AND (t.passenger_id = auth.uid() OR t.driver_id = auth.uid())
        )
    );

CREATE POLICY "Trip participants can insert messages"
    ON public.trip_messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = trip_id
            AND (t.passenger_id = auth.uid() OR t.driver_id = auth.uid())
        )
    );

CREATE INDEX idx_trip_messages_trip_created
    ON public.trip_messages (trip_id, created_at ASC);
