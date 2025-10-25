import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "@/components/AdminNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminActivity } from "@/hooks/useAdminActivity";
import { Shield, User, UserCog, RotateCcw, AlertTriangle } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Permission = {
  id: string;
  role: string;
  module: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
};

type RoleConfig = {
  name: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  editable: boolean;
};

const roles: RoleConfig[] = [
  { name: "superadmin", label: "SuperAdmin", icon: Shield, color: "text-orange-600", bgColor: "bg-orange-50 border-orange-200", editable: false },
  { name: "admin", label: "Admin", icon: UserCog, color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200", editable: true },
  { name: "cliente", label: "Cliente", icon: User, color: "text-green-600", bgColor: "bg-green-50 border-green-200", editable: true },
];

const modules = [
  { key: "cadastro_clientes", label: "Cadastro de Clientes" },
  { key: "cadastro_usuarios", label: "Cadastro de Usuários" },
  { key: "vendas", label: "Vendas" },
  { key: "financeiro", label: "Financeiro" },
  { key: "estoque", label: "Estoque" },
  { key: "relatorios", label: "Relatórios" },
  { key: "utilidades", label: "Utilidades" },
  { key: "meus_pedidos", label: "Meus Pedidos" },
];

const Permissoes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();
  const { logActivity } = useAdminActivity();
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && role !== "superadmin") {
      toast({
        title: "Acesso Negado",
        description: "Apenas SuperAdmin pode acessar esta página.",
        variant: "destructive",
      });
      navigate("/admin");
    }
  }, [role, roleLoading, navigate, toast]);

  useEffect(() => {
    fetchPermissions();
  }, [selectedRole]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("permissions_matrix")
        .select("*")
        .eq("role", selectedRole as "admin" | "cliente");

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as permissões.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (
    moduleKey: string,
    permissionType: "can_view" | "can_edit" | "can_delete" | "can_export",
    value: boolean
  ) => {
    try {
      const permission = permissions.find((p) => p.module === moduleKey);
      
      if (permission) {
        const { error } = await supabase
          .from("permissions_matrix")
          .update({ [permissionType]: value })
          .eq("id", permission.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("permissions_matrix")
          .insert({
            role: selectedRole as "admin" | "cliente",
            module: moduleKey,
            [permissionType]: value,
          });

        if (error) throw error;
      }

      await fetchPermissions();

      const permissionLabel = {
        can_view: "Visualizar",
        can_edit: "Editar",
        can_delete: "Excluir",
        can_export: "Exportar",
      }[permissionType];

      const moduleLabel = modules.find((m) => m.key === moduleKey)?.label || moduleKey;
      const roleLabel = roles.find((r) => r.name === selectedRole)?.label || selectedRole;

      await logActivity(
        "permissao_edit",
        `Alterou permissão de ${roleLabel} no módulo ${moduleLabel} (${permissionLabel} → ${value ? "Ativado" : "Desativado"})`,
        { role: selectedRole, module: moduleKey, permission: permissionType, value }
      );

      toast({
        title: "Permissão atualizada",
        description: `Permissão atualizada com sucesso para ${roleLabel} (${moduleLabel} → ${permissionLabel}: ${value ? "Ativado" : "Desativado"}).`,
      });
    } catch (error) {
      console.error("Erro ao atualizar permissão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a permissão.",
        variant: "destructive",
      });
    }
  };

  const restoreDefaults = async () => {
    try {
      // Deletar todas as permissões da role selecionada
      const { error: deleteError } = await supabase
        .from("permissions_matrix")
        .delete()
        .eq("role", selectedRole as "admin" | "cliente");

      if (deleteError) throw deleteError;

      // Recriar permissões padrão
      type PermissionInsert = {
        role: "admin" | "cliente";
        module: string;
        can_view: boolean;
        can_edit: boolean;
        can_delete: boolean;
        can_export: boolean;
      };

      const defaultPermissions: PermissionInsert[] = selectedRole === "admin"
        ? [
            { role: "admin", module: "cadastro_clientes", can_view: true, can_edit: true, can_delete: false, can_export: true },
            { role: "admin", module: "cadastro_usuarios", can_view: false, can_edit: false, can_delete: false, can_export: false },
            { role: "admin", module: "vendas", can_view: true, can_edit: true, can_delete: false, can_export: true },
            { role: "admin", module: "financeiro", can_view: false, can_edit: false, can_delete: false, can_export: false },
            { role: "admin", module: "estoque", can_view: true, can_edit: true, can_delete: false, can_export: true },
            { role: "admin", module: "relatorios", can_view: true, can_edit: false, can_delete: false, can_export: true },
            { role: "admin", module: "utilidades", can_view: true, can_edit: true, can_delete: true, can_export: true },
            { role: "admin", module: "meus_pedidos", can_view: true, can_edit: false, can_delete: false, can_export: false },
          ]
        : [
            { role: "cliente", module: "cadastro_clientes", can_view: false, can_edit: false, can_delete: false, can_export: false },
            { role: "cliente", module: "cadastro_usuarios", can_view: false, can_edit: false, can_delete: false, can_export: false },
            { role: "cliente", module: "vendas", can_view: false, can_edit: false, can_delete: false, can_export: false },
            { role: "cliente", module: "financeiro", can_view: false, can_edit: false, can_delete: false, can_export: false },
            { role: "cliente", module: "estoque", can_view: false, can_edit: false, can_delete: false, can_export: false },
            { role: "cliente", module: "relatorios", can_view: false, can_edit: false, can_delete: false, can_export: false },
            { role: "cliente", module: "utilidades", can_view: false, can_edit: false, can_delete: false, can_export: false },
            { role: "cliente", module: "meus_pedidos", can_view: true, can_edit: false, can_delete: false, can_export: false },
          ];

      const { error: insertError } = await supabase
        .from("permissions_matrix")
        .insert(defaultPermissions);

      if (insertError) throw insertError;

      await fetchPermissions();
      
      const roleLabel = roles.find((r) => r.name === selectedRole)?.label || selectedRole;
      
      await logActivity(
        "permissao_reset",
        `Restaurou permissões padrão para ${roleLabel}`,
        { role: selectedRole }
      );

      toast({
        title: "Permissões restauradas",
        description: `Permissões padrão restauradas com sucesso para ${roleLabel}.`,
      });
    } catch (error) {
      console.error("Erro ao restaurar permissões:", error);
      toast({
        title: "Erro",
        description: "Não foi possível restaurar as permissões padrão.",
        variant: "destructive",
      });
    }
  };

  const getPermissionValue = (moduleKey: string, permissionType: keyof Permission): boolean => {
    const permission = permissions.find((p) => p.module === moduleKey);
    return permission ? Boolean(permission[permissionType]) : false;
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (role !== "superadmin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/cadastro">Cadastro</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Permissões</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Controle de Permissões</h1>
          <Button onClick={restoreDefaults} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
        </div>

        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            ⚠️ As permissões do SuperAdmin não podem ser alteradas.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {roles.map((roleConfig) => {
            const Icon = roleConfig.icon;
            const isSelected = selectedRole === roleConfig.name;
            return (
              <Card
                key={roleConfig.name}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? `${roleConfig.bgColor} border-2` : ""
                } ${!roleConfig.editable ? "opacity-60" : ""}`}
                onClick={() => roleConfig.editable && setSelectedRole(roleConfig.name)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className={`h-8 w-8 ${roleConfig.color}`} />
                    <div>
                      <CardTitle>{roleConfig.label}</CardTitle>
                      <CardDescription>
                        {roleConfig.editable ? "Clique para editar" : "Não editável"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Permissões - {roles.find((r) => r.name === selectedRole)?.label}</CardTitle>
                <CardDescription>Configure o acesso aos módulos do sistema</CardDescription>
              </div>
              <Badge variant="outline" className="text-base">
                {modules.length} módulos
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Módulo</th>
                    <th className="text-center py-3 px-4 font-semibold">Visualizar</th>
                    <th className="text-center py-3 px-4 font-semibold">Editar</th>
                    <th className="text-center py-3 px-4 font-semibold">Excluir</th>
                    <th className="text-center py-3 px-4 font-semibold">Exportar</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module) => (
                    <tr key={module.key} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{module.label}</td>
                      <td className="text-center py-3 px-4">
                        <Checkbox
                          checked={getPermissionValue(module.key, "can_view")}
                          onCheckedChange={(checked) =>
                            updatePermission(module.key, "can_view", Boolean(checked))
                          }
                        />
                      </td>
                      <td className="text-center py-3 px-4">
                        <Checkbox
                          checked={getPermissionValue(module.key, "can_edit")}
                          onCheckedChange={(checked) =>
                            updatePermission(module.key, "can_edit", Boolean(checked))
                          }
                        />
                      </td>
                      <td className="text-center py-3 px-4">
                        <Checkbox
                          checked={getPermissionValue(module.key, "can_delete")}
                          onCheckedChange={(checked) =>
                            updatePermission(module.key, "can_delete", Boolean(checked))
                          }
                        />
                      </td>
                      <td className="text-center py-3 px-4">
                        <Checkbox
                          checked={getPermissionValue(module.key, "can_export")}
                          onCheckedChange={(checked) =>
                            updatePermission(module.key, "can_export", Boolean(checked))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Permissoes;
