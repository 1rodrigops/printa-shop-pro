import AdminNavbar from "@/components/AdminNavbar";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, TrendingUp, Truck, CheckCircle, DollarSign } from "lucide-react";
import PedidosTable from "@/components/vendas/PedidosTable";

const Pedidos = () => {
  const { data: stats } = useQuery({
    queryKey: ["vendas-stats"],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("*");

      const totalVendas = orders?.reduce((acc, order) => acc + Number(order.total_price), 0) || 0;
      const emAberto = orders?.filter(o => o.status === 'pending').length || 0;
      const emProducao = orders?.filter(o => o.status === 'processing').length || 0;
      const enviados = orders?.filter(o => o.status === 'completed').length || 0;
      const finalizados = orders?.filter(o => o.status === 'completed').length || 0;

      return { totalVendas, emAberto, emProducao, enviados, finalizados };
    },
  });

  const statsCards = [
    { 
      title: "Pedidos em Aberto", 
      value: stats?.emAberto || 0, 
      icon: Package, 
      color: "text-blue-600" 
    },
    { 
      title: "Em Produção", 
      value: stats?.emProducao || 0, 
      icon: TrendingUp, 
      color: "text-orange-600" 
    },
    { 
      title: "Enviados", 
      value: stats?.enviados || 0, 
      icon: Truck, 
      color: "text-purple-600" 
    },
    { 
      title: "Finalizados", 
      value: stats?.finalizados || 0, 
      icon: CheckCircle, 
      color: "text-green-600" 
    },
    { 
      title: "Total de Vendas", 
      value: `R$ ${stats?.totalVendas.toFixed(2) || "0,00"}`, 
      icon: DollarSign, 
      color: "text-emerald-600" 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">📦 Pedidos</h1>
          <p className="text-muted-foreground">Todos os pedidos ativos e em andamento</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <PedidosTable />
      </div>
    </div>
  );
};

export default Pedidos;
