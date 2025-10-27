/*
  # Fix default role for new users

  ## Changes
  - Updates the `handle_new_user()` function to assign role "cliente" instead of "admin" for new users
  - This ensures that users who register through /personalizar get the correct role automatically

  ## Why
  - Currently, new users are being assigned "admin" role by default
  - Users registering through the public customization page should be "cliente"
  - This will make them visible in the /admin/cadastro/usuarios list
*/

-- Update the function to assign 'cliente' role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign 'cliente' role automatically for new users
  -- Users registering through public pages should be customers by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;