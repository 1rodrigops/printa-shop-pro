import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, CreditCard, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ConfiguracaoPagSeguro = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    pagseguro_email: "",
    pagseguro_token: "",
    pagseguro_webhook_url: "",
    pagseguro_ambiente: "producao",
    pagseguro_parcelamento: true,
    pagseguro_taxa: 3.99,
    pagseguro_mensagem_retorno: "",
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
          pagseguro_email: data.pagseguro_email || "",
          pagseguro_token: data.pagseguro_token || "",
          pagseguro_webhook_url: data.pagseguro_webhook_url || "",
          pagseguro_ambiente: data.pagseguro_ambiente || "producao",
          pagseguro_parcelamento: data.pagseguro_parcelamento !== false,
          pagseguro_taxa: data.pagseguro_taxa || 3.99,
          pagseguro_mensagem_retorno: data.pagseguro_mensagem_retorno || "",
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

      toast.success("Configurações PagSeguro salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações PagSeguro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Configuração PagSeguro
        </CardTitle>
        <CardDescription>
          Configure sua conta PagSeguro para aceitar cartões de crédito e débito
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">Obtenha suas credenciais PagSeguro</p>
              <p>Acesse sua conta em pagseguro.uol.com.br → Integrações → Chaves de API</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="pagseguro-email">E-mail da Conta PagSeguro *</Label>
            <Input
              id="pagseguro-email"
              type="email"
              placeholder="seu-email@dominio.com"
              value={settings.pagseguro_email}
              onChange={(e) =>
                setSettings({ ...settings, pagseguro_email: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="pagseguro-token">Token da API *</Label>
            <Input
              id="pagseguro-token"
              type="password"
              placeholder="Cole aqui o token gerado no PagSeguro"
              value={settings.pagseguro_token}
              onChange={(e) =>
                setSettings({ ...settings, pagseguro_token: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="pagseguro-webhook">URL de Webhook</Label>
            <Input
              id="pagseguro-webhook"
              placeholder="URL para receber notificações de pagamento"
              value={settings.pagseguro_webhook_url}
              onChange={(e) =>
                setSettings({ ...settings, pagseguro_webhook_url: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="pagseguro-ambiente">Ambiente</Label>
            <Select
              value={settings.pagseguro_ambiente}
              onValueChange={(value) =>
                setSettings({ ...settings, pagseguro_ambiente: value })
              }
            >
              <SelectTrigger id="pagseguro-ambiente">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pagseguro-taxa">Taxa Padrão (%)</Label>
            <Input
              id="pagseguro-taxa"
              type="number"
              step="0.01"
              value={settings.pagseguro_taxa}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  pagseguro_taxa: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="pagseguro-mensagem">Mensagem de Confirmação</Label>
            <Input
              id="pagseguro-mensagem"
              placeholder="Ex: Seu pagamento via PagSeguro foi aprovado!"
              value={settings.pagseguro_mensagem_retorno}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  pagseguro_mensagem_retorno: e.target.value,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <Label htmlFor="pagseguro-parcelamento" className="text-base font-medium">
                Permitir Parcelamento
              </Label>
              <p className="text-sm text-muted-foreground">
                Habilita pagamento em até 12x
              </p>
            </div>
            <Switch
              id="pagseguro-parcelamento"
              checked={settings.pagseguro_parcelamento}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, pagseguro_parcelamento: checked })
              }
            />
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h4 className="font-semibold mb-2">💡 Como funciona o PagSeguro</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Cliente escolhe "Pagar com PagSeguro"</li>
            <li>• Redirecionamento para gateway PagSeguro</li>
            <li>• Cliente insere dados do cartão com segurança</li>
            <li>• Webhook confirma status (aprovado/pendente/cancelado)</li>
            <li>• Sistema atualiza pedido e notifica cliente</li>
          </ul>
        </div>

        <Button onClick={salvarConfiguracoes} disabled={loading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Configurações PagSeguro"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConfiguracaoPagSeguro;