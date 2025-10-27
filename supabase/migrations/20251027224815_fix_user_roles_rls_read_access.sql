/*
  # Fix User Roles RLS - Enable Self-Read

  ## Problem
  - Circular dependency: users need to read user_roles to know their role
  - But policies require existing role to read user_roles
  - Result: nobody can read their own role

  ## Solution
  - Drop restrictive admin-only SELECT policy
  - Keep simple policy: users can ALWAYS read their own role
  - This breaks the circular dependency

  ## Changes
  1. Drop "Admins can view all roles" policy (too restrictive)
  2. Keep "Users can view own role" policy (allows self-read)
  3. Security: Users can only see their own role, not others
*/

-- Drop the restrictive policy that blocks self-reading
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

-- The "Users can view own role" policy already exists and allows:
-- SELECT where user_id = auth.uid()
-- This is sufficient for users to read their own role

-- Verify the policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Users can view own role'
  ) THEN
    CREATE POLICY "Users can view own role"
      ON user_roles
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
