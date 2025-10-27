/*
  # Fix Circular Dependency in user_roles RLS Policy

  1. Problem
    - The "Authenticated users can view roles" policy has a circular dependency
    - When a user tries to read their role, the EXISTS clause tries to read from user_roles again
    - This prevents users from reading their own roles
    
  2. Solution
    - Simplify the SELECT policy to allow users to always read their own role
    - Keep admin check but make it work properly
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;

-- Create a better policy that avoids circular dependency
-- Split into two separate policies for clarity
CREATE POLICY "Users can view own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('superadmin', 'admin')
    )
  );