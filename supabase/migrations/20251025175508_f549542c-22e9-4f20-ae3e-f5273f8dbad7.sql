-- Criar tabela de configurações de pagamento
CREATE TABLE public.payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Configurações gerais
  pix_enabled BOOLEAN NOT NULL DEFAULT false,
  pagseguro_enabled BOOLEAN NOT NULL DEFAULT false,
  mercadopago_enabled BOOLEAN NOT NULL DEFAULT false,
  valor_minimo_pedido NUMERIC NOT NULL DEFAULT 30.00,
  prazo_compensacao TEXT,
  mensagem_checkout TEXT,
  
  -- Configurações PIX
  pix_chave TEXT,
  pix_nome_recebedor TEXT,
  pix_banco TEXT,
  pix_api_url TEXT,
  pix_gerar_qrcode BOOLEAN DEFAULT true,
  pix_webhook_url TEXT,
  
  -- Configurações PagSeguro
  pagseguro_email TEXT,
  pagseguro_token TEXT,
  pagseguro_webhook_url TEXT,
  pagseguro_ambiente TEXT DEFAULT 'producao',
  pagseguro_parcelamento BOOLEAN DEFAULT true,
  pagseguro_taxa NUMERIC DEFAULT 3.99,
  pagseguro_mensagem_retorno TEXT,
  
  -- Configurações Mercado Pago
  mercadopago_public_key TEXT,
  mercadopago_access_token TEXT,
  mercadopago_webhook_url TEXT,
  mercadopago_url_retorno TEXT,
  mercadopago_parcelamento BOOLEAN DEFAULT true,
  mercadopago_envios BOOLEAN DEFAULT false,
  mercadopago_mensagem TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Criar tabela de logs de pagamento
CREATE TABLE public.payment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES public.orders(id),
  metodo_pagamento TEXT NOT NULL, -- 'PIX', 'PagSeguro', 'Mercado Pago'
  valor NUMERIC NOT NULL,
  status TEXT NOT NULL, -- 'pago', 'pendente', 'cancelado', 'rejeitado'
  mensagem_api TEXT,
  transaction_id TEXT,
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.payment_settings (
  valor_minimo_pedido,
  prazo_compensacao,
  mensagem_checkout
) VALUES (
  30.00,
  'PIX: confirmação imediata | Cartão: 2 dias úteis | PagSeguro: 1 dia útil',
  '🔒 Pagamento 100% seguro e protegido'
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Policies para payment_settings
CREATE POLICY "SuperAdmin pode ver configurações de pagamento"
  ON public.payment_settings FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SuperAdmin pode atualizar configurações de pagamento"
  ON public.payment_settings FOR UPDATE
  USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "SuperAdmin pode inserir configurações de pagamento"
  ON public.payment_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Policies para payment_logs
CREATE POLICY "SuperAdmin e Admin podem ver logs de pagamento"
  ON public.payment_logs FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema pode inserir logs de pagamento"
  ON public.payment_logs FOR INSERT
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_payment_logs_pedido_id ON public.payment_logs(pedido_id);
CREATE INDEX idx_payment_logs_metodo ON public.payment_logs(metodo_pagamento);
CREATE INDEX idx_payment_logs_status ON public.payment_logs(status);
CREATE INDEX idx_payment_logs_created_at ON public.payment_logs(created_at DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();