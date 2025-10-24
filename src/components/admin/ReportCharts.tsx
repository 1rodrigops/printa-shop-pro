import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface OrdersChartData {
  semana: string;
  criados: number;
  entregues: number;
}

interface StatusDistributionData {
  name: string;
  value: number;
  color: string;
}

interface ReportChartsProps {
  ordersData: OrdersChartData[];
  statusData: StatusDistributionData[];
}

export const ReportCharts = ({ ordersData, statusData }: ReportChartsProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Gráfico de Barras - Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Criados vs Entregues</CardTitle>
          <CardDescription>Últimas 4 semanas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="criados" fill="#F97316" name="Criados" />
              <Bar dataKey="entregues" fill="#22c55e" name="Entregues" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Pizza - Distribuição de Status */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Status</CardTitle>
          <CardDescription>Status atual dos pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
