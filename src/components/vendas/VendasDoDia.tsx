import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, DollarSign, Package, TrendingUp, Truck, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const VendasDoDia = () => {
  const { data: vendasHoje } = useQuery({
    queryKey: ["vendas-hoje"],
    queryFn: async () => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", hoje.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const totalVendido = data.reduce((acc, order) => acc + Number(order.total_price), 0);
      const pedidosPagos = data.filter(o => o.status !== 'pending').length;
      const emProducao = data.filter(o => o.status === 'processing').length;
      const enviados = data.filter(o => o.status === 'completed').length;
      const finalizados = data.filter(o => o.status === 'completed').length;

      return {
        pedidos: data,
        stats: {
          totalVendido,
          pedidosPagos,
          emProducao,
          enviados,
          finalizados,
        },
      };
    },
  });

  const handleFechamentoDia = () => {
    toast.success("Gerando relatório de fechamento do dia...");
    // Aqui seria a lógica de gerar PDF/CSV
  };

  const statsCards = [
    {
      title: "Total Vendido Hoje",
      value: `R$ ${vendasHoje?.stats.totalVendido.toFixed(2) || "0,00"}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Pedidos Pagos",
      value: vendasHoje?.stats.pedidosPagos || 0,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Em Produção",
      value: vendasHoje?.stats.emProducao || 0,
      icon: TrendingUp,
      color: "text-orange-600",
    },
    {
      title: "Enviados",
      value: vendasHoje?.stats.enviados || 0,
      icon: Truck,
      color: "text-purple-600",
    },
    {
      title: "Finalizados",
      value: vendasHoje?.stats.finalizados || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-5">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Botão de Fechamento */}
      <div className="flex justify-end">
        <Button onClick={handleFechamentoDia}>
          <Download className="mr-2 h-4 w-4" />
          Fechamento do Dia
        </Button>
      </div>

      {/* Tabela de Pedidos de Hoje */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendasHoje?.pedidos.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      {format(new Date(order.created_at), "HH:mm")}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>
                      Camiseta {order.shirt_size} - {order.shirt_color}
                    </TableCell>
                    <TableCell className="font-semibold">
                      R$ {Number(order.total_price).toFixed(2)}
                    </TableCell>
                    <TableCell>{order.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendasDoDia;
