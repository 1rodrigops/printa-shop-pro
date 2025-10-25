import AdminNavbar from "@/components/AdminNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, Save, Download, Upload } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const BackupSistema = () => {
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
              <BreadcrumbPage>Backup</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-3 mb-6">
          <Save className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Backup e Restauração</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>💾 Gerar Backup</CardTitle>
              <CardDescription>
                Crie uma cópia de segurança completa ou parcial da base de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Backup Completo
                </Button>
                <Button variant="outline">
                  <Save className="mr-2 h-4 w-4" />
                  Backup Parcial
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⬇️ Download de Backups</CardTitle>
              <CardDescription>Baixe backups anteriores</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Fazer Download (.sql ou .zip)
              </Button>
              <p className="text-sm text-muted-foreground mt-4">Em desenvolvimento...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔄 Restaurar Backup</CardTitle>
              <CardDescription>
                ⚠️ Atenção: Esta operação substituirá os dados atuais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">
                <Upload className="mr-2 h-4 w-4" />
                Restaurar Backup
              </Button>
              <p className="text-sm text-muted-foreground mt-4">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BackupSistema;