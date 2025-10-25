import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "sonner";
import KanbanColumn from "./KanbanColumn";
import PedidoCard from "./PedidoCard";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const etapas = [
  { id: "Corte", label: "✂️ Corte", color: "bg-blue-50 border-blue-200" },
  { id: "Estampa", label: "🎨 Estampa", color: "bg-orange-50 border-orange-200" },
  { id: "Acabamento", label: "🧵 Acabamento", color: "bg-purple-50 border-purple-200" },
  { id: "Embalagem", label: "📦 Embalagem", color: "bg-green-50 border-green-200" },
];

const KanbanProducao = () => {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const queryClient = useQueryClient();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ["pedidos-producao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "processing")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Order[];
    },
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  const moverEtapaMutation = useMutation({
    mutationFn: async ({ orderId, novaEtapa }: { orderId: string; novaEtapa: string }) => {
      // Chamar a função do banco para registrar mudança
      const { error } = await supabase.rpc("registrar_mudanca_etapa", {
        p_pedido_id: orderId,
        p_etapa: novaEtapa,
      });

      if (error) throw error;

      // Se chegou na embalagem finalizada, mudar status principal
      if (novaEtapa === "Embalagem") {
        const { error: updateError } = await supabase
          .from("orders")
          .update({ status: "completed" })
          .eq("id", orderId);

        if (updateError) throw updateError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pedidos-producao"] });
      queryClient.invalidateQueries({ queryKey: ["producao-stats"] });
      toast.success(`Pedido movido para ${variables.novaEtapa}!`);
      
      // Enviar mensagem WhatsApp (implementar)
      enviarNotificacaoWhatsApp(variables.orderId, variables.novaEtapa);
    },
    onError: (error) => {
      toast.error("Erro ao mover pedido: " + error.message);
    },
  });

  const enviarNotificacaoWhatsApp = async (orderId: string, etapa: string) => {
    // Implementar integração com API WhatsApp
    const mensagens = {
      Corte: "Seu pedido entrou na produção! ✂️",
      Estampa: "Estamos estampando sua camiseta! 🎨",
      Acabamento: "Seu pedido está quase pronto! 🧵",
      Embalagem: "Seu pedido será despachado em breve! 📦",
    };

    console.log(`Enviando WhatsApp: ${mensagens[etapa as keyof typeof mensagens]}`);
    // Aqui você integraria com a edge function de WhatsApp
  };

  const handleDragStart = (event: DragStartEvent) => {
    const order = pedidos?.find((p) => p.id === event.active.id);
    setActiveOrder(order || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over || active.id === over.id) return;

    const orderId = active.id as string;
    const novaEtapa = over.id as string;

    moverEtapaMutation.mutate({ orderId, novaEtapa });
  };

  const getPedidosPorEtapa = (etapa: string) => {
    return pedidos?.filter((p) => p.etapa_producao === etapa) || [];
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando pedidos em produção...</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {etapas.map((etapa) => (
          <KanbanColumn
            key={etapa.id}
            etapa={etapa}
            pedidos={getPedidosPorEtapa(etapa.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeOrder ? <PedidoCard pedido={activeOrder} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanProducao;
