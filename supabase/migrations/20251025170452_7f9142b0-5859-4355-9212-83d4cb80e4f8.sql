-- Criar tabela de log de produção
CREATE TABLE IF NOT EXISTS public.production_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL CHECK (etapa IN ('Corte', 'Estampa', 'Acabamento', 'Embalagem')),
  operador TEXT,
  operador_id UUID REFERENCES auth.users(id),
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT now(),
  mensagem_enviada BOOLEAN DEFAULT false,
  observacao TEXT,
  tempo_etapa_minutos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar campo etapa_producao na tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS etapa_producao TEXT 
CHECK (etapa_producao IN ('Corte', 'Estampa', 'Acabamento', 'Embalagem', NULL));

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_production_log_pedido ON public.production_log(pedido_id);
CREATE INDEX IF NOT EXISTS idx_production_log_etapa ON public.production_log(etapa);
CREATE INDEX IF NOT EXISTS idx_production_log_data_hora ON public.production_log(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_orders_etapa_producao ON public.orders(etapa_producao) WHERE etapa_producao IS NOT NULL;

-- Habilitar RLS
ALTER TABLE public.production_log ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para production_log
CREATE POLICY "SuperAdmin e Admin podem ver logs de produção"
ON public.production_log FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "SuperAdmin e Admin podem inserir logs de produção"
ON public.production_log FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Apenas SuperAdmin pode deletar logs de produção"
ON public.production_log FOR DELETE
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Função para calcular tempo médio por etapa
CREATE OR REPLACE FUNCTION public.calcular_tempo_medio_etapa(p_etapa TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tempo_medio NUMERIC;
BEGIN
  SELECT AVG(tempo_etapa_minutos)
  INTO tempo_medio
  FROM public.production_log
  WHERE etapa = p_etapa
  AND tempo_etapa_minutos IS NOT NULL
  AND data_hora >= NOW() - INTERVAL '30 days';
  
  RETURN COALESCE(tempo_medio, 0);
END;
$$;

-- Função para registrar mudança de etapa
CREATE OR REPLACE FUNCTION public.registrar_mudanca_etapa(
  p_pedido_id UUID,
  p_etapa TEXT,
  p_observacao TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_operador_nome TEXT;
  v_etapa_anterior TEXT;
  v_tempo_minutos INTEGER;
BEGIN
  -- Obter nome do operador
  SELECT email INTO v_operador_nome
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Obter etapa anterior para calcular tempo
  SELECT etapa_producao INTO v_etapa_anterior
  FROM public.orders
  WHERE id = p_pedido_id;
  
  -- Calcular tempo desde última mudança (se houver)
  IF v_etapa_anterior IS NOT NULL THEN
    SELECT EXTRACT(EPOCH FROM (NOW() - MAX(data_hora))) / 60
    INTO v_tempo_minutos
    FROM public.production_log
    WHERE pedido_id = p_pedido_id;
  END IF;
  
  -- Atualizar etapa no pedido
  UPDATE public.orders
  SET etapa_producao = p_etapa
  WHERE id = p_pedido_id;
  
  -- Inserir log
  INSERT INTO public.production_log (
    pedido_id,
    etapa,
    operador,
    operador_id,
    observacao,
    tempo_etapa_minutos
  ) VALUES (
    p_pedido_id,
    p_etapa,
    v_operador_nome,
    auth.uid(),
    p_observacao,
    v_tempo_minutos
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;