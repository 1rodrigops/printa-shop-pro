import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings } from "lucide-react";
import InspectionModal from "./InspectionModal";

const QualidadeTable = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: orders, refetch } = useQuery({
    queryKey: ["orders-embalagem"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("etapa_producao", "Embalagem")
        .order("created_at", { ascending: false });
      return data || [];
    },
    refetchInterval: 10000,
  });

  const { data: qualityLogs } = useQuery({
    queryKey: ["quality-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quality_control_log")
        .select("*")
        .order("data_hora", { ascending: false });
      return data || [];
    },
    refetchInterval: 10000,
  });

  const handleOpenModal = (order: any) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const getOperador = (orderId: string) => {
    const log = qualityLogs?.find(l => l.pedido_id === orderId);
    return log?.operador || "-";
  };

  const getEtapaAtual = (orderId: string) => {
    const log = qualityLogs?.find(l => l.pedido_id === orderId);
    if (!log) return "Aguardando Inspeção";
    if (log.rastreio) return "Despachado";
    if (log.aprovado) return "Aprovado";
    return "Em Verificação";
  };

  return (
    <>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Pedidos em Embalagem</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Status Atual</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead>Etapa Atual</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  #{order.id.slice(0, 8)}
                </TableCell>
                <TableCell>{order.customer_name}</TableCell>
                <TableCell>
                  {order.shirt_size} / {order.shirt_color}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                    Embalagem
                  </span>
                </TableCell>
                <TableCell>{getOperador(order.id)}</TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {getEtapaAtual(order.id)}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenModal(order)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {selectedOrder && (
        <InspectionModal
          order={selectedOrder}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedOrder(null);
            refetch();
          }}
        />
      )}
    </>
  );
};

export default QualidadeTable;
