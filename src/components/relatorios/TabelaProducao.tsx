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

interface TabelaProducaoProps {
  dateRange: { start: string; end: string };
}

const TabelaProducao = ({ dateRange }: TabelaProducaoProps) => {
  const { data: logs } = useQuery({
    queryKey: ["tabela-producao", dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("production_log")
        .select(`
          *,
          orders:pedido_id (
            customer_name,
            id
          )
        `)
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end)
        .order("data_hora", { ascending: false })
        .limit(50);
      
      return data;
    },
  });

  const formatTempo = (minutos: number | null) => {
    if (!minutos) return "-";
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h${mins}m` : `${mins}m`;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🧵 Logs de Produção</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Operador</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Tempo</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs?.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">
                #{log.orders?.id?.slice(0, 8)}
              </TableCell>
              <TableCell>{log.orders?.customer_name}</TableCell>
              <TableCell>
                <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                  {log.etapa}
                </span>
              </TableCell>
              <TableCell>{log.operador?.split("@")[0]}</TableCell>
              <TableCell>
                {log.data_hora && format(parseISO(log.data_hora), "dd/MM/yyyy HH:mm")}
              </TableCell>
              <TableCell>{formatTempo(log.tempo_etapa_minutos)}</TableCell>
              <TableCell>
                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Concluído
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default TabelaProducao;
