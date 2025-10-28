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
  metadata: Record<string, any>;
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

      // Tentar detectar tenant pelo domínio
      const hostname = window.location.hostname;
      let domain = hostname;

      // Em desenvolvimento, usar slug da URL ou default
      if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
        const urlParams = new URLSearchParams(window.location.search);
        const tenantSlug = urlParams.get('tenant') || 'agiluniformes';

        const { data: empresaBySlug, error: slugError } = await supabase
          .from('empresas')
          .select('*')
          .eq('slug', tenantSlug)
          .eq('status', 'ativo')
          .maybeSingle();

        if (slugError) throw slugError;

        if (empresaBySlug) {
          setTenant(empresaBySlug);
          setBranding({
            primary: empresaBySlug.cor_primary,
            accent: empresaBySlug.cor_accent,
            bg: empresaBySlug.cor_bg,
            text: empresaBySlug.cor_text,
            logo: empresaBySlug.logo_url || undefined,
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

      if (empresaError) throw empresaError;

      if (!empresa) {
        // Fallback para AgilUniformes se não encontrar
        const { data: fallback } = await supabase
          .from('empresas')
          .select('*')
          .eq('slug', 'agiluniformes')
          .eq('status', 'ativo')
          .maybeSingle();

        if (fallback) {
          setTenant(fallback);
          setBranding({
            primary: fallback.cor_primary,
            accent: fallback.cor_accent,
            bg: fallback.cor_bg,
            text: fallback.cor_text,
            logo: fallback.logo_url || undefined,
          });
        } else {
          throw new Error('Empresa não encontrada');
        }
      } else {
        setTenant(empresa);
        setBranding({
          primary: empresa.cor_primary,
          accent: empresa.cor_accent,
          bg: empresa.cor_bg,
          text: empresa.cor_text,
          logo: empresa.logo_url || undefined,
        });
      }
    } catch (err: any) {
      console.error('Erro ao carregar tenant:', err);
      setError(err.message);
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

      setTenant(data);
      setBranding({
        primary: data.cor_primary,
        accent: data.cor_accent,
        bg: data.cor_bg,
        text: data.cor_text,
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
