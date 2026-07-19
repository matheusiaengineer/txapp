-- =========================================================================
-- TXD NOTIFICATION SYSTEM
-- =========================================================================

CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false NOT NULL,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem próprias notificações"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprias notificações"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere próprias notificações"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprias notificações"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_created
    ON public.notifications (user_id, created_at DESC);
