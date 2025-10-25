import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PedidoCard from "./PedidoCard";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

interface KanbanColumnProps {
  etapa: {
    id: string;
    label: string;
    color: string;
  };
  pedidos: Order[];
}

const KanbanColumn = ({ etapa, pedidos }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa.id,
  });

  return (
    <Card className={`${etapa.color} ${isOver ? "ring-2 ring-primary" : ""} transition-all`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{etapa.label}</span>
          <span className="text-sm font-normal bg-background px-2 py-1 rounded-full">
            {pedidos.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={setNodeRef}
          className="space-y-3 min-h-[400px]"
        >
          {pedidos.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Nenhum pedido nesta etapa
            </div>
          ) : (
            pedidos.map((pedido) => (
              <PedidoCard key={pedido.id} pedido={pedido} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanColumn;
