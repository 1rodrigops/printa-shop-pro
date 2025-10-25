import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface GraficoQualidadeProps {
  dateRange: { start: string; end: string };
}

const GraficoQualidade = ({ dateRange }: GraficoQualidadeProps) => {
  const { data: chartData } = useQuery({
    queryKey: ["grafico-qualidade", dateRange],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from("quality_control_log")
        .select("aprovado")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

      const aprovados = logs?.filter(l => l.aprovado).length || 0;
      const reprovados = logs?.filter(l => !l.aprovado).length || 0;
      const total = logs?.length || 1;

      return [
        { name: "Aprovados", value: aprovados, percent: Math.round((aprovados / total) * 100) },
        { name: "Reprovados", value: reprovados, percent: Math.round((reprovados / total) * 100) },
      ];
    },
  });

  const COLORS = ["#10b981", "#ef4444"];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🎨 Qualidade e Reprovações</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${percent}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default GraficoQualidade;
