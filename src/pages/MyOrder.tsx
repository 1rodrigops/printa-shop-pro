import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { OrderProgressBar } from "@/components/OrderProgressBar";
import { MessageCircle, RefreshCw, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shirt_size: string;
  shirt_color: string;
  quantity: number;
  total_price: number;
  status: string;
  image_url: string | null;
  notes: string | null;
}

const MyOrder = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Erro ao carregar pedidos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchOrders, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleWhatsAppContact = (orderId: string) => {
    const message = encodeURIComponent(
      `Olá! Gostaria de informações sobre o pedido #${orderId.substring(0, 8)}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                Meus Pedidos
              </h1>
              <p className="text-muted-foreground">
                Acompanhe o status dos seus pedidos em tempo real
              </p>
            </div>
            <Button onClick={fetchOrders} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  Você ainda não fez nenhum pedido.
                </p>
                <Button onClick={() => navigate("/personalizar")}>
                  Fazer Pedido
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Pedido #{order.id.substring(0, 8)}
                        </CardTitle>
                        <CardDescription>
                          Realizado em {new Date(order.created_at).toLocaleDateString("pt-BR")}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          R$ {Number(order.total_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6 space-y-6">
                    <OrderProgressBar status={order.status} />
                    
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <h4 className="font-semibold mb-2">Detalhes do Pedido</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Tamanho:</span> {order.shirt_size.toUpperCase()}</p>
                          <p><span className="text-muted-foreground">Cor:</span> {order.shirt_color}</p>
                          <p><span className="text-muted-foreground">Quantidade:</span> {order.quantity}</p>
                        </div>
                      </div>
                      
                      {order.image_url && (
                        <div>
                          <h4 className="font-semibold mb-2">Arte Aprovada</h4>
                          <img
                            src={order.image_url}
                            alt="Arte do pedido"
                            className="rounded-lg border w-full max-w-[200px] object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {order.notes && (
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Observações</h4>
                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => handleWhatsAppContact(order.id)}
                        className="w-full"
                        variant="outline"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Falar com o atendimento via WhatsApp
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Em caso de dúvidas, nossa equipe pode enviar foto ou vídeo do seu pedido antes do envio.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyOrder;
