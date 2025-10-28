/*
  # Adicionar campos slug e logo_url na tabela empresas
  
  1. Alterações na tabela empresas
    - Adicionar campo `slug` (text, unique) - identificador único da empresa na URL
    - Adicionar campo `logo_url` (text) - URL do logo da empresa
    - Adicionar campo `descricao` (text) - descrição da empresa
  
  2. Atualizar dados existentes
    - Gerar slugs automáticos para empresas existentes
    - Slugs em lowercase, sem espaços
*/

-- Adicionar novos campos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'slug'
  ) THEN
    ALTER TABLE empresas ADD COLUMN slug text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE empresas ADD COLUMN logo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'descricao'
  ) THEN
    ALTER TABLE empresas ADD COLUMN descricao text;
  END IF;
END $$;

-- Gerar slugs automáticos para empresas existentes
UPDATE empresas
SET slug = LOWER(REPLACE(REPLACE(nome, ' ', '-'), 'ã', 'a'))
WHERE slug IS NULL;

-- Adicionar constraint de unique no slug
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'empresas_slug_key'
  ) THEN
    ALTER TABLE empresas ADD CONSTRAINT empresas_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug);
