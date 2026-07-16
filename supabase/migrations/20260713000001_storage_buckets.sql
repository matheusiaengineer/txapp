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
