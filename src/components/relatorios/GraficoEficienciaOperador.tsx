import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface GraficoEficienciaOperadorProps {
  dateRange: { start: string; end: string };
}

const GraficoEficienciaOperador = ({ dateRange }: GraficoEficienciaOperadorProps) => {
  const { data: chartData } = useQuery({
    queryKey: ["grafico-eficiencia-operador", dateRange],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from("production_log")
        .select("operador, tempo_etapa_minutos")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end)
        .not("operador", "is", null)
        .not("tempo_etapa_minutos", "is", null);

      // Agrupar por operador
      const operadorMap = new Map<string, { total: number; count: number }>();

      logs?.forEach(log => {
        if (!log.operador || !log.tempo_etapa_minutos) return;
        const current = operadorMap.get(log.operador) || { total: 0, count: 0 };
        current.total += log.tempo_etapa_minutos;
        current.count++;
        operadorMap.set(log.operador, current);
      });

      return Array.from(operadorMap.entries()).map(([operador, values]) => ({
        operador: operador.split("@")[0], // Pegar só o nome antes do @
        pedidos: values.count,
        tempoMedio: Math.round(values.total / values.count),
      }));
    },
  });

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🧵 Eficiência por Operador</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="operador" type="category" width={100} />
          <Tooltip />
          <Legend />
          <Bar dataKey="pedidos" fill="#3b82f6" name="Pedidos Produzidos" />
          <Bar dataKey="tempoMedio" fill="#f97316" name="Tempo Médio (min)" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default GraficoEficienciaOperador;
