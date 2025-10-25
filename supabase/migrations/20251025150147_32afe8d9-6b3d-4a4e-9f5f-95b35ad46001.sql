-- Criar tabela de matriz de permissões
CREATE TABLE IF NOT EXISTS public.permissions_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, module)
);

-- Habilitar RLS
ALTER TABLE public.permissions_matrix ENABLE ROW LEVEL SECURITY;

-- Política: Apenas SuperAdmin pode visualizar permissões
CREATE POLICY "Apenas SuperAdmin pode ver permissões"
ON public.permissions_matrix
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Política: Apenas SuperAdmin pode inserir permissões
CREATE POLICY "Apenas SuperAdmin pode inserir permissões"
ON public.permissions_matrix
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Política: Apenas SuperAdmin pode atualizar permissões
CREATE POLICY "Apenas SuperAdmin pode atualizar permissões"
ON public.permissions_matrix
FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Política: Apenas SuperAdmin pode deletar permissões
CREATE POLICY "Apenas SuperAdmin pode deletar permissões"
ON public.permissions_matrix
FOR DELETE
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_permissions_matrix_updated_at
BEFORE UPDATE ON public.permissions_matrix
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir permissões padrão para Admin
INSERT INTO public.permissions_matrix (role, module, can_view, can_edit, can_delete, can_export) VALUES
('admin', 'cadastro_clientes', true, true, false, true),
('admin', 'cadastro_usuarios', false, false, false, false),
('admin', 'vendas', true, true, false, true),
('admin', 'financeiro', false, false, false, false),
('admin', 'estoque', true, true, false, true),
('admin', 'relatorios', true, false, false, true),
('admin', 'utilidades', true, true, true, true),
('admin', 'meus_pedidos', true, false, false, false)
ON CONFLICT (role, module) DO NOTHING;

-- Inserir permissões padrão para Cliente
INSERT INTO public.permissions_matrix (role, module, can_view, can_edit, can_delete, can_export) VALUES
('cliente', 'cadastro_clientes', false, false, false, false),
('cliente', 'cadastro_usuarios', false, false, false, false),
('cliente', 'vendas', false, false, false, false),
('cliente', 'financeiro', false, false, false, false),
('cliente', 'estoque', false, false, false, false),
('cliente', 'relatorios', false, false, false, false),
('cliente', 'utilidades', false, false, false, false),
('cliente', 'meus_pedidos', true, false, false, false)
ON CONFLICT (role, module) DO NOTHING;