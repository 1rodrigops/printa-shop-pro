import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Tenant {
  id: string;
  nome: string;
  dominio: string;
  slug: string;
  logo_url: string | null;
  cor_primary: string;
  cor_accent: string;
  cor_bg: string;
  cor_text: string;
  status: string;
  metadata: any;
}

export interface TenantBranding {
  primary: string;
  accent: string;
  bg: string;
  text: string;
  logo?: string;
}

export const useTenant = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Carregando tenant...');

      // Tentar detectar tenant pelo domínio
      const hostname = window.location.hostname;
      let domain = hostname;

      // Em desenvolvimento, usar slug da URL ou default
      if (hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname.includes('lovableproject.com')) {
        const urlParams = new URLSearchParams(window.location.search);
        const tenantSlug = urlParams.get('tenant') || 'agiluniformes';

        console.log('Buscando empresa pelo slug:', tenantSlug);

        const { data: empresaBySlug, error: slugError } = await supabase
          .from('empresas')
          .select('*')
          .eq('slug', tenantSlug)
          .eq('status', 'ativo')
          .maybeSingle();

        console.log('Resultado busca por slug:', { empresaBySlug, slugError });

        if (slugError) {
          console.warn('Erro ao buscar empresa, usando dados padrão:', slugError);
          // Se houver erro, usar branding padrão
          setBranding({
            primary: '#111111',
            accent: '#FF6A00',
            bg: '#FFFFFF',
            text: '#000000',
          });
          setLoading(false);
          return;
        }

        if (empresaBySlug) {
          console.log('Empresa encontrada:', empresaBySlug.nome);
          setTenant(empresaBySlug as any);
          setBranding({
            primary: empresaBySlug.cor_primary || '#111111',
            accent: empresaBySlug.cor_accent || '#FF6A00',
            bg: empresaBySlug.cor_bg || '#FFFFFF',
            text: empresaBySlug.cor_text || '#000000',
            logo: empresaBySlug.logo_url || undefined,
          });
          setLoading(false);
          return;
        } else {
          // Se não encontrar empresa, usar branding padrão
          console.log('Empresa não encontrada, usando branding padrão');
          setBranding({
            primary: '#111111',
            accent: '#FF6A00',
            bg: '#FFFFFF',
            text: '#000000',
          });
          setLoading(false);
          return;
        }
      }

      // Produção: buscar por domínio
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('dominio', domain)
        .eq('status', 'ativo')
        .maybeSingle();

      if (empresaError) {
        console.warn('Erro ao buscar por domínio, usando branding padrão:', empresaError);
        setBranding({
          primary: '#111111',
          accent: '#FF6A00',
          bg: '#FFFFFF',
          text: '#000000',
        });
        setLoading(false);
        return;
      }

      if (!empresa) {
        // Usar branding padrão se não encontrar
        console.log('Nenhuma empresa encontrada, usando branding padrão');
        setBranding({
          primary: '#111111',
          accent: '#FF6A00',
          bg: '#FFFFFF',
          text: '#000000',
        });
      } else {
        setTenant(empresa as any);
        setBranding({
          primary: empresa.cor_primary || '#111111',
          accent: empresa.cor_accent || '#FF6A00',
          bg: empresa.cor_bg || '#FFFFFF',
          text: empresa.cor_text || '#000000',
          logo: empresa.logo_url || undefined,
        });
      }
    } catch (err: any) {
      console.error('Erro ao carregar tenant:', err);
      setError(err.message);
      // Usar branding padrão em caso de erro
      setBranding({
        primary: '#111111',
        accent: '#FF6A00',
        bg: '#FFFFFF',
        text: '#000000',
      });
    } finally {
      setLoading(false);
    }
  };

  const switchTenant = async (slug: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'ativo')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Empresa não encontrada');

      setTenant(data as any);
      setBranding({
        primary: data.cor_primary || '#111111',
        accent: data.cor_accent || '#FF6A00',
        bg: data.cor_bg || '#FFFFFF',
        text: data.cor_text || '#000000',
        logo: data.logo_url || undefined,
      });

      // Atualizar URL com tenant
      const url = new URL(window.location.href);
      url.searchParams.set('tenant', slug);
      window.history.pushState({}, '', url.toString());
    } catch (err: any) {
      console.error('Erro ao trocar tenant:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    tenant,
    branding,
    loading,
    error,
    switchTenant,
    reload: loadTenant,
  };
};
