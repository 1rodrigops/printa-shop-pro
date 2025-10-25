import AdminNavbar from "@/components/AdminNavbar";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, CreditCard, TrendingUp, CheckCircle, Clock, DollarSign, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RelatoriosFiltros from "@/components/relatorios/RelatoriosFiltros";
import GraficoVendasProducao from "@/components/relatorios/GraficoVendasProducao";
import GraficoEficienciaOperador from "@/components/relatorios/GraficoEficienciaOperador";
import GraficoQualidade from "@/components/relatorios/GraficoQualidade";
import GraficoEntregas from "@/components/relatorios/GraficoEntregas";
import TabelaProducao from "@/components/relatorios/TabelaProducao";
import TabelaQualidade from "@/components/relatorios/TabelaQualidade";
import TabelaEntregas from "@/components/relatorios/TabelaEntregas";
import { useState } from "react";

const RelatoriosIntegrados = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  });

  const { data: stats } = useQuery({
    queryKey: ["relatorios-stats", dateRange],
    queryFn: async () => {
      // Pedidos recebidos
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

      // Logs de produção
      const { data: productionLogs } = await supabase
        .from("production_log")
        .select("*")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

      // Logs de qualidade
      const { data: qualityLogs } = await supabase
        .from("quality_control_log")
        .select("*")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

      const pedidosRecebidos = orders?.length || 0;
      const pagamentosAprovados = orders?.filter(o => 
        o.status === "processing" || o.status === "completed"
      ).length || 0;
      const emProducao = orders?.filter(o => o.status === "processing").length || 0;
      const finalizados = qualityLogs?.filter(q => q.aprovado && q.rastreio).length || 0;
      const cancelados = orders?.filter(o => o.status === "cancelled").length || 0;

      // Calcular tempo médio total
      const temposMedios = qualityLogs?.map(q => {
        const order = orders?.find(o => o.id === q.pedido_id);
        if (!order) return 0;
        const diff = new Date(q.data_hora).getTime() - new Date(order.created_at).getTime();
        return diff / 1000 / 60 / 60; // em horas
      }).filter(t => t > 0) || [];

      const tempoMedioHoras = temposMedios.length > 0
        ? temposMedios.reduce((a, b) => a + b, 0) / temposMedios.length
        : 0;

      const faturamentoTotal = orders?.reduce((acc, order) => 
        acc + Number(order.total_price || 0), 0
      ) || 0;

      return {
        pedidosRecebidos,
        pagamentosAprovados,
        emProducao,
        finalizados,
        tempoMedioHoras: Math.round(tempoMedioHoras * 10) / 10,
        faturamentoTotal,
        cancelados,
      };
    },
  });

  const statsCards = [
    { 
      title: "Pedidos Recebidos", 
      value: stats?.pedidosRecebidos || 0, 
      icon: Package, 
      color: "text-blue-600" 
    },
    { 
      title: "Pagamentos Aprovados", 
      value: stats?.pagamentosAprovados || 0, 
      icon: CreditCard, 
      color: "text-green-600" 
    },
    { 
      title: "Em Produção", 
      value: stats?.emProducao || 0, 
      icon: TrendingUp, 
      color: "text-orange-600" 
    },
    { 
      title: "Finalizados", 
      value: stats?.finalizados || 0, 
      icon: CheckCircle, 
      color: "text-emerald-600" 
    },
    { 
      title: "Tempo Médio Total", 
      value: `${stats?.tempoMedioHoras || 0}h`, 
      icon: Clock, 
      color: "text-purple-600" 
    },
    { 
      title: "Faturamento Total", 
      value: `R$ ${stats?.faturamentoTotal.toFixed(2) || "0,00"}`, 
      icon: DollarSign, 
      color: "text-teal-600" 
    },
    { 
      title: "Cancelados", 
      value: stats?.cancelados || 0, 
      icon: XCircle, 
      color: "text-red-600" 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">📊 Relatórios Integrados</h1>
          <p className="text-muted-foreground">
            Análise completa de vendas, produção, qualidade e entregas
          </p>
        </div>

        <RelatoriosFiltros 
          onDateRangeChange={(start, end) => 
            setDateRange({ start: start.toISOString(), end: end.toISOString() })
          }
        />

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7 mb-6">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex flex-col gap-2">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color} w-fit`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <GraficoVendasProducao dateRange={dateRange} />
          <GraficoEficienciaOperador dateRange={dateRange} />
          <GraficoQualidade dateRange={dateRange} />
          <GraficoEntregas dateRange={dateRange} />
        </div>

        {/* Tabelas Detalhadas */}
        <Tabs defaultValue="producao" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="producao">🧵 Produção</TabsTrigger>
            <TabsTrigger value="qualidade">✅ Qualidade</TabsTrigger>
            <TabsTrigger value="entregas">🚚 Entregas</TabsTrigger>
          </TabsList>

          <TabsContent value="producao">
            <TabelaProducao dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="qualidade">
            <TabelaQualidade dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="entregas">
            <TabelaEntregas dateRange={dateRange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RelatoriosIntegrados;
