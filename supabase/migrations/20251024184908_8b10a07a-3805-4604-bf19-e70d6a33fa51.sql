-- Criar enum para status dos pedidos
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');

-- Criar enum para tamanhos de camisas
CREATE TYPE shirt_size AS ENUM ('P', 'M', 'G', 'GG', 'XG');

-- Criar tabela de pedidos
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shirt_size shirt_size NOT NULL,
  shirt_color TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status order_status NOT NULL DEFAULT 'pending',
  image_url TEXT,
  notes TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Política: qualquer pessoa pode criar pedidos (público)
CREATE POLICY "Anyone can create orders"
  ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política: qualquer pessoa pode ver seus próprios pedidos pelo email
CREATE POLICY "Anyone can view orders by email"
  ON public.orders
  FOR SELECT
  TO anon
  USING (true);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar bucket de storage para imagens das estampas
INSERT INTO storage.buckets (id, name, public)
VALUES ('shirt-designs', 'shirt-designs', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage: qualquer pessoa pode fazer upload
CREATE POLICY "Anyone can upload shirt designs"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'shirt-designs');

-- Políticas de storage: qualquer pessoa pode ver as imagens
CREATE POLICY "Anyone can view shirt designs"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'shirt-designs');