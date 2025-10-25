import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface GraficoEntregasProps {
  dateRange: { start: string; end: string };
}

const GraficoEntregas = ({ dateRange }: GraficoEntregasProps) => {
  const { data: chartData } = useQuery({
    queryKey: ["grafico-entregas", dateRange],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from("quality_control_log")
        .select("transportadora, rastreio")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end)
        .not("rastreio", "is", null);

      // Agrupar por transportadora
      const transportadoraMap = new Map<string, number>();

      logs?.forEach(log => {
        const transportadora = log.transportadora || "Não Especificado";
        transportadoraMap.set(transportadora, (transportadoraMap.get(transportadora) || 0) + 1);
      });

      return Array.from(transportadoraMap.entries()).map(([transportadora, count]) => ({
        transportadora,
        entregas: count,
      }));
    },
  });

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🚚 Entregas por Método</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="transportadora" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="entregas" fill="#3b82f6" name="Entregas Realizadas" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default GraficoEntregas;
