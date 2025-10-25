import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";

interface GraficoVendasProducaoProps {
  dateRange: { start: string; end: string };
}

const GraficoVendasProducao = ({ dateRange }: GraficoVendasProducaoProps) => {
  const { data: chartData } = useQuery({
    queryKey: ["grafico-vendas-producao", dateRange],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("created_at, status")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end)
        .order("created_at");

      const { data: qualityLogs } = await supabase
        .from("quality_control_log")
        .select("data_hora, rastreio")
        .gte("data_hora", dateRange.start)
        .lte("data_hora", dateRange.end);

      // Agrupar por data
      const dataMap = new Map<string, { recebidos: number; concluidos: number; entregues: number }>();

      orders?.forEach(order => {
        const date = format(parseISO(order.created_at), "dd/MM");
        const current = dataMap.get(date) || { recebidos: 0, concluidos: 0, entregues: 0 };
        current.recebidos++;
        if (order.status === "processing" || order.status === "completed") {
          current.concluidos++;
        }
        dataMap.set(date, current);
      });

      qualityLogs?.forEach(log => {
        if (log.rastreio) {
          const date = format(parseISO(log.data_hora), "dd/MM");
          const current = dataMap.get(date) || { recebidos: 0, concluidos: 0, entregues: 0 };
          current.entregues++;
          dataMap.set(date, current);
        }
      });

      return Array.from(dataMap.entries()).map(([date, values]) => ({
        data: date,
        recebidos: values.recebidos,
        concluidos: values.concluidos,
        entregues: values.entregues,
      }));
    },
  });

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">📦 Vendas x Produção</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="recebidos" stroke="#3b82f6" name="Pedidos Recebidos" />
          <Line type="monotone" dataKey="concluidos" stroke="#f97316" name="Produção Concluída" />
          <Line type="monotone" dataKey="entregues" stroke="#10b981" name="Entregas Finalizadas" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default GraficoVendasProducao;
