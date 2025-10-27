/*
  # Create Payment Settings Table

  ## Description
  Creates a table to store payment configuration settings for the e-commerce system.
  This includes PIX, PagSeguro, and Mercado Pago configurations.

  ## Tables Created
  - `payment_settings`
    - `id` (uuid, primary key) - Unique identifier
    - `pix_enabled` (boolean) - Whether PIX is enabled
    - `pagseguro_enabled` (boolean) - Whether PagSeguro is enabled
    - `mercadopago_enabled` (boolean) - Whether Mercado Pago is enabled
    - `valor_minimo_pedido` (numeric) - Minimum order value
    - `prazo_compensacao` (text) - Payment compensation terms
    - `mensagem_checkout` (text) - Checkout message for customers
    - `pix_chave` (text) - PIX key
    - `pix_tipo_chave` (text) - PIX key type (cpf, cnpj, email, phone, random)
    - `pix_nome_beneficiario` (text) - PIX beneficiary name
    - `pagseguro_email` (text) - PagSeguro account email
    - `pagseguro_token` (text) - PagSeguro API token
    - `pagseguro_ambiente` (text) - PagSeguro environment (sandbox/production)
    - `mercadopago_public_key` (text) - Mercado Pago public key
    - `mercadopago_access_token` (text) - Mercado Pago access token
    - `mercadopago_ambiente` (text) - Mercado Pago environment (sandbox/production)
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record update timestamp

  ## Security
  - Enable RLS on payment_settings table
  - Only superadmins can read/write payment settings
  - Regular users cannot access sensitive payment data
*/

-- Create payment_settings table
CREATE TABLE IF NOT EXISTS payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pix_enabled boolean DEFAULT false,
  pagseguro_enabled boolean DEFAULT false,
  mercadopago_enabled boolean DEFAULT false,
  valor_minimo_pedido numeric(10, 2) DEFAULT 30.00,
  prazo_compensacao text DEFAULT '',
  mensagem_checkout text DEFAULT '',
  
  -- PIX Settings
  pix_chave text DEFAULT '',
  pix_tipo_chave text DEFAULT 'cpf',
  pix_nome_beneficiario text DEFAULT '',
  
  -- PagSeguro Settings
  pagseguro_email text DEFAULT '',
  pagseguro_token text DEFAULT '',
  pagseguro_ambiente text DEFAULT 'sandbox',
  
  -- Mercado Pago Settings
  mercadopago_public_key text DEFAULT '',
  mercadopago_access_token text DEFAULT '',
  mercadopago_ambiente text DEFAULT 'sandbox',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Create policies: Only superadmins can access payment settings
CREATE POLICY "Superadmins can view payment settings"
  ON payment_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can insert payment settings"
  ON payment_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can update payment settings"
  ON payment_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can delete payment settings"
  ON payment_settings
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
CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment settings (single row for the system)
INSERT INTO payment_settings (
  pix_enabled,
  pagseguro_enabled,
  mercadopago_enabled,
  valor_minimo_pedido,
  prazo_compensacao,
  mensagem_checkout
)
VALUES (
  false,
  false,
  false,
  30.00,
  'PIX: imediato | Cartão: 2 dias úteis | Boleto: até 3 dias úteis',
  'Escolha a forma de pagamento que melhor se adapta às suas necessidades.'
)
ON CONFLICT DO NOTHING;
