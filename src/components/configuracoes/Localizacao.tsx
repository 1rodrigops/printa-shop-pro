import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe } from "lucide-react";

export const Localizacao = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    idioma: "pt-BR",
    moeda: "BRL",
    formatoData: "DD/MM/YYYY",
    fusoHorario: "America/Sao_Paulo",
    localizacaoLoja: "Curitiba, PR, Brasil",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("system_config")
        .select("*")
        .in("config_key", ["idioma_padrao", "moeda_padrao", "formato_data", "fuso_horario", "localizacao_loja"]);

      if (error) throw error;

      if (data) {
        const config = data.reduce((acc: any, item: any) => {
          acc[item.config_key] = item.config_value;
          return acc;
        }, {});

        setFormData({
          idioma: config.idioma_padrao || "pt-BR",
          moeda: config.moeda_padrao || "BRL",
          formatoData: config.formato_data || "DD/MM/YYYY",
          fusoHorario: config.fuso_horario || "America/Sao_Paulo",
          localizacaoLoja: config.localizacao_loja || "Curitiba, PR, Brasil",
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
        { config_key: "idioma_padrao", config_value: formData.idioma, config_category: "localizacao", description: "Idioma padrão do sistema", updated_by: user?.id },
        { config_key: "moeda_padrao", config_value: formData.moeda, config_category: "localizacao", description: "Moeda padrão", updated_by: user?.id },
        { config_key: "formato_data", config_value: formData.formatoData, config_category: "localizacao", description: "Formato de data", updated_by: user?.id },
        { config_key: "fuso_horario", config_value: formData.fusoHorario, config_category: "localizacao", description: "Fuso horário", updated_by: user?.id },
        { config_key: "localizacao_loja", config_value: formData.localizacaoLoja, config_category: "localizacao", description: "Localização da loja", updated_by: user?.id },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("system_config")
          .upsert(update, { onConflict: "config_key" });

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações de localização foram atualizadas.",
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
          <Globe className="h-5 w-5 text-primary" />
          Localização
        </CardTitle>
        <CardDescription>
          Configure idioma, moeda, formato de data e fuso horário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="idioma">Idioma Padrão</Label>
            <Select value={formData.idioma} onValueChange={(value) => setFormData({ ...formData, idioma: value })}>
              <SelectTrigger id="idioma">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="pt-BR">Português (BR)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moeda">Moeda Padrão</Label>
            <Select value={formData.moeda} onValueChange={(value) => setFormData({ ...formData, moeda: value })}>
              <SelectTrigger id="moeda">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="BRL">Real (R$)</SelectItem>
                <SelectItem value="USD">Dólar (US$)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formatoData">Formato de Data</Label>
            <Select value={formData.formatoData} onValueChange={(value) => setFormData({ ...formData, formatoData: value })}>
              <SelectTrigger id="formatoData">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fusoHorario">Fuso Horário</Label>
            <Select value={formData.fusoHorario} onValueChange={(value) => setFormData({ ...formData, fusoHorario: value })}>
              <SelectTrigger id="fusoHorario">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="America/Sao_Paulo">America/Sao_Paulo (GMT-3)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="localizacao">Localização da Loja</Label>
            <Input
              id="localizacao"
              type="text"
              value={formData.localizacaoLoja}
              onChange={(e) => setFormData({ ...formData, localizacaoLoja: e.target.value })}
              placeholder="Curitiba, PR, Brasil"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          💾 Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
};