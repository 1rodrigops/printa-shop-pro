import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, ExternalLink, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface ModalPagamentoProps {
  open: boolean;
  onClose: () => void;
  metodo: 'pix' | 'pagseguro' | 'mercadopago';
  pagamentoUrl?: string;
  qrCodeData?: {
    chave: string;
    nome_recebedor: string;
    banco: string;
    valor: number;
    pedido_id: string;
  };
  pedidoId: string;
}

export const ModalPagamento = ({
  open,
  onClose,
  metodo,
  pagamentoUrl,
  qrCodeData,
  pedidoId
}: ModalPagamentoProps) => {
  const [copiado, setCopiado] = useState(false);

  const copiarChavePix = () => {
    if (qrCodeData?.chave) {
      navigator.clipboard.writeText(qrCodeData.chave);
      setCopiado(true);
      toast.success("Chave PIX copiada!");
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {metodo === 'pix' && '💠 Pagamento via PIX'}
            {metodo === 'pagseguro' && '💳 Pagamento via PagSeguro'}
            {metodo === 'mercadopago' && '🛍️ Pagamento via Mercado Pago'}
          </DialogTitle>
          <DialogDescription>
            Pedido #{pedidoId.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        {metodo === 'pix' && qrCodeData && (
          <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    R$ {qrCodeData.valor.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Valor do pedido</p>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Chave PIX</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                        {qrCodeData.chave}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copiarChavePix}
                        disabled={copiado}
                      >
                        {copiado ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Recebedor</p>
                    <p className="text-sm font-medium">{qrCodeData.nome_recebedor}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Banco</p>
                    <p className="text-sm font-medium">{qrCodeData.banco}</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⏱️ <strong>Importante:</strong> Após realizar o pagamento, aguarde até 30 minutos para confirmação.
                Você receberá uma notificação por WhatsApp assim que o pagamento for confirmado!
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Como pagar:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Copie a chave PIX acima</li>
                <li>Abra o app do seu banco</li>
                <li>Escolha PIX → Pagar → Colar código</li>
                <li>Confirme o valor e conclua o pagamento</li>
              </ol>
            </div>

            <Button onClick={onClose} className="w-full" size="lg">
              Fechar
            </Button>
          </div>
        )}

        {(metodo === 'pagseguro' || metodo === 'mercadopago') && pagamentoUrl && (
          <div className="space-y-4">
            <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
              <p className="text-muted-foreground mb-4">
                Você será redirecionado para concluir seu pagamento de forma segura.
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  window.open(pagamentoUrl, '_blank');
                  toast.success('Abrindo página de pagamento...');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ir para {metodo === 'pagseguro' ? 'PagSeguro' : 'Mercado Pago'}
              </Button>
            </Card>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Dica:</strong> Após concluir o pagamento, você receberá uma confirmação
                por e-mail e WhatsApp com os próximos passos do seu pedido.
              </p>
            </div>

            <Button onClick={onClose} variant="outline" className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
