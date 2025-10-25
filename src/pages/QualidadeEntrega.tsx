import AdminNavbar from "@/components/AdminNavbar";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Package, Clock, Truck } from "lucide-react";
import QualidadeTable from "@/components/qualidade/QualidadeTable";

const QualidadeEntrega = () => {
  const { data: stats } = useQuery({
    queryKey: ["qualidade-stats"],
    queryFn: async () => {
      // Pedidos em embalagem (aguardando inspeção)
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("etapa_producao", "Embalagem");

      // Logs de qualidade
      const { data: logs } = await supabase
        .from("quality_control_log")
        .select("*")
        .gte("data_hora", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const aguardandoInspecao = orders?.filter(o => 
        !logs?.some(l => l.pedido_id === o.id)
      ).length || 0;

      const aprovados = logs?.filter(l => l.aprovado).length || 0;
      const reprovados = logs?.filter(l => !l.aprovado).length || 0;
      const despachadosHoje = logs?.filter(l => l.rastreio && l.mensagem_enviada).length || 0;

      // Calcular tempo médio de inspeção (em minutos)
      const tempos = logs?.map(l => {
        const order = orders?.find(o => o.id === l.pedido_id);
        if (!order) return 0;
        const diff = new Date(l.data_hora).getTime() - new Date(order.updated_at).getTime();
        return Math.round(diff / 1000 / 60);
      }).filter(t => t > 0 && t < 120) || [];

      const tempoMedio = tempos.length > 0 
        ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
        : 0;

      return { aguardandoInspecao, aprovados, reprovados, despachadosHoje, tempoMedio };
    },
  });

  const statsCards = [
    { 
      title: "Aguardando Inspeção", 
      value: stats?.aguardandoInspecao || 0, 
      icon: Package, 
      color: "text-orange-600" 
    },
    { 
      title: "Aprovados", 
      value: stats?.aprovados || 0, 
      icon: CheckCircle, 
      color: "text-green-600" 
    },
    { 
      title: "Reprovados", 
      value: stats?.reprovados || 0, 
      icon: XCircle, 
      color: "text-red-600" 
    },
    { 
      title: "Despachados Hoje", 
      value: stats?.despachadosHoje || 0, 
      icon: Truck, 
      color: "text-blue-600" 
    },
    { 
      title: "Tempo Médio", 
      value: `${stats?.tempoMedio || 0}min`, 
      icon: Clock, 
      color: "text-purple-600" 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🔍 Controle de Qualidade e Entrega</h1>
          <p className="text-muted-foreground">
            Inspeção final, checklist de conformidade e geração de rastreamento
          </p>
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

        <QualidadeTable />
      </div>
    </div>
  );
};

export default QualidadeEntrega;
