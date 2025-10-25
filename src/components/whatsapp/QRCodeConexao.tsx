import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, QrCode, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeConexaoProps {
  apiUrl: string;
  apiKey: string;
  numeroWhatsApp: string;
  provider: string;
}

export const QRCodeConexao = ({ apiUrl, apiKey, numeroWhatsApp, provider }: QRCodeConexaoProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (qrCode && status === "connecting") {
      // Check status every 10 seconds
      interval = setInterval(() => {
        checkConnectionStatus();
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [qrCode, status]);

  const gerarQRCode = async () => {
    if (!apiUrl || !apiKey) {
      toast({
        title: "Configuração incompleta",
        description: "Configure a URL e chave da API antes de gerar o QR Code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setStatus("connecting");

    try {
      const response = await fetch(`${apiUrl}/instance/qr?apikey=${apiKey}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Assuming API returns base64 QR code or image URL
        setQrCode(data.qrcode || data.qr || data.image);
        toast({
          title: "QR Code gerado",
          description: "Escaneie o código com seu WhatsApp.",
        });
      } else {
        toast({
          title: "Erro ao gerar QR Code",
          description: `Código: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro de conexão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (!apiUrl || !apiKey) return;

    setChecking(true);
    try {
      const numeroLimpo = numeroWhatsApp.replace(/[\s\(\)\-]/g, '');
      const response = await fetch(`${apiUrl}/instance/status?number=${numeroLimpo}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "connected" || data.connected === true) {
          setStatus("connected");
          setQrCode(null);
          toast({
            title: "✅ Instância conectada com sucesso!",
            description: "Seu WhatsApp está pronto para enviar mensagens.",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    } finally {
      setChecking(false);
    }
  };

  // Don't show if provider is not WuzAPI or Evolution API
  if (provider !== "WuzAPI" && provider !== "Evolution API") {
    return null;
  }

  return (
    <Card className="border-2 border-green-200">
      <CardHeader className="bg-green-50">
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-green-600" />
          🔗 Conexão via QR Code
        </CardTitle>
        <CardDescription>
          Conecte seu número de WhatsApp ao servidor escaneando o QR Code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {status === "connected" ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">
              ✅ Instância conectada e ativa
            </AlertDescription>
          </Alert>
        ) : status === "connecting" && qrCode ? (
          <>
            <Alert>
              <AlertDescription>
                📲 Escaneie este QR Code no WhatsApp Web do número <strong>{numeroWhatsApp}</strong>
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed">
              {qrCode.startsWith('data:image') ? (
                <img src={qrCode} alt="QR Code WhatsApp" className="max-w-xs" />
              ) : (
                <img src={`data:image/png;base64,${qrCode}`} alt="QR Code WhatsApp" className="max-w-xs" />
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              {checking && <Loader2 className="h-4 w-4 animate-spin" />}
              Aguardando pareamento... (atualiza a cada 10s)
            </div>
          </>
        ) : (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              ❌ Aguardando conexão - Clique em "Gerar QR Code" para conectar
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button 
            onClick={gerarQRCode} 
            disabled={loading || status === "connected"}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            🔁 {status === "connected" ? "Já Conectado" : "Gerar Novo QR Code"}
          </Button>
          
          {status === "connecting" && (
            <Button 
              variant="outline" 
              onClick={checkConnectionStatus}
              disabled={checking}
            >
              {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              🔍 Verificar Status
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};