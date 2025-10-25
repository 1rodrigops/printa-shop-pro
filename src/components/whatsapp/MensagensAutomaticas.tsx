import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

interface MensagensAutomaticasProps {
  mensagens: {
    pedido_recebido: string;
    seja_bem_vindo: string;
    pagamento_recebido: string;
    em_producao: string;
    em_transporte: string;
    finalizado: string;
  };
  setMensagens: (mensagens: any) => void;
  onSave: () => void;
  onRestaurar: () => void;
  loading: boolean;
}

const mensagensPadrao = {
  pedido_recebido: "Olá {{nome}}, recebemos seu pedido #{{id}}! Em breve enviaremos detalhes.",
  seja_bem_vindo: "Olá {{nome}}, bem-vindo à StampShirts! Personalize suas camisetas conosco 👕✨",
  pagamento_recebido: "Pagamento do pedido #{{id}} confirmado! Agora sua camiseta vai para a produção.",
  em_producao: "Seu pedido #{{id}} está sendo estampado! 🔥",
  em_transporte: "🚚 Seu pedido #{{id}} foi enviado! Acompanhe aqui: {{link_rastreamento}}",
  finalizado: "🎉 Pedido #{{id}} entregue com sucesso! Esperamos que você ame sua camiseta ❤️",
};

const eventos = [
  { key: "pedido_recebido", label: "📦 Pedido Recebido", icon: "📦" },
  { key: "seja_bem_vindo", label: "👋 Seja Bem-Vindo", icon: "👋" },
  { key: "pagamento_recebido", label: "💳 Pagamento Recebido", icon: "💳" },
  { key: "em_producao", label: "🧵 Em Produção", icon: "🧵" },
  { key: "em_transporte", label: "🚚 Em Transporte", icon: "🚚" },
  { key: "finalizado", label: "✅ Finalizado", icon: "✅" },
];

export const MensagensAutomaticas = ({
  mensagens,
  setMensagens,
  onSave,
  onRestaurar,
  loading,
}: MensagensAutomaticasProps) => {
  const [expandido, setExpandido] = useState(true);

  const getCaracteresCount = (text: string) => {
    return text.length;
  };

  const isOverLimit = (text: string) => {
    return text.length > 1024;
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setExpandido(!expandido)}>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          💬 Mensagens Automáticas por Evento
        </CardTitle>
        <CardDescription>
          Personalize as mensagens enviadas automaticamente em cada etapa do pedido
        </CardDescription>
      </CardHeader>
      
      {expandido && (
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">💡 Variáveis disponíveis:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{'{{nome}}'}</Badge>
              <Badge variant="secondary">{'{{id}}'}</Badge>
              <Badge variant="secondary">{'{{valor}}'}</Badge>
              <Badge variant="secondary">{'{{link_rastreamento}}'}</Badge>
            </div>
          </div>

          {eventos.map((evento) => {
            const key = evento.key as keyof typeof mensagens;
            const count = getCaracteresCount(mensagens[key]);
            const isOver = isOverLimit(mensagens[key]);

            return (
              <div key={evento.key} className="space-y-2 pb-4 border-b last:border-b-0">
                <div className="flex items-center justify-between">
                  <Label htmlFor={evento.key} className="text-base font-semibold">
                    {evento.label}
                  </Label>
                  <span className={`text-xs ${isOver ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                    {count}/1024 caracteres
                    {isOver && " ⚠️ Excedeu o limite!"}
                  </span>
                </div>
                <Textarea
                  id={evento.key}
                  value={mensagens[key]}
                  onChange={(e) => setMensagens({ ...mensagens, [key]: e.target.value })}
                  rows={3}
                  className={isOver ? "border-red-500" : ""}
                />
              </div>
            );
          })}

          <div className="flex gap-4">
            <Button onClick={onSave} disabled={loading} className="flex-1">
              💾 Salvar Mensagens
            </Button>
            <Button variant="outline" onClick={onRestaurar}>
              🔄 Restaurar Padrão
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};