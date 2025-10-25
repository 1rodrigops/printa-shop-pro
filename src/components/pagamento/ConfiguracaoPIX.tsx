import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ConfiguracaoPIX = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    pix_chave: "",
    pix_nome_recebedor: "",
    pix_banco: "",
    pix_api_url: "",
    pix_gerar_qrcode: true,
    pix_webhook_url: "",
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
          pix_chave: data.pix_chave || "",
          pix_nome_recebedor: data.pix_nome_recebedor || "",
          pix_banco: data.pix_banco || "",
          pix_api_url: data.pix_api_url || "",
          pix_gerar_qrcode: data.pix_gerar_qrcode !== false,
          pix_webhook_url: data.pix_webhook_url || "",
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

      toast.success("Configurações PIX salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações PIX");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Configuração PIX
        </CardTitle>
        <CardDescription>
          Configure os dados da sua chave PIX para recebimento automático
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="pix-chave">Chave PIX *</Label>
            <Input
              id="pix-chave"
              placeholder="Pode ser CPF, CNPJ, e-mail, telefone ou chave aleatória"
              value={settings.pix_chave}
              onChange={(e) =>
                setSettings({ ...settings, pix_chave: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="pix-recebedor">Nome do Recebedor *</Label>
            <Input
              id="pix-recebedor"
              placeholder="Ex: AgilGás Comércio de Gás LTDA"
              value={settings.pix_nome_recebedor}
              onChange={(e) =>
                setSettings({ ...settings, pix_nome_recebedor: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="pix-banco">Banco / PSP</Label>
            <Input
              id="pix-banco"
              placeholder="Ex: Itaú, Santander, Inter, Banco do Brasil"
              value={settings.pix_banco}
              onChange={(e) =>
                setSettings({ ...settings, pix_banco: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="pix-api">API PIX (Opcional)</Label>
            <Input
              id="pix-api"
              placeholder="Endpoint para integração automática (ex: Pagar.me, Asaas)"
              value={settings.pix_api_url}
              onChange={(e) =>
                setSettings({ ...settings, pix_api_url: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se usar gateway de pagamento, informe a URL da API
            </p>
          </div>

          <div>
            <Label htmlFor="pix-webhook">URL de Webhook</Label>
            <Input
              id="pix-webhook"
              placeholder="URL para receber confirmações de pagamento"
              value={settings.pix_webhook_url}
              onChange={(e) =>
                setSettings({ ...settings, pix_webhook_url: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <Label htmlFor="pix-qrcode" className="text-base font-medium">
                Gerar QR Code Dinâmico
              </Label>
              <p className="text-sm text-muted-foreground">
                Cria QR Code com valor do pedido no checkout
              </p>
            </div>
            <Switch
              id="pix-qrcode"
              checked={settings.pix_gerar_qrcode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, pix_gerar_qrcode: checked })
              }
            />
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h4 className="font-semibold mb-2">💡 Como funciona o PIX</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Cliente seleciona PIX no checkout</li>
            <li>• Sistema gera QR Code com o valor total</li>
            <li>• Cliente escaneia ou copia código</li>
            <li>• Webhook confirma pagamento automaticamente</li>
            <li>• Pedido é marcado como pago e notificação enviada</li>
          </ul>
        </div>

        <Button onClick={salvarConfiguracoes} disabled={loading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Configurações PIX"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConfiguracaoPIX;