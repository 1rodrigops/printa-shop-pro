/*
  # Estrutura Completa Multi-Empresa - Grupo Ágil
  
  1. Tabelas Core
    - `empresas` - Empresas do grupo (AgilUniformes, AgilGás, etc)
    - `user_roles` - Roles dos usuários (superadmin, admin, vendedor, cliente)
  
  2. Tabelas de Negócio
    - `clientes` - Clientes de cada empresa
    - `produtos` - Produtos por empresa
    - `fornecedores` - Fornecedores por empresa
    - `orders` - Pedidos
    - `payment_logs` - Logs de pagamento
    - `system_config` - Configurações do sistema
    - `payment_settings` - Configurações de pagamento
  
  3. Tabelas CMS
    - `sites` - Sites de cada empresa
    - `paginas` - Páginas dinâmicas
    - `midias` - Biblioteca de mídias
  
  4. Tabelas de Sistema
    - `admin_activity` - Log de atividades admin
  
  Security: RLS habilitado em todas as tabelas com políticas baseadas em empresa
*/

-- ============================================
-- TIPOS ENUMERADOS
-- ============================================

CREATE TYPE app_role AS ENUM ('superadmin', 'admin', 'vendedor', 'moderator', 'cliente', 'user');

-- ============================================
-- TABELA: EMPRESAS
-- ============================================

CREATE TABLE empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  dominio text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  cor_primary text DEFAULT '#111111',
  cor_accent text DEFAULT '#FF6A00',
  cor_bg text DEFAULT '#0B0B0B',
  cor_text text DEFAULT '#FFFFFF',
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: USER_ROLES
-- ============================================

CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role, empresa_id)
);

-- ============================================
-- TABELA: CLIENTES
-- ============================================

CREATE TABLE clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome_completo text NOT NULL,
  cpf_cnpj text,
  telefone text NOT NULL,
  email text NOT NULL,
  endereco_rua text,
  endereco_numero text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  cep text,
  observacoes text,
  cadastrado_por uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: PRODUTOS
-- ============================================

CREATE TABLE produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  categoria text,
  preco_base decimal(10, 2),
  sku text,
  ativo boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: FORNECEDORES
-- ============================================

CREATE TABLE fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cnpj text,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: SITES
-- ============================================

CREATE TABLE sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  slug text NOT NULL,
  titulo text NOT NULL,
  tema_primary text,
  tema_accent text,
  published boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, slug)
);

-- ============================================
-- TABELA: PAGINAS
-- ============================================

CREATE TABLE paginas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  rota text NOT NULL,
  titulo text NOT NULL,
  conteudo_json jsonb DEFAULT '{}'::jsonb,
  "order" integer DEFAULT 0,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(site_id, rota)
);

-- ============================================
-- TABELA: MIDIAS
-- ============================================

CREATE TABLE midias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  url text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('imagem', 'video')),
  titulo text,
  descricao text,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- ============================================
-- TABELA: ORDERS
-- ============================================

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES clientes(id),
  numero_pedido text UNIQUE,
  status text DEFAULT 'pendente',
  valor_total decimal(10, 2),
  observacoes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: PAYMENT_LOGS
-- ============================================

CREATE TABLE payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  tipo_pagamento text,
  valor decimal(10, 2),
  status text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: SYSTEM_CONFIG
-- ============================================

CREATE TABLE system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  chave text NOT NULL,
  valor jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, chave)
);

-- ============================================
-- TABELA: PAYMENT_SETTINGS
-- ============================================

CREATE TABLE payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  provider text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  ativo boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, provider)
);

-- ============================================
-- TABELA: ADMIN_ACTIVITY
-- ============================================

CREATE TABLE admin_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  empresa_id uuid REFERENCES empresas(id),
  action text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_empresas_dominio ON empresas(dominio);
