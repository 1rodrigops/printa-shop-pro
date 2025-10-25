import AdminNavbar from "@/components/AdminNavbar";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Scissors, Palette, Wrench, Package } from "lucide-react";
import KanbanProducao from "@/components/producao/KanbanProducao";

const ProducaoInterna = () => {
  const { data: stats } = useQuery({
    queryKey: ["producao-stats"],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "processing");

      const corte = orders?.filter(o => o.etapa_producao === 'Corte').length || 0;
      const estampa = orders?.filter(o => o.etapa_producao === 'Estampa').length || 0;
      const acabamento = orders?.filter(o => o.etapa_producao === 'Acabamento').length || 0;
      const embalagem = orders?.filter(o => o.etapa_producao === 'Embalagem').length || 0;

      // Calcular tempo médio
      const { data: logs } = await supabase
        .from("production_log")
        .select("tempo_etapa_minutos")
        .not("tempo_etapa_minutos", "is", null)
        .gte("data_hora", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const tempoMedio = logs && logs.length > 0
        ? Math.round(logs.reduce((acc, log) => acc + (log.tempo_etapa_minutos || 0), 0) / logs.length)
        : 0;

      return { corte, estampa, acabamento, embalagem, tempoMedio };
    },
  });

  const statsCards = [
    { 
      title: "✂️ Corte", 
      value: stats?.corte || 0, 
      icon: Scissors, 
      color: "text-blue-400 bg-blue-50" 
    },
    { 
      title: "🎨 Estampa", 
      value: stats?.estampa || 0, 
      icon: Palette, 
      color: "text-orange-500 bg-orange-50" 
    },
    { 
      title: "🧵 Acabamento", 
      value: stats?.acabamento || 0, 
      icon: Wrench, 
      color: "text-purple-500 bg-purple-50" 
    },
    { 
      title: "📦 Embalagem", 
      value: stats?.embalagem || 0, 
      icon: Package, 
      color: "text-green-500 bg-green-50" 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🧵 Produção Interna</h1>
          <p className="text-muted-foreground">Painel de controle de estamparia e produção</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {/* Card de Tempo Médio */}
          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg text-gray-600 bg-gray-50">
                <span className="text-2xl">⏱️</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{stats?.tempoMedio || 0}min</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Kanban de Produção */}
        <KanbanProducao />
      </div>
    </div>
  );
};

export default ProducaoInterna;
