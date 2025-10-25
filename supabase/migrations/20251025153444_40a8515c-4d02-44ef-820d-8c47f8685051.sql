-- Create produtos table for managing t-shirts and designs
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Camiseta', 'Regata', 'Moletom', 'Baby Look', 'Outro')),
  descricao_curta TEXT CHECK (length(descricao_curta) <= 160),
  descricao_completa TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('Personalizada', 'Pronta', 'Branca', 'Promoção')),
  estampa_url TEXT,
  preco_frente NUMERIC(10, 2) NOT NULL,
  preco_frente_verso NUMERIC(10, 2) NOT NULL,
  tecidos TEXT[] NOT NULL DEFAULT ARRAY['Algodão Tradicional'],
  cores_disponiveis TEXT[] NOT NULL DEFAULT ARRAY['Branco', 'Preto'],
  tamanhos_disponiveis TEXT[] NOT NULL DEFAULT ARRAY['P', 'M', 'G', 'GG', 'XG'],
  sku TEXT,
  fornecedor_id UUID,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  promo_valor NUMERIC(10, 2),
  promo_validade TIMESTAMP WITH TIME ZONE,
  cadastrado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create produto_variacoes table for stock control by variation
CREATE TABLE public.produto_variacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  tecido TEXT NOT NULL,
  cor TEXT NOT NULL,
  tamanho TEXT NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(produto_id, tecido, cor, tamanho)
);

-- Create movimentacoes_estoque table for inventory tracking
CREATE TABLE public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variacao_id UUID NOT NULL REFERENCES public.produto_variacoes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('Entrada', 'Saída')),
  quantidade INTEGER NOT NULL,
  observacao TEXT,
  usuario_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_variacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- RLS Policies for produtos
CREATE POLICY "SuperAdmin e Admin podem ver produtos"
ON public.produtos FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SuperAdmin e Admin podem inserir produtos"
ON public.produtos FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SuperAdmin e Admin podem atualizar produtos"
ON public.produtos FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas SuperAdmin pode excluir produtos"
ON public.produtos FOR DELETE
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for produto_variacoes
CREATE POLICY "SuperAdmin e Admin podem ver variações"
ON public.produto_variacoes FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SuperAdmin e Admin podem inserir variações"
ON public.produto_variacoes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SuperAdmin e Admin podem atualizar variações"
ON public.produto_variacoes FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas SuperAdmin pode excluir variações"
ON public.produto_variacoes FOR DELETE
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for movimentacoes_estoque
CREATE POLICY "SuperAdmin e Admin podem ver movimentações"
ON public.movimentacoes_estoque FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SuperAdmin e Admin podem inserir movimentações"
ON public.movimentacoes_estoque FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on produtos
CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on produto_variacoes
CREATE TRIGGER update_produto_variacoes_updated_at
BEFORE UPDATE ON public.produto_variacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_produtos_status ON public.produtos(status);
CREATE INDEX idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX idx_produto_variacoes_produto_id ON public.produto_variacoes(produto_id);
CREATE INDEX idx_movimentacoes_estoque_variacao_id ON public.movimentacoes_estoque(variacao_id);