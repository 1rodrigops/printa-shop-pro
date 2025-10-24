-- Criar tabela para armazenar relatórios
CREATE TABLE IF NOT EXISTS public.relatorios_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo TEXT NOT NULL, -- 'semanal' ou 'mensal'
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  data_geracao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  gerado_por UUID REFERENCES auth.users(id),
  dados_json JSONB NOT NULL,
  arquivo_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.relatorios_admin ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Apenas superadmin pode inserir relatórios"
ON public.relatorios_admin
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "SuperAdmin e Admin podem ver relatórios"
ON public.relatorios_admin
FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Apenas superadmin pode deletar relatórios"
ON public.relatorios_admin
FOR DELETE
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Criar função para calcular métricas de relatório
CREATE OR REPLACE FUNCTION public.calcular_metricas_relatorio(
  data_inicio DATE,
  data_fim DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  pedidos_criados INT;
  pedidos_producao INT;
  pedidos_entregues INT;
  tempo_medio_producao NUMERIC;
  admins_ativos INT;
BEGIN
  -- Pedidos criados no período
  SELECT COUNT(*) INTO pedidos_criados
  FROM orders
  WHERE DATE(created_at) BETWEEN data_inicio AND data_fim;
  
  -- Pedidos em produção
  SELECT COUNT(*) INTO pedidos_producao
  FROM orders
  WHERE status = 'in_production';
  
  -- Pedidos entregues no período
  SELECT COUNT(*) INTO pedidos_entregues
  FROM orders
  WHERE status = 'delivered' 
  AND DATE(updated_at) BETWEEN data_inicio AND data_fim;
  
  -- Tempo médio de produção (em dias)
  SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400), 1)
  INTO tempo_medio_producao
  FROM orders
  WHERE status = 'delivered'
  AND DATE(updated_at) BETWEEN data_inicio AND data_fim;
  
  -- Admins ativos no período
  SELECT COUNT(DISTINCT user_id) INTO admins_ativos
  FROM admin_activity_log
  WHERE DATE(timestamp) BETWEEN data_inicio AND data_fim
  AND action_type IN ('login', 'pedido_edit', 'cadastro_edit');
  
  -- Montar resultado
  result := jsonb_build_object(
    'pedidos_criados', COALESCE(pedidos_criados, 0),
    'pedidos_producao', COALESCE(pedidos_producao, 0),
    'pedidos_entregues', COALESCE(pedidos_entregues, 0),
    'tempo_medio_producao', COALESCE(tempo_medio_producao, 0),
    'admins_ativos', COALESCE(admins_ativos, 0)
  );
  
  RETURN result;
END;
$$;

-- Enable realtime para relatórios
ALTER PUBLICATION supabase_realtime ADD TABLE public.relatorios_admin;