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
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

interface PedidoModalProps {
  order: Order;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const PedidoModal = ({ order, open, onClose, onUpdate }: PedidoModalProps) => {
  const [notes, setNotes] = useState(order.notes || "");
  const [approvedImage, setApprovedImage] = useState<File | null>(null);
  const [approvedPreview, setApprovedPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const orderDetails = order.order_details as any;

  const handleApprovedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setApprovedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setApprovedPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadApprovedImage = async () => {
    if (!approvedImage) return;

    setUploading(true);
    try {
      const filename = `orders/${order.id}_approved_${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('order-images')
        .upload(filename, approvedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('order-images')
        .getPublicUrl(filename);

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          approved_image_url: publicUrl,
          approved_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      toast.success("Imagem aprovada enviada com sucesso!");
      onUpdate?.();
      setApprovedImage(null);
      setApprovedPreview(null);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ notes })
        .eq('id', order.id);

      if (error) throw error;

      toast.success("Observações salvas!");
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error("Erro ao salvar observações");
    }
  };

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

          {/* Imagens do Cliente */}
          {(order.front_image_url || order.back_image_url) && (
            <>
              <div>
                <h3 className="font-semibold mb-2">🖼️ Artes Enviadas pelo Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  {order.front_image_url && (
                    <div>
                      <Label className="text-xs">Frente</Label>
                      <img 
                        src={order.front_image_url} 
                        alt="Arte Frente" 
                        className="w-full h-48 object-contain border rounded bg-muted"
                      />
                    </div>
                  )}
                  {order.back_image_url && (
                    <div>
                      <Label className="text-xs">Verso</Label>
                      <img 
                        src={order.back_image_url} 
                        alt="Arte Verso" 
                        className="w-full h-48 object-contain border rounded bg-muted"
                      />
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

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
            {orderDetails && (
              <div className="mt-3 p-3 bg-muted rounded-md text-xs">
                <p><strong>Tipo:</strong> {orderDetails.tipo_estampa}</p>
                <p><strong>Tecido:</strong> {orderDetails.tecido}</p>
                {orderDetails.tamanhos && (
                  <p><strong>Tamanhos:</strong> {Object.entries(orderDetails.tamanhos)
                    .filter(([_, qty]) => (qty as number) > 0)
                    .map(([size, qty]) => `${size}: ${qty}`)
                    .join(', ')}</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Imagem Aprovada para Produção */}
          <div>
            <h3 className="font-semibold mb-2">✅ Imagem Aprovada para Produção</h3>
            {order.approved_image_url ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Aprovado em {format(new Date(order.approved_at!), "dd/MM/yyyy 'às' HH:mm")}</span>
                </div>
                <img 
                  src={order.approved_image_url} 
                  alt="Arte Aprovada" 
                  className="w-full max-w-md h-64 object-contain border rounded bg-muted"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Faça upload da arte finalizada para o cliente aprovar antes de iniciar a produção.
                </p>
                {approvedPreview && (
                  <img 
                    src={approvedPreview} 
                    alt="Preview" 
                    className="w-full max-w-md h-64 object-contain border rounded bg-muted"
                  />
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleApprovedImageChange}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleUploadApprovedImage}
                    disabled={!approvedImage || uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </div>
            )}
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
            <Button onClick={handleSaveNotes}>
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
