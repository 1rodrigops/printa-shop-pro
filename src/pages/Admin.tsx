import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/layouts/AdminLayout";
import { Package, Clock, CheckCircle, XCircle, DollarSign, TrendingUp, Calendar, ShoppingBag, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import type { User } from '@supabase/supabase-js';
import { ActivityLog } from "@/components/admin/ActivityLog";
import { ActivityStats } from "@/components/admin/ActivityStats";
import { useAdminActivity } from "@/hooks/useAdminActivity";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shirt_size: string;
  shirt_color: string;
  quantity: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  image_url: string | null;
  notes: string | null;
  total_price: number;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const { logLogin } = useAdminActivity();

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pedidos");
      console.error(error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'processing' | 'completed' | 'cancelled') => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success("Status atualizado!");
      fetchOrders();
    }
  };

  useEffect(() => {
    // Check authentication and admin role
    const checkAuth = async () => {
      setCheckingAuth(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      
      // Check if user has admin or superadmin role
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .in('role', ['admin', 'superadmin'])
        .maybeSingle();
      
      if (error || !roleData) {
        setIsAdmin(false);
        setCheckingAuth(false);
        return;
      }
      
      setIsAdmin(true);
      setCheckingAuth(false);
      
      // Log admin login
      logLogin();
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchOrders();
      // Log that admin accessed the dashboard
      logLogin();
    }
  }, [user, isAdmin]);

  if (checkingAuth || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const, icon: <Clock className="w-3 h-3" /> },
      processing: { label: "Processando", variant: "default" as const, icon: <Package className="w-3 h-3" /> },
      completed: { label: "Concluído", variant: "default" as const, icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { label: "Cancelado", variant: "destructive" as const, icon: <XCircle className="w-3 h-3" /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getFilteredOrders = () => {
    if (period === "all") return orders;
    
    const now = new Date();
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoffDate = new Date(now.setDate(now.getDate() - days));
    
    return orders.filter(order => new Date(order.created_at) >= cutoffDate);
  };

  const filteredOrders = getFilteredOrders();

  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    processing: filteredOrders.filter(o => o.status === 'processing').length,
    completed: filteredOrders.filter(o => o.status === 'completed').length,
    totalRevenue: filteredOrders.reduce((sum, order) => sum + Number(order.total_price), 0),
    averageOrderValue: filteredOrders.length > 0 
      ? filteredOrders.reduce((sum, order) => sum + Number(order.total_price), 0) / filteredOrders.length 
      : 0,
  };

  // Dados para gráfico de vendas ao longo do tempo
  const getSalesChartData = () => {
    const salesByDate: Record<string, number> = {};
    
    filteredOrders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      salesByDate[date] = (salesByDate[date] || 0) + Number(order.total_price);
    });

    return Object.entries(salesByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => {
        const [dayA, monthA] = a.date.split('/');
        const [dayB, monthB] = b.date.split('/');
        return new Date(`2025-${monthA}-${dayA}`).getTime() - new Date(`2025-${monthB}-${dayB}`).getTime();
      });
  };

  // Dados para gráfico de produtos mais vendidos
  const getProductsChartData = () => {
    const productsByColor: Record<string, { quantity: number; revenue: number }> = {};
    
    filteredOrders.forEach(order => {
      if (!productsByColor[order.shirt_color]) {
        productsByColor[order.shirt_color] = { quantity: 0, revenue: 0 };
      }
      productsByColor[order.shirt_color].quantity += order.quantity;
      productsByColor[order.shirt_color].revenue += Number(order.total_price);
    });

    return Object.entries(productsByColor)
      .map(([color, data]) => ({ 
        cor: color.charAt(0).toUpperCase() + color.slice(1), 
        quantidade: data.quantity,
        receita: data.revenue 
      }))
      .sort((a, b) => b.receita - a.receita);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Painel Administrativo
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Gerencie pedidos e acompanhe o desempenho financeiro
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="default" 
              onClick={() => navigate("/admin/relatorios")}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Relatórios de Desempenho
            </Button>
            
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger className="w-48">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards de Atividade Recente */}
        <ActivityStats />

        {/* Estatísticas de Pedidos */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Total de Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-secondary">R$ {stats.totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Ticket Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">R$ {stats.averageOrderValue.toFixed(2)}</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Em Produção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.processing}</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para Relatórios, Pedidos e Atividade */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="reports">Relatórios Financeiros</TabsTrigger>
            <TabsTrigger value="orders">Gerenciar Pedidos</TabsTrigger>
            <TabsTrigger value="activity">Atividade Recente</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            {/* Gráfico de Vendas ao Longo do Tempo */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas ao Longo do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getSalesChartData()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Receita"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Produtos Mais Vendidos */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Cor de Camisa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getProductsChartData()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="cor" className="text-xs" />
                    <YAxis yAxisId="left" orientation="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="quantidade" 
                      fill="hsl(var(--secondary))" 
                      name="Quantidade"
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="receita" 
                      fill="hsl(var(--accent))" 
                      name="Receita (R$)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tabela de Análise Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle>Análise Detalhada por Cor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4 font-semibold">Cor</th>
                        <th className="text-right p-4 font-semibold">Quantidade</th>
                        <th className="text-right p-4 font-semibold">Receita Total</th>
                        <th className="text-right p-4 font-semibold">Ticket Médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getProductsChartData().map((item) => (
                        <tr key={item.cor} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-4 font-medium">{item.cor}</td>
                          <td className="text-right p-4">{item.quantidade}</td>
                          <td className="text-right p-4 text-secondary font-semibold">
                            R$ {item.receita.toFixed(2)}
                          </td>
                          <td className="text-right p-4 text-accent font-semibold">
                            R$ {(item.receita / item.quantidade).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            {/* Lista de Pedidos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Todos os Pedidos ({filteredOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Carregando pedidos...</p>
                ) : filteredOrders.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</p>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="grid md:grid-cols-4 gap-4 p-4">
                          {/* Imagem */}
                          <div className="md:col-span-1">
                            {order.image_url ? (
                              <img 
                                src={order.image_url} 
                                alt="Design" 
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                                <Package className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Informações */}
                          <div className="md:col-span-2 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold text-lg">{order.customer_name}</h3>
                                <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                                <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                              </div>
                              {getStatusBadge(order.status)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <p><span className="font-medium">Tamanho:</span> {order.shirt_size}</p>
                              <p><span className="font-medium">Cor:</span> {order.shirt_color}</p>
                              <p><span className="font-medium">Quantidade:</span> {order.quantity}</p>
                              <p><span className="font-medium">Total:</span> R$ {order.total_price.toFixed(2)}</p>
                            </div>
                            
                            {order.notes && (
                              <p className="text-sm text-muted-foreground italic">
                                Obs: {order.notes}
                              </p>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              Pedido em: {new Date(order.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>

                          {/* Ações */}
                          <div className="md:col-span-1 flex flex-col gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value as 'pending' | 'processing' | 'completed' | 'cancelled')}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="processing">Processando</SelectItem>
                                <SelectItem value="completed">Concluído</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            {/* Atividade Recente */}
            <ActivityLog limit={20} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Admin;
