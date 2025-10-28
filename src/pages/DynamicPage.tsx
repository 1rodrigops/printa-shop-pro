import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenantContext } from "@/contexts/TenantContext";
import { PageRenderer } from "@/components/cms/PageRenderer";
import Navbar from "@/components/Navbar";

const DynamicPage = () => {
  const { slug = "/" } = useParams<{ slug?: string }>();
  const { tenant } = useTenantContext();
  const [pageContent, setPageContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      fetchPage();
    }
  }, [tenant, slug]);

  const fetchPage = async () => {
    if (!tenant) return;

    setLoading(true);
    setError(null);

    try {
      const { data: site, error: siteError } = await supabase
        .from("sites")
        .select("id")
        .eq("empresa_id", tenant.id)
        .eq("slug", "main")
        .eq("published", true)
        .maybeSingle();

      if (siteError) throw siteError;
      if (!site) {
        setError("Site não encontrado");
        setLoading(false);
        return;
      }

      const rota = slug === "home" || !slug ? "/" : `/${slug}`;

      const { data: page, error: pageError } = await supabase
        .from("paginas")
        .select("*")
        .eq("site_id", site.id)
        .eq("rota", rota)
        .eq("published", true)
        .maybeSingle();

      if (pageError) throw pageError;

      if (!page) {
        setError("Página não encontrada");
        setLoading(false);
        return;
      }

      setPageContent(page.conteudo_json);
    } catch (err: any) {
      console.error("Erro ao carregar página:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Erro</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {pageContent && <PageRenderer content={pageContent} />}
    </div>
  );
};

export default DynamicPage;
