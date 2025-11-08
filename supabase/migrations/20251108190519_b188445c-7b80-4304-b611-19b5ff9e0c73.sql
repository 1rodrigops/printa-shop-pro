-- Criar tabela de empresas
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  dominio TEXT UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  cor_primary TEXT DEFAULT '#111111',
  cor_accent TEXT DEFAULT '#FF6A00',
  cor_bg TEXT DEFAULT '#FFFFFF',
  cor_text TEXT DEFAULT '#000000',
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de sites
CREATE TABLE IF NOT EXISTS public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  dominio TEXT UNIQUE,
  slug TEXT NOT NULL,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de páginas
CREATE TABLE IF NOT EXISTS public.paginas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL,
  conteudo_json JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'publicado' CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de mídias
CREATE TABLE IF NOT EXISTS public.midias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  url TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de módulos de empresa
CREATE TABLE IF NOT EXISTS public.empresa_modulos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar empresa_id à tabela user_roles se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'user_roles' 
                 AND column_name = 'empresa_id') THEN
    ALTER TABLE public.user_roles ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
  END IF;
END $$;

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paginas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.midias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_modulos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS públicas para visualização (ajuste conforme necessário)
CREATE POLICY "Empresas são visíveis publicamente" ON public.empresas FOR SELECT USING (true);
CREATE POLICY "Sites são visíveis publicamente" ON public.sites FOR SELECT USING (true);
CREATE POLICY "Páginas publicadas são visíveis publicamente" ON public.paginas FOR SELECT USING (status = 'publicado');
CREATE POLICY "Mídias são visíveis publicamente" ON public.midias FOR SELECT USING (true);

-- Criar triggers para updated_at
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paginas_updated_at
  BEFORE UPDATE ON public.paginas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_midias_updated_at
  BEFORE UPDATE ON public.midias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_empresa_modulos_updated_at
  BEFORE UPDATE ON public.empresa_modulos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir empresa padrão AgilUniformes
INSERT INTO public.empresas (nome, dominio, slug, cor_primary, cor_accent, cor_bg, cor_text, status)
VALUES ('AgilUniformes', 'agiluniformes.com.br', 'agiluniformes', '#111111', '#FF6A00', '#FFFFFF', '#000000', 'ativo')
ON CONFLICT (slug) DO NOTHING;