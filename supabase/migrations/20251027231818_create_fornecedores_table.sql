/*
  # Create Fornecedores Table

  ## Description
  Creates a table to store supplier information for the t-shirt manufacturing business.
  Suppliers can provide fabrics, stamps, packaging, transportation, etc.

  ## Tables Created
  - `fornecedores`
    - `id` (uuid, primary key) - Unique supplier identifier
    - `nome_empresa` (text) - Company name
    - `cnpj_cpf` (text) - Company tax ID or personal ID
    - `responsavel` (text) - Contact person name
    - `telefone_comercial` (text) - Business phone
    - `email_contato` (text) - Contact email
    - `tipo_fornecimento` (text[]) - Types of supplies (Tecido, Estampa, etc)
    - `tipo_tecido` (text) - Fabric type if applicable
    - `forma_pagamento` (text) - Payment method (PIX, Boleto, etc)
    - `prazo_entrega` (text) - Average delivery time
    - `fornece_amostras` (boolean) - Whether samples are provided
    - `link_catalogo` (text) - Digital catalog link
    - `observacoes` (text) - General notes
    - `status` (text) - Status (Ativo/Inativo)
    - `avaliacao` (integer) - Rating from 1-5
    - `cadastrado_por` (uuid) - User who registered the supplier
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Update timestamp

  ## Security
  - Enable RLS on fornecedores table
  - Only admins and superadmins can view suppliers
  - Only admins and superadmins can create/update suppliers
  - Only superadmins can delete suppliers
*/

-- Create fornecedores table
CREATE TABLE IF NOT EXISTS fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa text NOT NULL,
  cnpj_cpf text NOT NULL,
  responsavel text,
  telefone_comercial text,
  email_contato text NOT NULL,
  tipo_fornecimento text[] DEFAULT ARRAY[]::text[],
  tipo_tecido text,
  forma_pagamento text DEFAULT 'PIX',
  prazo_entrega text,
  fornece_amostras boolean DEFAULT false,
  link_catalogo text,
  observacoes text,
  status text DEFAULT 'Ativo',
  avaliacao integer DEFAULT 3 CHECK (avaliacao >= 1 AND avaliacao <= 5),
  cadastrado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view suppliers"
  ON fornecedores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can insert suppliers"
  ON fornecedores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update suppliers"
  ON fornecedores
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Only superadmins can delete suppliers"
  ON fornecedores
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fornecedores_status ON fornecedores(status);
CREATE INDEX IF NOT EXISTS idx_fornecedores_tipo_fornecimento ON fornecedores USING gin(tipo_fornecimento);
CREATE INDEX IF NOT EXISTS idx_fornecedores_created_at ON fornecedores(created_at DESC);

-- Insert sample suppliers
INSERT INTO fornecedores (
  nome_empresa,
  cnpj_cpf,
  responsavel,
  telefone_comercial,
  email_contato,
  tipo_fornecimento,
  tipo_tecido,
  forma_pagamento,
  prazo_entrega,
  fornece_amostras,
  observacoes,
  status,
  avaliacao
)
VALUES
  (
    'Tecidos São Paulo LTDA',
    '12.345.678/0001-90',
    'João Silva',
    '(11) 98765-4321',
    'contato@tecidossp.com.br',
    ARRAY['Tecido'],
    'Algodão',
    'PIX',
    '7 dias úteis',
    true,
    'Fornecedor confiável, qualidade premium',
    'Ativo',
    5
  ),
  (
    'Estamparia Digital Rio',
    '98.765.432/0001-11',
    'Maria Santos',
    '(21) 91234-5678',
    'vendas@estampariadtf.com.br',
    ARRAY['Estampa DTF', 'Sublimação'],
    NULL,
    'Boleto',
    '5 dias úteis',
    true,
    'Especializada em DTF de alta qualidade',
    'Ativo',
    4
  ),
  (
    'Embalagens & Cia',
    '45.678.901/0001-22',
    'Carlos Oliveira',
    '(31) 97777-8888',
    'comercial@embalagensecia.com',
    ARRAY['Embalagens', 'Brindes'],
    NULL,
    'Transferência',
    '10 dias úteis',
    false,
    'Variedade de tamanhos disponíveis',
    'Ativo',
    4
  )
ON CONFLICT DO NOTHING;
