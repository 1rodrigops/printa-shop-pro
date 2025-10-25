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
import { CheckCircle, XCircle } from "lucide-react";

interface TabelaQualidadeProps {
  dateRange: { start: string; end: string };
}

const TabelaQualidade = ({ dateRange }: TabelaQualidadeProps) => {
  const { data: logs } = useQuery({
    queryKey: ["tabela-qualidade", dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("quality_control_log")
        .select(`
          *,
          orders:pedido_id (
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

  const getChecklistStatus = (checklist: any) => {
    if (!checklist) return "0/6";
    const total = Object.keys(checklist).length;
    const approved = Object.values(checklist).filter(v => v === true).length;
    return `${approved}/${total}`;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">✅ Logs de Qualidade</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Checklist</TableHead>
            <TableHead>Fotos</TableHead>
            <TableHead>Aprovado</TableHead>
            <TableHead>Observações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs?.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">
                #{log.orders?.id?.slice(0, 8)}
              </TableCell>
              <TableCell>{log.operador?.split("@")[0]}</TableCell>
              <TableCell>{getChecklistStatus(log.checklist)}</TableCell>
              <TableCell>
                {log.fotos?.length > 0 ? `📸 ${log.fotos.length}` : "-"}
              </TableCell>
              <TableCell>
                {log.aprovado ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {log.observacoes || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default TabelaQualidade;
