import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, DollarSign, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ConfiguracaoMercadoPago = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    mercadopago_public_key: "",
    mercadopago_access_token: "",
    mercadopago_webhook_url: "",
    mercadopago_url_retorno: "",
    mercadopago_parcelamento: true,
    mercadopago_envios: false,
    mercadopago_mensagem: "",
  });

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          mercadopago_public_key: data.mercadopago_public_key || "",
          mercadopago_access_token: data.mercadopago_access_token || "",
          mercadopago_webhook_url: data.mercadopago_webhook_url || "",
          mercadopago_url_retorno: data.mercadopago_url_retorno || "",
          mercadopago_parcelamento: data.mercadopago_parcelamento !== false,
          mercadopago_envios: data.mercadopago_envios || false,
          mercadopago_mensagem: data.mercadopago_mensagem || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const salvarConfiguracoes = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("payment_settings")
        .update(settings)
        .eq("id", (await supabase.from("payment_settings").select("id").single()).data?.id);

      if (error) throw error;

      toast.success("Configurações Mercado Pago salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações Mercado Pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Configuração Mercado Pago
        </CardTitle>
        <CardDescription>
          Configure sua conta Mercado Pago para integração completa com Mercado Livre
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Obtenha suas credenciais Mercado Pago</p>
              <p>Acesse mercadopago.com.br → Seu negócio → Configurações → Credenciais</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="mp-public-key">Public Key *</Label>
            <Input
              id="mp-public-key"
              placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={settings.mercadopago_public_key}
              onChange={(e) =>
                setSettings({ ...settings, mercadopago_public_key: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="mp-access-token">Access Token *</Label>
            <Input
              id="mp-access-token"
              type="password"
              placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={settings.mercadopago_access_token}
              onChange={(e) =>
                setSettings({ ...settings, mercadopago_access_token: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="mp-webhook">URL de Webhook</Label>
            <Input
              id="mp-webhook"
              placeholder="URL para receber notificações IPN"
              value={settings.mercadopago_webhook_url}
              onChange={(e) =>
                setSettings({ ...settings, mercadopago_webhook_url: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="mp-retorno">URL de Retorno</Label>
            <Input
              id="mp-retorno"
              placeholder="URL para onde o cliente volta após pagamento"
              value={settings.mercadopago_url_retorno}
              onChange={(e) =>
                setSettings({ ...settings, mercadopago_url_retorno: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="mp-mensagem">Mensagem Pós-Pagamento</Label>
            <Input
              id="mp-mensagem"
              placeholder="Ex: Seu pagamento via Mercado Pago foi confirmado!"
              value={settings.mercadopago_mensagem}
              onChange={(e) =>
                setSettings({ ...settings, mercadopago_mensagem: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <Label htmlFor="mp-parcelamento" className="text-base font-medium">
                Permitir Parcelamento
              </Label>
              <p className="text-sm text-muted-foreground">
                Habilita pagamento em até 12x
              </p>
            </div>
            <Switch
              id="mp-parcelamento"
              checked={settings.mercadopago_parcelamento}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, mercadopago_parcelamento: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <Label htmlFor="mp-envios" className="text-base font-medium">
                Integração Mercado Envios
              </Label>
              <p className="text-sm text-muted-foreground">
                Conecta com sistema de rastreamento do Mercado Livre
              </p>
            </div>
            <Switch
              id="mp-envios"
              checked={settings.mercadopago_envios}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, mercadopago_envios: checked })
              }
            />
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h4 className="font-semibold mb-2">💡 Como funciona o Mercado Pago</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Cliente escolhe "Pagar com Mercado Pago"</li>
            <li>• API gera preferência de pagamento</li>
            <li>• Redirecionamento seguro para Mercado Pago</li>
            <li>• Webhook recebe status (approved/in_process/rejected)</li>
            <li>• Sistema atualiza pedido e dispara notificação</li>
          </ul>
        </div>

        <Button onClick={salvarConfiguracoes} disabled={loading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Configurações Mercado Pago"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConfiguracaoMercadoPago;