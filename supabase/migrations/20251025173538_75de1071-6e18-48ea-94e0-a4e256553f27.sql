-- Criar tabela de controle de qualidade
CREATE TABLE IF NOT EXISTS public.quality_control_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  operador TEXT,
  operador_id UUID REFERENCES auth.users(id),
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  checklist JSONB NOT NULL DEFAULT '{}',
  fotos TEXT[] DEFAULT ARRAY[]::TEXT[],
  rastreio TEXT,
  transportadora TEXT,
  mensagem_enviada BOOLEAN DEFAULT FALSE,
  observacoes TEXT,
  aprovado BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_quality_control_pedido ON public.quality_control_log(pedido_id);
CREATE INDEX idx_quality_control_operador ON public.quality_control_log(operador_id);
CREATE INDEX idx_quality_control_data ON public.quality_control_log(data_hora);

-- RLS Policies
ALTER TABLE public.quality_control_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin e Admin podem ver logs de qualidade"
  ON public.quality_control_log FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SuperAdmin e Admin podem inserir logs de qualidade"
  ON public.quality_control_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SuperAdmin e Admin podem atualizar logs de qualidade"
  ON public.quality_control_log FOR UPDATE
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas SuperAdmin pode deletar logs de qualidade"
  ON public.quality_control_log FOR DELETE
  USING (has_role(auth.uid(), 'superadmin'::app_role));