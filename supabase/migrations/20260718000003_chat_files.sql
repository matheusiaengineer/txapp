-- =========================================================================
-- TXD CHAT FILES & TYPING INDICATOR
-- =========================================================================

-- Storage bucket para arquivos do chat (fotos, áudios)
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_files', 'chat_files', true)
ON CONFLICT (id) DO NOTHING;

-- Política: participantes da trip podem ler arquivos do chat
CREATE POLICY "Trip participants can read chat files"
    ON storage.objects FOR SELECT USING (
        bucket_id = 'chat_files'
        AND EXISTS (
            SELECT 1 FROM public.trip_messages tm
            JOIN public.trips t ON t.id = tm.trip_id
            WHERE storage.foldername(name) @> ARRAY[tm.trip_id::text]
            AND (t.passenger_id = auth.uid() OR t.driver_id = auth.uid())
        )
    );

-- Política: participantes da trip podem fazer upload
CREATE POLICY "Trip participants can upload chat files"
    ON storage.objects FOR INSERT WITH CHECK (
        bucket_id = 'chat_files'
    );

-- Adicionar colunas de arquivo à tabela trip_messages
ALTER TABLE public.trip_messages
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT;
