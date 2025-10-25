-- Remover políticas existentes se houverem
DROP POLICY IF EXISTS "SuperAdmin e Admin podem ver clientes" ON public.clientes;
DROP POLICY IF EXISTS "SuperAdmin e Admin podem inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "SuperAdmin e Admin podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Apenas SuperAdmin pode excluir clientes" ON public.clientes;

-- Criar tabela de clientes se não existir
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  endereco_rua TEXT,
  endereco_numero TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT,
  cep TEXT,
  observacoes TEXT,
  cadastrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "SuperAdmin e Admin podem ver clientes"
  ON public.clientes
  FOR SELECT
  USING (
    has_role(auth.uid(), 'superadmin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "SuperAdmin e Admin podem inserir clientes"
  ON public.clientes
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'superadmin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "SuperAdmin e Admin podem atualizar clientes"
  ON public.clientes
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'superadmin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Apenas SuperAdmin pode excluir clientes"
  ON public.clientes
  FOR DELETE
  USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_clientes_updated_at ON public.clientes;
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para otimização de busca
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome_completo);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON public.clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON public.clientes(telefone);