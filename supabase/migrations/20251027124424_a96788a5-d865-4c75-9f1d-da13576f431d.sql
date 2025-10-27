-- Adicionar colunas para URLs das imagens na tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS front_image_url text,
ADD COLUMN IF NOT EXISTS back_image_url text,
ADD COLUMN IF NOT EXISTS approved_image_url text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS order_details jsonb;

-- Criar bucket de storage para imagens de pedidos
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-images', 'order-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para permitir upload de imagens de pedidos
CREATE POLICY "Qualquer um pode fazer upload de imagens de pedidos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-images');

CREATE POLICY "Imagens de pedidos são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-images');

CREATE POLICY "Admins podem atualizar imagens de pedidos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'order-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)));

CREATE POLICY "Admins podem deletar imagens de pedidos"
ON storage.objects FOR DELETE
USING (bucket_id = 'order-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)));