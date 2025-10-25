import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ConfiguracaoGeral = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    pix_enabled: false,
    pagseguro_enabled: false,
    mercadopago_enabled: false,
    valor_minimo_pedido: 30,
    prazo_compensacao: "",
    mensagem_checkout: "",
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
          pix_enabled: data.pix_enabled || false,
          pagseguro_enabled: data.pagseguro_enabled || false,
          mercadopago_enabled: data.mercadopago_enabled || false,
          valor_minimo_pedido: data.valor_minimo_pedido || 30,
          prazo_compensacao: data.prazo_compensacao || "",
          mensagem_checkout: data.mensagem_checkout || "",
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

      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Gerais</CardTitle>
        <CardDescription>
          Defina as configurações globais dos métodos de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ativação dos Métodos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Métodos Disponíveis</h3>
          
          <div className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <Label htmlFor="pix-enabled" className="text-base font-medium">
                💚 Ativar PIX
              </Label>
              <p className="text-sm text-muted-foreground">
                Pagamento instantâneo via QR Code
              </p>
            </div>
            <Switch
              id="pix-enabled"
              checked={settings.pix_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, pix_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <Label htmlFor="pagseguro-enabled" className="text-base font-medium">
                🟡 Ativar PagSeguro
              </Label>
              <p className="text-sm text-muted-foreground">
                Cartão de crédito e débito
              </p>
            </div>
            <Switch
              id="pagseguro-enabled"
              checked={settings.pagseguro_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, pagseguro_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <Label htmlFor="mercadopago-enabled" className="text-base font-medium">
                🔵 Ativar Mercado Pago
              </Label>
              <p className="text-sm text-muted-foreground">
                Integração completa com Mercado Livre
              </p>
            </div>
            <Switch
              id="mercadopago-enabled"
              checked={settings.mercadopago_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, mercadopago_enabled: checked })
              }
            />
          </div>
        </div>

        {/* Configurações Gerais */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Parâmetros Gerais</h3>
          
          <div>
            <Label htmlFor="valor-minimo">Valor Mínimo por Pedido (R$)</Label>
            <Input
              id="valor-minimo"
              type="number"
              step="0.01"
              value={settings.valor_minimo_pedido}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  valor_minimo_pedido: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="prazo-compensacao">Prazos de Compensação</Label>
            <Input
              id="prazo-compensacao"
              placeholder="Ex: PIX imediato, Cartão 2 dias, PagSeguro 1 dia útil"
              value={settings.prazo_compensacao}
              onChange={(e) =>
                setSettings({ ...settings, prazo_compensacao: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="mensagem-checkout">Mensagem no Checkout</Label>
            <Textarea
              id="mensagem-checkout"
              placeholder="Mensagem exibida ao cliente no checkout"
              value={settings.mensagem_checkout}
              onChange={(e) =>
                setSettings({ ...settings, mensagem_checkout: e.target.value })
              }
            />
          </div>
        </div>

        <Button onClick={salvarConfiguracoes} disabled={loading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConfiguracaoGeral;