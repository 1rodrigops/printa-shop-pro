/*
  # Create User Roles System and SuperAdmin

  1. New Types
    - `app_role` enum with roles: cliente, vendedor, admin, superadmin

  2. New Tables
    - `user_roles`
      - `user_id` (uuid, references auth.users)
      - `role` (app_role enum)
      - `created_at` (timestamp)
    
  3. Security
    - Enable RLS on user_roles table
    - Add policies for role management
    - Only superadmins can manage roles

  4. Data
    - Promote user marketing@agilgas.com.br to superadmin role
*/

-- Create app_role enum if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('cliente', 'vendedor', 'admin', 'superadmin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'cliente',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, check_role app_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = has_role.user_id
    AND user_roles.role = check_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "SuperAdmins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

CREATE POLICY "SuperAdmins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

CREATE POLICY "SuperAdmins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

CREATE POLICY "SuperAdmins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Promote marketing@agilgas.com.br to superadmin
INSERT INTO public.user_roles (user_id, role)
VALUES ('1d71758d-8bf8-4407-a3a9-d54df6138171', 'superadmin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.user_roles IS 'User roles table. SuperAdmin: marketing@agilgas.com.br';