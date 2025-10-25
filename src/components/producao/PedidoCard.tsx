import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, MessageCircle, Printer, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

interface PedidoCardProps {
  pedido: Order;
  isDragging?: boolean;
}

const PedidoCard = ({ pedido, isDragging = false }: PedidoCardProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: pedido.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleNotificar = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info(`Enviando notificação para ${pedido.customer_name}`);
  };

  const handleImprimir = (e: React.MouseEvent) => {
    e.stopPropagation();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Ficha de Produção - Pedido #${pedido.id.slice(0, 8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .info { margin-bottom: 15px; }
            .label { font-weight: bold; display: inline-block; width: 150px; }
            .etapa { background: #f0f0f0; padding: 15px; margin: 15px 0; border-left: 4px solid #F97316; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>StampShirts - Ficha de Produção</h1>
            <h2>Pedido #${pedido.id.slice(0, 8)}</h2>
          </div>
          <div class="info">
            <p><span class="label">Cliente:</span> ${pedido.customer_name}</p>
            <p><span class="label">Tamanho:</span> ${pedido.shirt_size}</p>
            <p><span class="label">Cor:</span> ${pedido.shirt_color}</p>
            <p><span class="label">Quantidade:</span> ${pedido.quantity}</p>
            ${pedido.notes ? `<p><span class="label">Observações:</span> ${pedido.notes}</p>` : ''}
          </div>
          <div class="etapa">
            <h3>Etapa Atual: ${pedido.etapa_producao || 'Aguardando início'}</h3>
          </div>
          <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px;">
            <p><strong>Checklist:</strong></p>
            <p>☐ Corte realizado</p>
            <p>☐ Estampa aplicada</p>
            <p>☐ Acabamento concluído</p>
            <p>☐ Embalagem finalizada</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleVerDetalhes = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Abrindo detalhes do pedido...");
  };

  const tempoEmProducao = formatDistanceToNow(new Date(pedido.updated_at), {
    locale: ptBR,
    addSuffix: false,
  });

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 cursor-move hover:shadow-lg transition-all ${
        isDragging ? "opacity-50 shadow-2xl rotate-2" : ""
      }`}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-sm font-bold">#{pedido.id.slice(0, 8)}</p>
            <p className="text-sm font-medium">{pedido.customer_name}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleVerDetalhes}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Produto */}
        <div className="text-xs text-muted-foreground">
          <p>
            {pedido.shirt_size} • {pedido.shirt_color}
          </p>
          <p>Qtd: {pedido.quantity}</p>
        </div>

        {/* Tempo */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>⏱️</span>
          <span>{tempoEmProducao}</span>
        </div>

        {/* Ações */}
        <div className="flex gap-1 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={handleNotificar}
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Notificar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={handleImprimir}
          >
            <Printer className="h-3 w-3 mr-1" />
            Imprimir
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PedidoCard;
