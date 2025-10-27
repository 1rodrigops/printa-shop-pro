import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Printer, Tag, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import PedidoModal from "./PedidoModal";
import StatusBadge from "./StatusBadge";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const PedidosTable = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Database["public"]["Enums"]["order_status"] }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-active"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const handlePrint = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Pedido #${order.id.slice(0, 8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>StampShirts</h1>
            <h2>Pedido #${order.id.slice(0, 8)}</h2>
          </div>
          <div class="info">
            <p><span class="label">Cliente:</span> ${order.customer_name}</p>
            <p><span class="label">Telefone:</span> ${order.customer_phone}</p>
            <p><span class="label">Email:</span> ${order.customer_email}</p>
            <p><span class="label">Tamanho:</span> ${order.shirt_size}</p>
            <p><span class="label">Cor:</span> ${order.shirt_color}</p>
            <p><span class="label">Quantidade:</span> ${order.quantity}</p>
            <p><span class="label">Valor Total:</span> R$ ${Number(order.total_price).toFixed(2)}</p>
            <p><span class="label">Status:</span> ${order.status}</p>
            ${order.notes ? `<p><span class="label">Observações:</span> ${order.notes}</p>` : ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleGenerateLabel = (order: Order) => {
    toast.info("Gerando etiqueta de envio...");
    // Aqui seria a integração com Correios/ML
  };

  const handleSendWhatsApp = (order: Order) => {
    toast.info("Enviando atualização via WhatsApp...");
    // Integração com a API WhatsApp já configurada
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando pedidos...</div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order.id}>
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
                <TableCell>
                  <StatusBadge 
                    status={order.status} 
                    orderId={order.id}
                    onStatusChange={(newStatus) => 
                      updateStatusMutation.mutate({ id: order.id, status: newStatus })
                    }
                  />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(order.updated_at), "dd/MM HH:mm")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedOrder(order)}
                      title="Gerenciar"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrint(order)}
                      title="Imprimir Pedido"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleGenerateLabel(order)}
                      title="Gerar Etiqueta"
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSendWhatsApp(order)}
                      title="Enviar WhatsApp"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedOrder && (
        <PedidoModal
          order={selectedOrder}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ["orders-active"] })}
        />
      )}
    </>
  );
};

export default PedidosTable;
