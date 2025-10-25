-- Tabela de fornecedores
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_empresa TEXT NOT NULL,
  cnpj_cpf TEXT NOT NULL,
  responsavel TEXT,
  telefone_comercial TEXT,
  email_contato TEXT NOT NULL,
  tipo_fornecimento TEXT[] NOT NULL DEFAULT ARRAY['Outro'::TEXT],
  tipo_tecido TEXT,
  forma_pagamento TEXT NOT NULL DEFAULT 'PIX',
  prazo_entrega TEXT,
  fornece_amostras BOOLEAN DEFAULT false,
  link_catalogo TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',
  avaliacao NUMERIC(2,1) DEFAULT 0 CHECK (avaliacao >= 0 AND avaliacao <= 5),
  cadastrado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de relacionamento com fornecedores
CREATE TABLE public.fornecedor_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL, -- 'compra', 'entrega_atrasada', 'avaliacao', 'observacao'
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2),
  data_evento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedor_historico ENABLE ROW LEVEL SECURITY;

-- RLS Policies para fornecedores
CREATE POLICY "SuperAdmin e Admin podem ver fornecedores"
  ON public.fornecedores FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SuperAdmin e Admin podem inserir fornecedores"
  ON public.fornecedores FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SuperAdmin e Admin podem atualizar fornecedores"
  ON public.fornecedores FOR UPDATE
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas SuperAdmin pode excluir fornecedores"
  ON public.fornecedores FOR DELETE
  USING (has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies para histórico
CREATE POLICY "SuperAdmin e Admin podem ver histórico"
  ON public.fornecedor_historico FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SuperAdmin e Admin podem inserir histórico"
  ON public.fornecedor_historico FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_fornecedores_status ON public.fornecedores(status);
CREATE INDEX idx_fornecedores_tipo_fornecimento ON public.fornecedores USING GIN(tipo_fornecimento);
CREATE INDEX idx_fornecedor_historico_fornecedor_id ON public.fornecedor_historico(fornecedor_id);
CREATE INDEX idx_fornecedor_historico_tipo_evento ON public.fornecedor_historico(tipo_evento);