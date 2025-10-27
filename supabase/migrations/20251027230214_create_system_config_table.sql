/*
  # Create System Config Table

  ## Description
  Creates a table to store system-wide configuration settings like WhatsApp API credentials,
  payment settings, email configuration, etc.

  ## Tables Created
  - `system_config`
    - `config_key` (text, primary key) - Unique identifier for the config
    - `config_value` (text) - The configuration value
    - `config_category` (text) - Category grouping (whatsapp, payment, email, etc)
    - `description` (text) - Human-readable description
    - `updated_by` (uuid) - User who last updated this config
    - `created_at` (timestamptz) - When this config was created
    - `updated_at` (timestamptz) - When this config was last updated

  ## Security
  - Enable RLS on system_config table
  - Only superadmins can read/write system configurations
  - Regular users cannot access this table
*/

-- Create system_config table
CREATE TABLE IF NOT EXISTS system_config (
  config_key text PRIMARY KEY,
  config_value text NOT NULL DEFAULT '',
  config_category text NOT NULL DEFAULT 'general',
  description text DEFAULT '',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Create policies: Only superadmins can access system config
CREATE POLICY "Superadmins can view system config"
  ON system_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can insert system config"
  ON system_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can update system config"
  ON system_config
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

CREATE POLICY "Superadmins can delete system config"
  ON system_config
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
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default WhatsApp config values
INSERT INTO system_config (config_key, config_value, config_category, description)
VALUES
  ('api_whatsapp_url', '', 'whatsapp', 'URL do servidor WhatsApp API'),
  ('api_whatsapp_key', '', 'whatsapp', 'Chave de API global WhatsApp'),
  ('api_whatsapp_provider', 'WuzAPI', 'whatsapp', 'Provedor de API WhatsApp'),
  ('api_whatsapp_numero', '', 'whatsapp', 'Número de WhatsApp remetente'),
  ('msg_pedido_recebido', 'Olá {{nome}}, recebemos seu pedido #{{id}}! Em breve enviaremos detalhes.', 'whatsapp_messages', 'Mensagem: Pedido Recebido'),
  ('msg_seja_bem_vindo', 'Olá {{nome}}, bem-vindo à StampShirts! Personalize suas camisetas conosco 👕✨', 'whatsapp_messages', 'Mensagem: Seja Bem-Vindo'),
  ('msg_pagamento_recebido', 'Pagamento do pedido #{{id}} confirmado! Agora sua camiseta vai para a produção.', 'whatsapp_messages', 'Mensagem: Pagamento Recebido'),
  ('msg_em_producao', 'Seu pedido #{{id}} está sendo estampado! 🔥', 'whatsapp_messages', 'Mensagem: Em Produção'),
  ('msg_em_transporte', '🚚 Seu pedido #{{id}} foi enviado! Acompanhe aqui: {{link_rastreamento}}', 'whatsapp_messages', 'Mensagem: Em Transporte'),
  ('msg_finalizado', '🎉 Pedido #{{id}} entregue com sucesso! Esperamos que você ame sua camiseta ❤️', 'whatsapp_messages', 'Mensagem: Finalizado')
ON CONFLICT (config_key) DO NOTHING;
