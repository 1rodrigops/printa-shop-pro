import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TesteEnvioProps {
  apiUrl: string;
  apiKey: string;
}

export const TesteEnvio = ({ apiUrl, apiKey }: TesteEnvioProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [numeroDestino, setNumeroDestino] = useState("");
  const [mensagemTeste, setMensagemTeste] = useState("Teste de envio via API WhatsApp configurada com sucesso!");
  const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null);

  const handleEnviarTeste = async () => {
    if (!numeroDestino || !mensagemTeste) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o número de destino e a mensagem de teste.",
        variant: "destructive",
      });
      return;
    }

    if (!apiUrl || !apiKey) {
      toast({
        title: "Configuração incompleta",
        description: "Configure a URL e chave da API antes de enviar teste.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      // Limpar número (remover espaços, parênteses, hífens)
      const numeroLimpo = numeroDestino.replace(/[\s\(\)\-]/g, '');

      const response = await fetch(`${apiUrl}/message/sendText`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: numeroLimpo,
          text: mensagemTeste,
        }),
      });

      if (response.ok) {
        setResultado({
          success: true,
          message: "✅ Mensagem enviada com sucesso para " + numeroDestino,
        });
        toast({
          title: "Mensagem enviada",
          description: "O teste foi realizado com sucesso!",
        });
      } else {
        const errorText = await response.text();
        setResultado({
          success: false,
          message: `❌ Erro: ${response.status} – ${errorText || "Falha no envio"}`,
        });
        toast({
          title: "Erro no envio",
          description: `Código: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setResultado({
        success: false,
        message: `❌ Erro de conexão: ${error.message}`,
      });
      toast({
        title: "Erro de conexão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-600" />
          🧪 Teste de Envio
        </CardTitle>
        <CardDescription>
          Enviar mensagem de teste via API configurada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="numeroDestino">Número de Destino</Label>
          <Input
            id="numeroDestino"
            type="text"
            placeholder="+55 41 98888-7777"
            value={numeroDestino}
            onChange={(e) => setNumeroDestino(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Formato internacional: +55 (código país) + DDD + número
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensagemTeste">Mensagem de Teste</Label>
          <Textarea
            id="mensagemTeste"
            value={mensagemTeste}
            onChange={(e) => setMensagemTeste(e.target.value)}
            rows={4}
            placeholder="Digite a mensagem de teste..."
          />
          <p className="text-xs text-muted-foreground">
            {mensagemTeste.length}/1024 caracteres
          </p>
        </div>

        {resultado && (
          <Alert variant={resultado.success ? "default" : "destructive"}>
            {resultado.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>{resultado.message}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleEnviarTeste} 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          📤 Enviar Mensagem de Teste
        </Button>
      </CardContent>
    </Card>
  );
};