CREATE INDEX idx_empresas_slug ON empresas(slug);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_empresa_id ON user_roles(empresa_id);
CREATE INDEX idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_produtos_empresa_id ON produtos(empresa_id);
CREATE INDEX idx_fornecedores_empresa_id ON fornecedores(empresa_id);
CREATE INDEX idx_sites_empresa_id ON sites(empresa_id);
CREATE INDEX idx_paginas_site_id ON paginas(site_id);
CREATE INDEX idx_midias_empresa_id ON midias(empresa_id);
CREATE INDEX idx_orders_empresa_id ON orders(empresa_id);
CREATE INDEX idx_admin_activity_user_id ON admin_activity(user_id);
CREATE INDEX idx_admin_activity_empresa_id ON admin_activity(empresa_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE paginas ENABLE ROW LEVEL SECURITY;
ALTER TABLE midias ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: EMPRESAS
-- ============================================

CREATE POLICY "Todos podem visualizar empresas ativas"
  ON empresas FOR SELECT
  TO authenticated
  USING (status = 'ativo');

CREATE POLICY "SuperAdmin pode gerenciar todas as empresas"
  ON empresas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- ============================================
-- RLS POLICIES: USER_ROLES
-- ============================================

CREATE POLICY "Usuários podem ver próprios roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "SuperAdmin pode gerenciar todos os roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- ============================================
-- RLS POLICIES: CLIENTES
-- ============================================

CREATE POLICY "Usuários podem ver clientes da própria empresa"
  ON clientes FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND (
        ur.role = 'superadmin'
        OR (ur.role IN ('admin', 'vendedor') AND ur.empresa_id = clientes.empresa_id)
      )
    )
  );

CREATE POLICY "Admins podem inserir clientes"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Usuários podem atualizar dados de clientes"
  ON clientes FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND (ur.role IN ('superadmin', 'admin', 'vendedor'))
    )
  );

CREATE POLICY "Admins podem deletar clientes"
  ON clientes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('superadmin', 'admin')
    )
  );

-- ============================================
-- RLS POLICIES: PRODUTOS, FORNECEDORES, ORDERS
-- ============================================

CREATE POLICY "Usuários podem ver recursos da própria empresa"
  ON produtos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND (ur.role = 'superadmin' OR ur.empresa_id = produtos.empresa_id)
    )
  );

CREATE POLICY "Admins podem gerenciar produtos"
  ON produtos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Usuários podem ver fornecedores da própria empresa"
  ON fornecedores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND (ur.role = 'superadmin' OR ur.empresa_id = fornecedores.empresa_id)
    )
  );

CREATE POLICY "Admins podem gerenciar fornecedores"
  ON fornecedores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Usuários podem ver pedidos da própria empresa"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND (ur.role = 'superadmin' OR ur.empresa_id = orders.empresa_id)
    )
  );

CREATE POLICY "Admins podem gerenciar pedidos"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('superadmin', 'admin', 'vendedor')
    )
  );

-- ============================================
-- RLS POLICIES: SITES E PAGINAS
-- ============================================

CREATE POLICY "Usuários podem ver sites da própria empresa"
  ON sites FOR SELECT
  TO authenticated
  USING (published = true OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND (ur.role = 'superadmin' OR ur.empresa_id = sites.empresa_id)
  ));

CREATE POLICY "Admins podem gerenciar sites"
  ON sites FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Usuários podem ver páginas publicadas"
  ON paginas FOR SELECT
  TO authenticated
  USING (published = true OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('superadmin', 'admin')
  ));

CREATE POLICY "Admins podem gerenciar páginas"
  ON paginas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('superadmin', 'admin')
    )
  );

-- ============================================
-- RLS POLICIES: MIDIAS
-- ============================================

CREATE POLICY "Usuários podem ver mídias da própria empresa"
  ON midias FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND (ur.role = 'superadmin' OR ur.empresa_id = midias.empresa_id)
    )
  );

CREATE POLICY "Admins podem gerenciar mídias"
  ON midias FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('superadmin', 'admin')
    )
  );

-- ============================================
-- RLS POLICIES: CONFIG E LOGS
-- ============================================

CREATE POLICY "Admins podem ver config da própria empresa"
  ON system_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND (ur.role = 'superadmin' OR ur.empresa_id = system_config.empresa_id)
    )
  );

CREATE POLICY "Admins podem gerenciar config"
  ON system_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Admins podem ver payment settings"
  ON payment_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND (ur.role = 'superadmin' OR ur.empresa_id = payment_settings.empresa_id)
    )
  );

CREATE POLICY "Admins podem gerenciar payment settings"
  ON payment_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Usuários podem ver payment logs"
  ON payment_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = payment_logs.order_id
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND (ur.role = 'superadmin' OR ur.empresa_id = o.empresa_id)
      )
    )
  );

CREATE POLICY "Sistema pode criar payment logs"
  ON payment_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins podem ver atividades"
  ON admin_activity FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND (ur.role = 'superadmin' OR ur.empresa_id = admin_activity.empresa_id)
    )
  );

CREATE POLICY "Usuários autenticados podem criar atividades"
  ON admin_activity FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON fornecedores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paginas_updated_at BEFORE UPDATE ON paginas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
