import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Loader2, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Empresa {
  id: string;
  nome: string;
  slug: string;
}

interface Modulo {
  id: string;
  empresa_id: string;
  modulo: string;
  ativo: boolean;
}

const MODULOS_DISPONIVEIS = [
  { value: "cadastro", label: "Cadastro" },
  { value: "vendas", label: "Vendas" },
  { value: "financeiro", label: "Financeiro" },
  { value: "estoque", label: "Estoque" },
  { value: "relatorios", label: "Relatórios" },
  { value: "utilidades", label: "Utilidades" },
  { value: "meus_pedidos", label: "Meus Pedidos" }
];

const ModulosPorEmpresa = () => {
  const { empresaSlug } = useParams<{ empresaSlug: string }>();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!roleLoading && role !== "superadmin") {
      toast.error("Acesso negado. Apenas SuperAdmins podem acessar esta página.");
      navigate("/admin");
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    if (role === "superadmin" && empresaSlug) {
      carregarEmpresa();
    }
  }, [role, empresaSlug]);

  const carregarEmpresa = async () => {
    setLoading(true);
    try {
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresas")
        .select("id, nome, slug")
        .eq("slug", empresaSlug)
        .maybeSingle();

      if (empresaError) throw empresaError;
      if (!empresaData) {
        toast.error("Empresa não encontrada");
        navigate("/admin/super-dashboard");
        return;
      }

      setEmpresa(empresaData);
      await carregarModulos(empresaData.id);
    } catch (error: any) {
      toast.error("Erro ao carregar empresa: " + error.message);
      navigate("/admin/super-dashboard");
    } finally {
      setLoading(false);
    }
  };

  const carregarModulos = async (empresaId: string) => {
    try {
      const { data, error } = await supabase
        .from("empresa_modulos")
        .select("*")
        .eq("empresa_id", empresaId);

      if (error) throw error;

      const modulosExistentes = data || [];
      const todosModulos: Modulo[] = MODULOS_DISPONIVEIS.map(mod => {
        const existente = modulosExistentes.find(m => m.modulo === mod.value);
        return existente || {
          id: "",
          empresa_id: empresaId,
          modulo: mod.value,
          ativo: false
        };
      });

      setModulos(todosModulos);
    } catch (error: any) {
      toast.error("Erro ao carregar módulos: " + error.message);
    }
  };

  const toggleModulo = async (modulo: Modulo) => {
    if (!empresa) return;

    setSaving(true);
    try {
      const novoEstado = !modulo.ativo;

      if (modulo.id) {
        const { error } = await supabase
          .from("empresa_modulos")
          .update({ ativo: novoEstado, updated_at: new Date().toISOString() })
          .eq("id", modulo.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("empresa_modulos")
          .insert({
            empresa_id: empresa.id,
            modulo: modulo.modulo,
            ativo: novoEstado
          });

        if (error) throw error;
      }

      await carregarModulos(empresa.id);
      toast.success(`Módulo ${novoEstado ? "ativado" : "desativado"} com sucesso!`);
    } catch (error: any) {
      toast.error("Erro ao atualizar módulo: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading || role !== "superadmin" || loading) {
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/super-dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Módulos - {empresa?.nome}
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure quais módulos esta empresa pode acessar no sistema
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Módulos Disponíveis</CardTitle>
            <CardDescription>
              Ative ou desative os módulos que {empresa?.nome} pode acessar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modulos.map((modulo) => {
                  const moduloInfo = MODULOS_DISPONIVEIS.find(m => m.value === modulo.modulo);
                  return (
                    <TableRow key={modulo.modulo}>
                      <TableCell className="font-medium">
                        {moduloInfo?.label || modulo.modulo}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            modulo.ativo
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {modulo.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={modulo.ativo}
                          onCheckedChange={() => toggleModulo(modulo)}
                          disabled={saving}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ModulosPorEmpresa;
