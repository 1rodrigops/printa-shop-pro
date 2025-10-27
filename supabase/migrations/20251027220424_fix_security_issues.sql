/*
  # Fix Security and Performance Issues

  1. Indexes
    - Add index for foreign key clientes.cadastrado_por
    - Remove unused indexes on clientes.email and clientes.cpf_cnpj

  2. RLS Policy Optimization
    - Replace auth.uid() with (select auth.uid()) in all policies
    - This prevents re-evaluation for each row and improves performance
    
  3. Function Search Path
    - Fix search_path for all functions to be immutable
    
  4. Policy Consolidation
    - Consolidate multiple permissive policies into single policies with OR conditions
*/

-- Add index for foreign key
CREATE INDEX IF NOT EXISTS idx_clientes_cadastrado_por ON public.clientes(cadastrado_por);

-- Remove unused indexes
DROP INDEX IF EXISTS public.idx_clientes_email;
DROP INDEX IF EXISTS public.idx_clientes_cpf_cnpj;

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "SuperAdmins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "SuperAdmins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "SuperAdmins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "SuperAdmins can delete roles" ON public.user_roles;

DROP POLICY IF EXISTS "Customers can view their own data" ON public.clientes;
DROP POLICY IF EXISTS "Customers can update their own data" ON public.clientes;
DROP POLICY IF EXISTS "Admins can view all customers" ON public.clientes;
DROP POLICY IF EXISTS "Admins can insert customers" ON public.clientes;
DROP POLICY IF EXISTS "Admins can update all customers" ON public.clientes;
DROP POLICY IF EXISTS "Admins can delete customers" ON public.clientes;

-- Recreate optimized RLS policies for user_roles (consolidated)
CREATE POLICY "Authenticated users can view roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('superadmin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('superadmin', 'admin')
    )
  );

-- Recreate optimized RLS policies for clientes (consolidated)
CREATE POLICY "Users can view customer data"
  ON public.clientes
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('superadmin', 'admin', 'vendedor')
    )
  );

CREATE POLICY "Users can update customer data"
  ON public.clientes
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('superadmin', 'admin', 'vendedor')
    )
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('superadmin', 'admin', 'vendedor')
    )
  );

CREATE POLICY "Admins can insert customers"
  ON public.clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('superadmin', 'admin', 'vendedor')
    )
  );

CREATE POLICY "Admins can delete customers"
  ON public.clientes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('superadmin', 'admin')
    )
  );

-- Fix function search paths to be immutable
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');
  
  INSERT INTO public.clientes (
    user_id,
    nome_completo,
    email,
    telefone
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Novo Cliente'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'telefone', '')
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = required_role
  );
END;
$$;