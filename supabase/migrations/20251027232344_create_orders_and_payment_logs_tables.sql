/*
  # Create Orders and Payment Logs Tables

  ## Description
  Creates tables for managing customer orders and payment transaction logs.
  
  ## Tables Created
  
  ### 1. orders
  - `id` (uuid, primary key) - Order identifier
  - `customer_name` (text) - Customer full name
  - `customer_email` (text) - Customer email
  - `customer_phone` (text) - Customer phone
  - `shirt_color` (text) - Selected shirt color
  - `shirt_size` (text) - Main shirt size
  - `quantity` (integer) - Total quantity of items
  - `total_price` (numeric) - Total order price
  - `status` (text) - Order status (pending, confirmed, in_production, shipped, delivered, cancelled)
  - `front_image_url` (text) - URL to front design image
  - `back_image_url` (text) - URL to back design image (optional)
  - `order_details` (jsonb) - Additional order details (sizes breakdown, fabric, etc)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Update timestamp
  
  ### 2. payment_logs
  - `id` (uuid, primary key) - Log identifier
  - `pedido_id` (uuid) - Reference to orders table
  - `metodo_pagamento` (text) - Payment method (pix, pagseguro, mercadopago)
  - `valor` (numeric) - Payment amount
  - `status` (text) - Payment status
  - `mensagem_api` (text) - API response message
  - `transaction_id` (text) - External transaction ID
  - `created_at` (timestamptz) - Log timestamp

  ## Security
  - Enable RLS on both tables
  - Customers can view their own orders
  - Admins can manage all orders and payment logs
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  shirt_color text DEFAULT 'Branco',
  shirt_size text DEFAULT 'M',
  quantity integer DEFAULT 1,
  total_price numeric(10, 2) NOT NULL,
  status text DEFAULT 'pending',
  front_image_url text,
  back_image_url text,
  order_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_logs table
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  metodo_pagamento text NOT NULL,
  valor numeric(10, 2) NOT NULL,
  status text DEFAULT 'Aguardando',
  mensagem_api text DEFAULT '',
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_pedido_id ON public.payment_logs(pedido_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON public.payment_logs(status);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Customers can view their own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (customer_email = auth.jwt()->>'email');

CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Anyone can insert orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Payment logs policies
CREATE POLICY "Admins can view payment logs"
  ON public.payment_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Anyone can insert payment logs"
  ON public.payment_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update payment logs"
  ON public.payment_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.orders IS 'Customer orders table for t-shirt personalization';
COMMENT ON TABLE public.payment_logs IS 'Payment transaction logs for tracking payment status';
