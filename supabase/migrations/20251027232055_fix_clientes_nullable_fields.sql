/*
  # Fix Clientes Table - Make fields nullable

  ## Description
  Updates the clientes table to make cpf_cnpj optional (nullable).
  This allows customers to register without providing CPF/CNPJ initially.
  They can add this information later.

  ## Changes
  1. Alter cpf_cnpj column to allow NULL values
  2. Update the handle_new_user trigger to work with nullable cpf_cnpj

  ## Security
  - No changes to RLS policies
*/

-- Make cpf_cnpj nullable
ALTER TABLE public.clientes 
  ALTER COLUMN cpf_cnpj DROP NOT NULL;

-- Recreate the handle_new_user function with proper handling
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
    COALESCE(NEW.raw_user_meta_data->>'cpf_cnpj', NULL),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    NEW.email
  );

  -- Give the new user the 'cliente' role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating cliente record for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
