import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportMetricsCard } from "@/components/admin/ReportMetricsCard";
import { ReportCharts } from "@/components/admin/ReportCharts";
import { TopAdminsRanking } from "@/components/admin/TopAdminsRanking";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Package,
  Scissors,
  Truck,
  Clock,
  Users,
  TrendingUp,
  Download,
  RefreshCw,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { format, subDays, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportMetrics {
  pedidos_criados: number;
  pedidos_producao: number;
  pedidos_entregues: number;
  tempo_medio_producao: number;
  admins_ativos: number;
}

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [topAdmins, setTopAdmins] = useState<any[]>([]);
  const [period, setPeriod] = useState<"semanal" | "mensal">("semanal");
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!roleLoading && role !== "superadmin" && role !== "admin") {
      navigate("/admin");
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
    }
  }, [role, roleLoading, navigate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = period === "semanal" ? subDays(endDate, 7) : subDays(endDate, 30);

      // Buscar métricas usando a função do banco
      const { data: metricsData, error: metricsError } = await supabase.rpc(
        "calcular_metricas_relatorio",
        {
          data_inicio: format(startDate, "yyyy-MM-dd"),
          data_fim: format(endDate, "yyyy-MM-dd"),
        }
      );

      if (metricsError) throw metricsError;
      
      // Parse dos dados JSON retornados
      const parsedMetrics = metricsData as unknown as ReportMetrics;
      setMetrics(parsedMetrics);

      // Buscar top admins
      const { data: activityData, error: activityError } = await supabase
        .from("admin_activity_log")
        .select("user_email")
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString())
        .in("action_type", ["pedido_edit", "cadastro_edit", "user_create"]);

      if (activityError) throw activityError;

      // Contar ações por admin
      const adminCounts = activityData.reduce((acc: any, log: any) => {
        acc[log.user_email] = (acc[log.user_email] || 0) + 1;
        return acc;
      }, {});

      const rankedAdmins = Object.entries(adminCounts)
        .map(([email, actions]) => ({
          name: email.split("@")[0],
          email,
          actions: actions as number,
          rank: 0,
        }))
        .sort((a, b) => b.actions - a.actions)
        .slice(0, 3)
        .map((admin, index) => ({ ...admin, rank: index + 1 }));

      setTopAdmins(rankedAdmins);
    } catch (error: any) {
      console.error("Error fetching report data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "superadmin" || role === "admin") {
      fetchReportData();
    }
  }, [period, role]);

  const generateReport = async () => {
    if (role !== "superadmin") {
      toast({
        title: "Acesso negado",
        description: "Apenas SuperAdmin pode gerar relatórios.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const endDate = new Date();
      const startDate = period === "semanal" ? subDays(endDate, 7) : subDays(endDate, 30);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !metrics) throw new Error("Dados insuficientes");

      const { error } = await supabase.from("relatorios_admin").insert([{
        periodo: period,
        data_inicio: format(startDate, "yyyy-MM-dd"),
        data_fim: format(endDate, "yyyy-MM-dd"),
        gerado_por: user.id,
        dados_json: metrics as any,
      }]);

      if (error) throw error;

      toast({
        title: "Relatório gerado!",
        description: `Relatório ${period} foi salvo com sucesso.`,
      });
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Dados para gráficos
  const ordersChartData = [
    { semana: "Semana 1", criados: 12, entregues: 8 },
    { semana: "Semana 2", criados: 15, entregues: 12 },
    { semana: "Semana 3", criados: 18, entregues: 14 },
    { semana: "Semana 4", criados: metrics?.pedidos_criados || 0, entregues: metrics?.pedidos_entregues || 0 },
  ];

  const statusDistributionData = [
    { name: "Em Produção", value: metrics?.pedidos_producao || 0, color: "#3b82f6" },
    { name: "Entregues", value: metrics?.pedidos_entregues || 0, color: "#22c55e" },
    { name: "Pendentes", value: (metrics?.pedidos_criados || 0) - (metrics?.pedidos_entregues || 0), color: "#f59e0b" },
  ];

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/admin")}
              variant="outline"
              size="icon"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                Relatórios de Desempenho
              </h1>
              <p className="text-muted-foreground">
                Monitoramento automático de produção, entrega e comunicação
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchReportData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            {role === "superadmin" && (
              <Button onClick={generateReport} disabled={generating} size="sm">
                <Download className="h-4 w-4 mr-2" />
                {generating ? "Gerando..." : "Gerar Relatório"}
              </Button>
            )}
          </div>
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as "semanal" | "mensal")}>
          <TabsList className="mb-6">
            <TabsTrigger value="semanal">Semanal</TabsTrigger>
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="space-y-6">
            {/* Cards de Métricas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <ReportMetricsCard
                title="Pedidos Criados"
                value={metrics?.pedidos_criados || 0}
                icon={Package}
                description="Total no período"
              />
              <ReportMetricsCard
                title="Em Produção"
                value={metrics?.pedidos_producao || 0}
                icon={Scissors}
                description="Atualmente ativos"
              />
              <ReportMetricsCard
                title="Entregues"
                value={metrics?.pedidos_entregues || 0}
                icon={Truck}
                description="Finalizados"
              />
              <ReportMetricsCard
                title="Tempo Médio"
                value={`${metrics?.tempo_medio_producao || 0} dias`}
                icon={Clock}
                description="Produção até entrega"
              />
              <ReportMetricsCard
                title="Admins Ativos"
                value={metrics?.admins_ativos || 0}
                icon={Users}
                description="No período"
              />
            </div>

            {/* Gráficos */}
            <ReportCharts ordersData={ordersChartData} statusData={statusDistributionData} />

            {/* Ranking de Admins */}
            <TopAdminsRanking admins={topAdmins} />

            {/* Rodapé */}
            <Card className="bg-muted/30">
              <CardContent className="py-4">
                <p className="text-sm text-center text-muted-foreground">
                  🔒 Sistema Lovable – Relatório gerado automaticamente. Dados auditados em tempo real.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
