import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, Package, Users, Activity } from "lucide-react";

interface Stats {
  loginsToday: number;
  ordersEditedToday: number;
  customersUpdatedToday: number;
}

export const ActivityStats = () => {
  const [stats, setStats] = useState<Stats>({
    loginsToday: 0,
    ordersEditedToday: 0,
    customersUpdatedToday: 0,
  });

  useEffect(() => {
    fetchStats();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_activity_log',
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get logins today
    const { count: loginsCount } = await supabase
      .from('admin_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'login')
      .gte('timestamp', today.toISOString());

    // Get orders edited today
    const { count: ordersCount } = await supabase
      .from('admin_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'pedido_edit')
      .gte('timestamp', today.toISOString());

    // Get customers updated today
    const { count: customersCount } = await supabase
      .from('admin_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'cadastro_edit')
      .gte('timestamp', today.toISOString());

    setStats({
      loginsToday: loginsCount || 0,
      ordersEditedToday: ordersCount || 0,
      customersUpdatedToday: customersCount || 0,
    });
  };

  const statCards = [
    {
      title: "Logins nas últimas 24h",
      value: stats.loginsToday,
      icon: LogIn,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Pedidos alterados hoje",
      value: stats.ordersEditedToday,
      icon: Package,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Clientes atualizados hoje",
      value: stats.customersUpdatedToday,
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
