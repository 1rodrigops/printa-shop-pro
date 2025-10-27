/*
  # Create Produtos Table

  ## Description
  Creates a table to store product catalog for the t-shirt e-commerce system.
  Products include shirts, tank tops, hoodies, etc. with customization options.

  ## Tables Created
  - `produtos`
    - `id` (uuid, primary key) - Unique product identifier
    - `nome` (text) - Product name
    - `tipo` (text) - Product type (Camiseta, Regata, Moletom, etc)
    - `categoria` (text) - Category (Personalizada, Pronta, Branca, Promoção)
    - `descricao_curta` (text) - Short description (max 160 chars)
    - `descricao_completa` (text) - Full description
    - `estampa_url` (text) - URL to design/stamp image
    - `preco_frente` (numeric) - Price for front print only
    - `preco_frente_verso` (numeric) - Price for front + back print
    - `tecidos` (text[]) - Available fabrics array
    - `cores_disponiveis` (text[]) - Available colors array
    - `tamanhos_disponiveis` (text[]) - Available sizes array
    - `sku` (text) - Product SKU/code
    - `status` (text) - Product status (Ativo/Inativo)
    - `promo_valor` (numeric) - Promotional price
    - `promo_validade` (date) - Promotion expiry date
    - `cadastrado_por` (uuid) - User who registered the product
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Update timestamp

  ## Security
  - Enable RLS on produtos table
  - Anyone authenticated can view active products
  - Only admins/superadmins can create/update/delete products
*/

-- Create produtos table
CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL,
  categoria text NOT NULL,
  descricao_curta text DEFAULT '',
  descricao_completa text DEFAULT '',
  estampa_url text,
  preco_frente numeric(10, 2) NOT NULL DEFAULT 0,
  preco_frente_verso numeric(10, 2) NOT NULL DEFAULT 0,
  tecidos text[] DEFAULT ARRAY['Algodão Tradicional'],
  cores_disponiveis text[] DEFAULT ARRAY['Branco', 'Preto'],
  tamanhos_disponiveis text[] DEFAULT ARRAY['P', 'M', 'G', 'GG', 'XG'],
  sku text,
  status text DEFAULT 'Ativo',
  promo_valor numeric(10, 2),
  promo_validade date,
  cadastrado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone authenticated can view active products"
  ON produtos
  FOR SELECT
  TO authenticated
  USING (status = 'Ativo' OR status = 'Inativo');

CREATE POLICY "Admins can insert products"
  ON produtos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update products"
  ON produtos
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

CREATE POLICY "Admins can delete products"
  ON produtos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos(status);
CREATE INDEX IF NOT EXISTS idx_produtos_created_at ON produtos(created_at DESC);

-- Insert sample products
INSERT INTO produtos (
  nome,
  tipo,
  categoria,
  descricao_curta,
  descricao_completa,
  preco_frente,
  preco_frente_verso,
  tecidos,
  cores_disponiveis,
  tamanhos_disponiveis,
  sku,
  status
)
VALUES
  (
    'Camiseta Básica Personalizada',
    'Camiseta',
    'Personalizada',
    'Camiseta 100% algodão para personalização',
    'Camiseta de alta qualidade em algodão 30.1 fio penteado. Ideal para estampas personalizadas. Gola redonda reforçada e costura dupla nas mangas e barras.',
    75.00,
    95.00,
    ARRAY['Algodão Tradicional', 'Dry Fit Esportivo'],
    ARRAY['Branco', 'Preto', 'Cinza', 'Azul'],
    ARRAY['P', 'M', 'G', 'GG', 'XG'],
    'CAM-BAS-001',
    'Ativo'
  ),
  (
    'Regata Fitness Dry-Fit',
    'Regata',
    'Personalizada',
    'Regata esportiva com tecnologia dry-fit',
    'Regata de alta performance com tecido tecnológico que absorve o suor. Perfeita para academia e esportes. Material leve e respirável.',
    65.00,
    85.00,
    ARRAY['Dry Fit Esportivo'],
    ARRAY['Preto', 'Cinza', 'Azul', 'Verde'],
    ARRAY['P', 'M', 'G', 'GG'],
    'REG-FIT-001',
    'Ativo'
  ),
  (
    'Camiseta Premium Soft Touch',
    'Camiseta',
    'Personalizada',
    'Camiseta premium com toque extra macio',
    'Camiseta premium com malha especial de toque suave. Material de alta durabilidade e conforto superior. Ideal para estampas de alta qualidade.',
    95.00,
    120.00,
    ARRAY['Premium Soft Touch'],
    ARRAY['Branco', 'Preto', 'Cinza'],
    ARRAY['P', 'M', 'G', 'GG', 'XG'],
    'CAM-PREM-001',
    'Ativo'
  )
ON CONFLICT DO NOTHING;
