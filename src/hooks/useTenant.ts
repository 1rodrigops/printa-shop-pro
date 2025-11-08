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
  const [branding, setBranding] = useState<TenantBranding>({
    primary: '#111111',
    accent: '#FF6A00',
    bg: '#FFFFFF',
    text: '#000000',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Por enquanto, usar branding padrão sem buscar no banco
    console.log('Usando branding padrão');
  }, []);

  const loadTenant = async () => {
    // Função vazia por enquanto
    console.log('loadTenant chamado');
  };

  const switchTenant = async (slug: string) => {
    console.log('switchTenant chamado com:', slug);
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
