import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Loader2, Building2, Plus, ArrowRight } from "lucide-react";

interface Empresa {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  descricao: string | null;
  created_at: string;
}

const SuperDashboard = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && role !== "superadmin") {
      toast.error("Acesso negado. Apenas SuperAdmins podem acessar esta página.");
      navigate("/admin");
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    if (role === "superadmin") {
      carregarEmpresas();
    }
  }, [role]);

  const carregarEmpresas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("nome");

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar empresas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading || role !== "superadmin") {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Painel do Super Administrador
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie todas as empresas do Grupo Ágil
            </p>
          </div>
          <Button
            onClick={() => navigate("/admin/empresas")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Nova Empresa
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : empresas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma empresa cadastrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comece cadastrando a primeira empresa do grupo
              </p>
              <Button onClick={() => navigate("/admin/empresas")}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeira Empresa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {empresas.map((empresa) => (
              <Card key={empresa.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  {empresa.logo_url ? (
                    <div className="w-full h-32 mb-4 flex items-center justify-center bg-gray-50 rounded-lg">
                      <img
                        src={empresa.logo_url}
                        alt={empresa.nome}
                        className="max-w-full max-h-full object-contain p-4"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 mb-4 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg">
                      <Building2 className="h-16 w-16 text-orange-500" />
                    </div>
                  )}
                  <CardTitle className="text-xl">{empresa.nome}</CardTitle>
                  <CardDescription>
                    {empresa.descricao || "Empresa do Grupo Ágil"}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    onClick={() => navigate(`/admin/${empresa.slug}/modulos`)}
                    className="w-full gap-2"
                    variant="default"
                  >
                    Acessar Painel da Empresa
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SuperDashboard;
