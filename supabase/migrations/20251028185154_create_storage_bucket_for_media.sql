/*
  # Configurar Storage para Mídias
  
  1. Storage Bucket
    - Criar bucket 'midias' para armazenar imagens e vídeos
    - Bucket público para fácil acesso
  
  2. Políticas de Acesso
    - Usuários autenticados podem fazer upload
    - Todos podem visualizar mídias públicas
    - Admins podem deletar mídias
  
  3. Configurações
    - Limite de tamanho: 50MB por arquivo
    - Tipos permitidos: imagens (jpg, png, gif, webp) e vídeos (mp4, webm)
*/

-- Criar bucket de mídias (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'midias',
  'midias',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Política: Todos podem visualizar mídias públicas
CREATE POLICY "Mídias públicas são visíveis para todos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'midias');

-- Política: Usuários autenticados podem fazer upload
CREATE POLICY "Usuários autenticados podem fazer upload de mídias"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'midias' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: Usuários podem atualizar suas próprias mídias
CREATE POLICY "Usuários podem atualizar suas mídias"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'midias'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: Admins e donos podem deletar mídias
CREATE POLICY "Admins e donos podem deletar mídias"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'midias'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('superadmin', 'admin')
      )
    )
  );
