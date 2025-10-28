/*
  # Sistema de Módulos e Permissões por Empresa
  
  1. Nova Tabela: empresa_modulos
    - `id` (uuid, primary key)
    - `empresa_id` (uuid, foreign key -> empresas)
    - `modulo` (text) - nome do módulo (cadastro, vendas, financeiro, estoque, relatorios, utilidades, meus_pedidos)
    - `ativo` (boolean) - se o módulo está ativo para a empresa
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  2. Segurança
    - Enable RLS na tabela empresa_modulos
    - SuperAdmins podem gerenciar todos os módulos
    - Admins podem ver módulos de suas empresas
  
  3. Dados Iniciais
    - Grupo Agil terá todos os módulos ativos por padrão
*/

-- Criar tabela de módulos por empresa
CREATE TABLE IF NOT EXISTS empresa_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  modulo text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT empresa_modulos_unique UNIQUE (empresa_id, modulo)
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_empresa_modulos_empresa_id ON empresa_modulos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresa_modulos_ativo ON empresa_modulos(ativo);

-- Enable RLS
ALTER TABLE empresa_modulos ENABLE ROW LEVEL SECURITY;

-- Política: SuperAdmins podem gerenciar tudo
CREATE POLICY "SuperAdmins podem gerenciar empresa_modulos"
  ON empresa_modulos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

-- Política: Usuários podem ver módulos de suas empresas
CREATE POLICY "Usuários podem ver módulos de suas empresas"
  ON empresa_modulos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.empresa_id = empresa_modulos.empresa_id
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

-- Inserir todos os módulos para o Grupo Agil
DO $$
DECLARE
  v_grupo_agil_id uuid;
BEGIN
  -- Buscar ID do Grupo Agil
  SELECT id INTO v_grupo_agil_id FROM empresas WHERE nome = 'Grupo Agil' LIMIT 1;
  
  IF v_grupo_agil_id IS NOT NULL THEN
    -- Inserir todos os módulos como ativos
    INSERT INTO empresa_modulos (empresa_id, modulo, ativo) VALUES
      (v_grupo_agil_id, 'cadastro', true),
      (v_grupo_agil_id, 'vendas', true),
      (v_grupo_agil_id, 'financeiro', true),
      (v_grupo_agil_id, 'estoque', true),
      (v_grupo_agil_id, 'relatorios', true),
      (v_grupo_agil_id, 'utilidades', true),
      (v_grupo_agil_id, 'meus_pedidos', true)
    ON CONFLICT (empresa_id, modulo) DO NOTHING;
  END IF;
END $$;
