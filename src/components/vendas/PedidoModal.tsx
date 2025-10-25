import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

interface PedidoModalProps {
  order: Order;
  open: boolean;
  onClose: () => void;
}

const PedidoModal = ({ order, open, onClose }: PedidoModalProps) => {
  const [notes, setNotes] = useState(order.notes || "");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Pedido #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Cliente */}
          <div>
            <h3 className="font-semibold mb-2">📋 Informações do Cliente</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Nome:</span> {order.customer_name}
              </div>
              <div>
                <span className="font-medium">Telefone:</span> {order.customer_phone}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Email:</span> {order.customer_email}
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações do Produto */}
          <div>
            <h3 className="font-semibold mb-2">👕 Produto</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Tamanho:</span> {order.shirt_size}
              </div>
              <div>
                <span className="font-medium">Cor:</span> {order.shirt_color}
              </div>
              <div>
                <span className="font-medium">Quantidade:</span> {order.quantity}
              </div>
              <div>
                <span className="font-medium">Valor Total:</span> R$ {Number(order.total_price).toFixed(2)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Status e Datas */}
          <div>
            <h3 className="font-semibold mb-2">📊 Status e Histórico</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Status Atual:</span> {order.status}
              </div>
              <div>
                <span className="font-medium">Criado em:</span>{" "}
                {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm")}
              </div>
              <div>
                <span className="font-medium">Última atualização:</span>{" "}
                {format(new Date(order.updated_at), "dd/MM/yyyy 'às' HH:mm")}
              </div>
            </div>
          </div>

          <Separator />

          {/* Observações Internas */}
          <div>
            <Label htmlFor="notes">📝 Observações Internas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre este pedido..."
              className="mt-2"
              rows={4}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={onClose}>
              Salvar Alterações
            </Button>
            <Button variant="secondary">
              📤 Enviar Atualização (WhatsApp)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PedidoModal;
