import { useState, useEffect } from "react";
import AdminNavbar from "@/components/AdminNavbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LogsWhatsApp = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [logSelecionado, setLogSelecionado] = useState<any | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    sucesso: 0,
    falha: 0,
    automaticasHoje: 0,
  });

  useEffect(() => {
    if (role === "superadmin" || role === "admin") {
      loadLogs();
      loadStats();

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadLogs();
        loadStats();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [role]);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_message_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar logs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: allLogs, error } = await supabase
        .from("whatsapp_message_logs")
        .select("*");

      if (error) throw error;

      const total = allLogs?.length || 0;
      const sucesso = allLogs?.filter(log => log.status_http?.startsWith("2")).length || 0;
      const falha = total - sucesso;

      const hoje = new Date().toISOString().split('T')[0];
      const automaticasHoje = allLogs?.filter(log => 
        log.tipo_envio === "automatico" && 
        log.created_at?.startsWith(hoje)
      ).length || 0;

      setStats({ total, sucesso, falha, automaticasHoje });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const exportarCSV = () => {
    const headers = ["Data/Hora", "Pedido", "Número", "Etapa", "Tipo", "Status", "Resposta"];
    const rows = logsFiltrados.map(log => [
      new Date(log.created_at).toLocaleString("pt-BR"),
      log.pedido_id || "-",
      log.numero,
      log.evento,
      log.tipo_envio,
      log.status_http || "Pendente",
      log.resposta_api || "-"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `logs-whatsapp-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "CSV exportado",
      description: "O arquivo foi baixado com sucesso.",
    });
  };

  const getStatusBadge = (statusHttp: string | null) => {
    if (!statusHttp) return <Badge variant="secondary">⏳ Em Fila</Badge>;
    
    if (statusHttp.startsWith("2")) {
      return <Badge className="bg-green-600">✅ Sucesso</Badge>;
    } else {
      return <Badge variant="destructive">❌ Falha</Badge>;
    }
  };

  const logsFiltrados = logs.filter(log => {
    const busca = filtro.toLowerCase();
    return (
      log.numero?.toLowerCase().includes(busca) ||
      log.pedido_id?.toLowerCase().includes(busca) ||
      log.evento?.toLowerCase().includes(busca)
    );
  });

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== "superadmin" && role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Alert variant="destructive">
            <AlertDescription>
              🚫 Acesso negado. Esta área é restrita ao SuperAdmin e Admin.
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
              <BreadcrumbPage>Logs de Mensagens WhatsApp</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">🧾 Histórico de Mensagens WhatsApp</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                📬 Total de Mensagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ✅ Enviadas com Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.sucesso}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ❌ Falhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.falha}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ⚙️ Automáticas Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.automaticasHoje}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="🔍 Filtrar por pedido, número ou etapa..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={exportarCSV}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Tipo de Envio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhum log encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      logsFiltrados.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {new Date(log.created_at).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            {log.pedido_id ? (
                              <span className="font-medium text-primary">{log.pedido_id}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{log.numero}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.evento}</Badge>
                          </TableCell>
                          <TableCell>
                            {log.tipo_envio === "automatico" ? "⚙️ Automático" : "👤 Manual"}
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status_http)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLogSelecionado(log)}
                            >
                              👁️ Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log Detail Dialog */}
      <Dialog open={!!logSelecionado} onOpenChange={() => setLogSelecionado(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>📋 Detalhes do Log</DialogTitle>
            <DialogDescription>
              Informações completas sobre o envio da mensagem
            </DialogDescription>
          </DialogHeader>
          {logSelecionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pedido</p>
                  <p className="text-base font-semibold">{logSelecionado.pedido_id || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número</p>
                  <p className="text-base font-mono">{logSelecionado.numero}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Evento</p>
                  <p className="text-base">{logSelecionado.evento}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Envio</p>
                  <p className="text-base">{logSelecionado.tipo_envio}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status HTTP</p>
                  <p className="text-base font-mono">{logSelecionado.status_http || "Pendente"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tempo de Envio</p>
                  <p className="text-base">{logSelecionado.tempo_envio_ms ? `${logSelecionado.tempo_envio_ms}ms` : "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Payload</p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(logSelecionado.payload, null, 2)}
                </pre>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Resposta da API</p>
                <p className="bg-gray-100 p-3 rounded text-sm">
                  {logSelecionado.resposta_api || "Sem resposta"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogsWhatsApp;