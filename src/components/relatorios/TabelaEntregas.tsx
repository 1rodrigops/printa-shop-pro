import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";

interface TabelaEntregasProps {
  dateRange: { start: string; end: string };
}

const TabelaEntregas = ({ dateRange }: TabelaEntregasProps) => {
  const { data: logs } = useQuery({
    queryKey: ["tabela-entregas", dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("quality_control_log")
        .select(`
          *,
          orders:pedido_id (
            id,
            status
          )
        `)
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end)
        .not("rastreio", "is", null)
        .order("data_hora", { ascending: false })
        .limit(50);
      
      return data;
    },
  });

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🚚 Logs de Entregas</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Transportadora</TableHead>
            <TableHead>Código de Rastreio</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cliente Notificado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs?.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">
                #{log.orders?.id?.slice(0, 8)}
              </TableCell>
              <TableCell>{log.transportadora || "Não especificado"}</TableCell>
              <TableCell className="font-mono text-sm">{log.rastreio}</TableCell>
              <TableCell>
                {log.data_hora && format(parseISO(log.data_hora), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  log.orders?.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {log.orders?.status === "completed" ? "Entregue" : "Em Trânsito"}
                </span>
              </TableCell>
              <TableCell>
                {log.mensagem_enviada ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default TabelaEntregas;
