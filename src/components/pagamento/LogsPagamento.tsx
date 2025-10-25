import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentLog {
  id: string;
  created_at: string;
  pedido_id: string;
  metodo_pagamento: string;
  valor: number;
  status: string;
  mensagem_api: string | null;
  transaction_id: string | null;
}

const LogsPagamento = () => {
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarLogs();
  }, []);

  const carregarLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pago: "default",
      pendente: "secondary",
      cancelado: "destructive",
      rejeitado: "destructive",
    };

    const labels: Record<string, string> = {
      pago: "✅ Pago",
      pendente: "⏳ Pendente",
      cancelado: "❌ Cancelado",
      rejeitado: "❌ Rejeitado",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const exportarCSV = () => {
    const headers = ["Data/Hora", "Pedido", "Método", "Valor", "Status", "Mensagem API"];
    const rows = logs.map((log) => [
      format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      log.pedido_id?.substring(0, 8) || "-",
      log.metodo_pagamento,
      `R$ ${log.valor.toFixed(2)}`,
      log.status,
      log.mensagem_api || "-",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_pagamento_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Logs de Pagamento</CardTitle>
            <CardDescription>
              Histórico completo de todas as transações
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportarCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma transação registrada ainda
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagem API</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{log.pedido_id?.substring(0, 8) || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.metodo_pagamento}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      R$ {log.valor.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {log.mensagem_api || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LogsPagamento;