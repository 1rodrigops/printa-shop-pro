import AdminNavbar from "@/components/AdminNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Save, FileText, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const Utilidades = () => {
  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Utilidades</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link to="/admin/utilidades/configuracoes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Configurações
                </CardTitle>
                <CardDescription>Configurações do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Ajustes gerais do sistema e parâmetros de produção</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/admin/utilidades/backup">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5 text-primary" />
                  Backup
                </CardTitle>
                <CardDescription>Backup e restauração</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Gerar backups e restaurar dados do sistema</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/admin/utilidades/logs">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Logs do Sistema
                </CardTitle>
                <CardDescription>Visualize logs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Registros de atividades e erros do sistema</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/utilidades/api-whatsapp">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  API WhatsApp
                </CardTitle>
                <CardDescription>Configurar API</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Configure a integração com WuzAPI ou Evolution API</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Utilidades;
