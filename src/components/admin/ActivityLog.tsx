import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Edit, Plus, Trash2, LogIn, Shield, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityLog {
  id: string;
  user_email: string;
  action_type: string;
  action_detail: string;
  timestamp: string;
  ip_address: string | null;
  result: string;
  metadata: any;
}

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'pedido_edit':
    case 'cadastro_edit':
      return <Edit className="w-4 h-4 text-green-500" />;
    case 'user_create':
    case 'pedido_create':
      return <Plus className="w-4 h-4 text-orange-500" />;
    case 'user_delete':
    case 'pedido_delete':
      return <Trash2 className="w-4 h-4 text-red-500" />;
    case 'login':
      return <LogIn className="w-4 h-4 text-blue-500" />;
    case 'role_change':
      return <Shield className="w-4 h-4 text-purple-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
};

const getActionTypeLabel = (actionType: string) => {
  const labels: Record<string, string> = {
    'pedido_edit': 'Pedido Editado',
    'pedido_create': 'Pedido Criado',
    'pedido_delete': 'Pedido Excluído',
    'cadastro_edit': 'Cadastro Editado',
    'user_create': 'Usuário Criado',
    'user_delete': 'Usuário Excluído',
    'login': 'Login',
    'logout': 'Logout',
    'role_change': 'Alteração de Permissão',
  };
  return labels[actionType] || actionType;
};

export const ActivityLog = ({ limit = 10 }: { limit?: number }) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin_activity_log_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_activity_log',
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  const fetchActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activities:', error);
    } else {
      setActivities(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Atividade Recente dos Administradores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Carregando atividades...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Atividade Recente dos Administradores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma atividade registrada ainda</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(activity.action_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {getActionTypeLabel(activity.action_type)}
                    </Badge>
                    {activity.result !== 'Sucesso' && (
                      <Badge variant="destructive" className="text-xs">
                        {activity.result}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm mb-1">
                    <span className="font-medium text-primary">{activity.user_email}</span>
                    {' '}
                    {activity.action_detail}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    {activity.ip_address && (
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        IP: {activity.ip_address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
