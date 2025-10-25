import AdminNavbar from "@/components/AdminNavbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, Settings } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { IdentidadeVisual } from "@/components/configuracoes/IdentidadeVisual";
import { Localizacao } from "@/components/configuracoes/Localizacao";
import { ParametrosProducao } from "@/components/configuracoes/ParametrosProducao";

const ConfiguracoesGerais = () => {
  const { role, loading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== "superadmin") {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Alert variant="destructive">
            <AlertDescription>
              🚫 Acesso negado. Esta área é restrita ao SuperAdmin.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
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
              <BreadcrumbLink href="/admin/utilidades">Utilidades</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Configurações</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">⚙️ Configurações Gerais</h1>
        </div>

        <div className="space-y-6">
          <IdentidadeVisual />
          <Localizacao />
          <ParametrosProducao />
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesGerais;