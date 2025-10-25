import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Settings2 } from "lucide-react";

export const ParametrosProducao = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tempoProducao: "48",
    statusInicial: "pending",
    statusFinal: "delivered",
    notificacaoAuto: true,
    mensagemPadrao: "Olá! Seu pedido #[id] está em produção e será entregue em breve.",
    backupAuto: "daily",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("system_config")
        .select("*")
        .in("config_key", [
          "tempo_producao",
          "status_inicial",
          "status_final",
          "notificacao_auto",
          "mensagem_padrao",
          "backup_auto"
        ]);

      if (error) throw error;

      if (data) {
        const config = data.reduce((acc: any, item: any) => {
          acc[item.config_key] = item.config_value;
          return acc;
        }, {});

        setFormData({
          tempoProducao: config.tempo_producao || "48",
          statusInicial: config.status_inicial || "pending",
          statusFinal: config.status_final || "delivered",
          notificacaoAuto: config.notificacao_auto === "true",
          mensagemPadrao: config.mensagem_padrao || "Olá! Seu pedido #[id] está em produção e será entregue em breve.",
          backupAuto: config.backup_auto || "daily",
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates = [
        { config_key: "tempo_producao", config_value: formData.tempoProducao, config_category: "producao", description: "Tempo médio de produção (horas)", updated_by: user?.id },
        { config_key: "status_inicial", config_value: formData.statusInicial, config_category: "producao", description: "Status inicial do pedido", updated_by: user?.id },
        { config_key: "status_final", config_value: formData.statusFinal, config_category: "producao", description: "Status final automático", updated_by: user?.id },
        { config_key: "notificacao_auto", config_value: formData.notificacaoAuto.toString(), config_category: "producao", description: "Notificação automática ativada", updated_by: user?.id },
        { config_key: "mensagem_padrao", config_value: formData.mensagemPadrao, config_category: "producao", description: "Mensagem padrão de notificação", updated_by: user?.id },
        { config_key: "backup_auto", config_value: formData.backupAuto, config_category: "producao", description: "Frequência de backup automático", updated_by: user?.id },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("system_config")
          .upsert(update, { onConflict: "config_key" });

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "Os parâmetros de produção foram atualizados.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Parâmetros de Produção
        </CardTitle>
        <CardDescription>
          Configure tempo de produção, status padrão e automações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tempoProducao">Tempo Médio de Produção (horas)</Label>
            <Input
              id="tempoProducao"
              type="number"
              value={formData.tempoProducao}
              onChange={(e) => setFormData({ ...formData, tempoProducao: e.target.value })}
              placeholder="48"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backupAuto">Backup Automático</Label>
            <Select value={formData.backupAuto} onValueChange={(value) => setFormData({ ...formData, backupAuto: value })}>
              <SelectTrigger id="backupAuto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="daily">1x ao dia</SelectItem>
                <SelectItem value="weekly">1x por semana</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusInicial">Status Inicial do Pedido</Label>
            <Select value={formData.statusInicial} onValueChange={(value) => setFormData({ ...formData, statusInicial: value })}>
              <SelectTrigger id="statusInicial">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="pending">Aguardando Pagamento</SelectItem>
                <SelectItem value="in_production">Em Produção</SelectItem>
                <SelectItem value="ready">Pronto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusFinal">Status Final Automático</Label>
            <Select value={formData.statusFinal} onValueChange={(value) => setFormData({ ...formData, statusFinal: value })}>
              <SelectTrigger id="statusFinal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="completed">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notificacao"
                checked={formData.notificacaoAuto}
                onCheckedChange={(checked) => setFormData({ ...formData, notificacaoAuto: checked as boolean })}
              />
              <Label htmlFor="notificacao" className="cursor-pointer">
                Enviar notificação automática ao mudar status
              </Label>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="mensagemPadrao">Mensagem Padrão de Notificação</Label>
            <Textarea
              id="mensagemPadrao"
              value={formData.mensagemPadrao}
              onChange={(e) => setFormData({ ...formData, mensagemPadrao: e.target.value })}
              placeholder="Olá! Seu pedido #[id] está em produção..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Use [id] para o número do pedido, [nome] para nome do cliente
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          💾 Salvar Parâmetros
        </Button>
      </CardContent>
    </Card>
  );
};