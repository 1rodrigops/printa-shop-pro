import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Truck, Camera, CheckCircle } from "lucide-react";

interface InspectionModalProps {
  order: any;
  open: boolean;
  onClose: () => void;
}

const InspectionModal = ({ order, open, onClose }: InspectionModalProps) => {
  const [checklist, setChecklist] = useState({
    tamanho_correto: false,
    cor_conforme: false,
    estampa_centralizada: false,
    sem_manchas: false,
    costura_revisada: false,
    embalagem_lacrada: false,
  });

  const [rastreio, setRastreio] = useState("");
  const [transportadora, setTransportadora] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const saveInspectionMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.user?.id)
        .single();

      const aprovado = Object.values(checklist).every(v => v === true);

      const { error } = await supabase.from("quality_control_log").insert({
        pedido_id: order.id,
        operador: user.user?.email || "Desconhecido",
        operador_id: user.user?.id,
        checklist: checklist,
        rastreio: rastreio || null,
        transportadora: transportadora || null,
        observacoes: observacoes || null,
        aprovado: aprovado,
        mensagem_enviada: false,
      });

      if (error) throw error;

      // Se aprovado e tem rastreio, atualizar pedido para "Finalizado"
      if (aprovado && rastreio) {
        await supabase
          .from("orders")
          .update({ status: "completed" })
          .eq("id", order.id);
      }

      return aprovado;
    },
    onSuccess: (aprovado) => {
      toast.success(
        aprovado
          ? "✅ Inspeção aprovada com sucesso!"
          : "⚠️ Inspeção salva com pendências."
      );
      onClose();
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar inspeção: " + error.message);
    },
  });

  const handleChecklistChange = (key: string, value: boolean) => {
    setChecklist(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const allChecked = Object.values(checklist).every(v => v === true);
    if (!allChecked) {
      toast.warning("⚠️ Nem todos os itens foram aprovados.");
    }
    saveInspectionMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🔍 Inspeção de Qualidade</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cabeçalho do Pedido */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-semibold">Pedido #{order.id.slice(0, 8)}</p>
            <p className="text-sm">Cliente: {order.customer_name}</p>
            <p className="text-sm">
              Produto: {order.shirt_size} / {order.shirt_color}
            </p>
            <p className="text-sm">Pagamento: Confirmado ✅</p>
          </div>

          {/* Checklist de Verificação */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Checklist de Verificação
            </h3>
            
            {Object.entries({
              tamanho_correto: "Tamanho correto",
              cor_conforme: "Cor conforme pedido",
              estampa_centralizada: "Estampa bem centralizada",
              sem_manchas: "Sem manchas / falhas de impressão",
              costura_revisada: "Costura revisada",
              embalagem_lacrada: "Embalagem lacrada",
            }).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={checklist[key as keyof typeof checklist]}
                  onCheckedChange={(checked) =>
                    handleChecklistChange(key, checked as boolean)
                  }
                />
                <Label htmlFor={key} className="cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>

          {/* Código de Rastreio */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Rastreamento
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rastreio">Código de Rastreio</Label>
                <Input
                  id="rastreio"
                  placeholder="BR123456789BR"
                  value={rastreio}
                  onChange={(e) => setRastreio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="transportadora">Transportadora</Label>
                <Input
                  id="transportadora"
                  placeholder="Correios, Jadlog..."
                  value={transportadora}
                  onChange={(e) => setTransportadora(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre a inspeção..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveInspectionMutation.isPending}
          >
            {saveInspectionMutation.isPending ? "Salvando..." : "Salvar Inspeção"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InspectionModal;
