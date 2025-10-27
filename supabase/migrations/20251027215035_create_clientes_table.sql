/*
  # Create Clientes (Customers) Table

  1. New Tables
    - `clientes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - optional, for customers with login
      - `nome_completo` (text) - full name
      - `cpf_cnpj` (text) - CPF or CNPJ document
      - `telefone` (text) - phone number
      - `email` (text) - email address
      - `endereco_rua` (text) - street address
      - `endereco_numero` (text) - street number
      - `endereco_bairro` (text) - neighborhood
      - `endereco_cidade` (text) - city
      - `endereco_uf` (text) - state
      - `cep` (text) - postal code
      - `observacoes` (text) - notes
      - `cadastrado_por` (uuid) - admin who registered the customer
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on clientes table
    - Customers can view/update their own data
    - Admins and SuperAdmins can manage all customers

  3. Indexes
    - Index on email for faster lookups
    - Index on cpf_cnpj for faster lookups
    - Index on user_id for faster joins
*/

-- Create clientes table
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome_completo text NOT NULL,
  cpf_cnpj text NOT NULL,
  telefone text NOT NULL,
  email text NOT NULL,
  endereco_rua text DEFAULT '',
  endereco_numero text DEFAULT '',
  endereco_bairro text DEFAULT '',
  endereco_cidade text DEFAULT '',
  endereco_uf text DEFAULT '',
  cep text DEFAULT '',
  observacoes text DEFAULT '',
  cadastrado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON public.clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);

-- Enable RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Policies for clientes
CREATE POLICY "Customers can view their own data"
  ON public.clientes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Customers can update their own data"
  ON public.clientes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all customers"
  ON public.clientes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can insert customers"
  ON public.clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update all customers"
  ON public.clientes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can delete customers"
  ON public.clientes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create cliente record for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new cliente record for the user
  INSERT INTO public.clientes (
    user_id,
    nome_completo,
    cpf_cnpj,
    telefone,
    email
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Novo Cliente'),
    COALESCE(NEW.raw_user_meta_data->>'cpf_cnpj', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    NEW.email
  );

  -- Give the new user the 'cliente' role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call handle_new_user on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE public.clientes IS 'Customer data table with automatic creation on user signup';