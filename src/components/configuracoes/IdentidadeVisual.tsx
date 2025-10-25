import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Palette } from "lucide-react";

export const IdentidadeVisual = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    corPrimaria: "#F97316",
    corSecundaria: "#000000",
    fontepadrao: "Poppins",
    tema: "light",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("system_config")
        .select("*")
        .in("config_key", ["cor_primaria", "cor_secundaria", "fonte_padrao", "tema_painel"]);

      if (error) throw error;

      if (data) {
        const config = data.reduce((acc: any, item: any) => {
          acc[item.config_key] = item.config_value;
          return acc;
        }, {});

        setFormData({
          corPrimaria: config.cor_primaria || "#F97316",
          corSecundaria: config.cor_secundaria || "#000000",
          fontepadrao: config.fonte_padrao || "Poppins",
          tema: config.tema_painel || "light",
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
        { config_key: "cor_primaria", config_value: formData.corPrimaria, config_category: "visual", description: "Cor primária do tema", updated_by: user?.id },
        { config_key: "cor_secundaria", config_value: formData.corSecundaria, config_category: "visual", description: "Cor secundária do tema", updated_by: user?.id },
        { config_key: "fonte_padrao", config_value: formData.fontepadrao, config_category: "visual", description: "Fonte padrão do sistema", updated_by: user?.id },
        { config_key: "tema_painel", config_value: formData.tema, config_category: "visual", description: "Tema do painel (light/dark)", updated_by: user?.id },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("system_config")
          .upsert(update, { onConflict: "config_key" });

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações de identidade visual foram atualizadas.",
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
          <Palette className="h-5 w-5 text-primary" />
          Identidade Visual
        </CardTitle>
        <CardDescription>
          Configure o logotipo, tema de cores e tipografia do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="corPrimaria">Cor Primária</Label>
            <div className="flex gap-2">
              <Input
                id="corPrimaria"
                type="color"
                value={formData.corPrimaria}
                onChange={(e) => setFormData({ ...formData, corPrimaria: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.corPrimaria}
                onChange={(e) => setFormData({ ...formData, corPrimaria: e.target.value })}
                placeholder="#F97316"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="corSecundaria">Cor Secundária</Label>
            <div className="flex gap-2">
              <Input
                id="corSecundaria"
                type="color"
                value={formData.corSecundaria}
                onChange={(e) => setFormData({ ...formData, corSecundaria: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.corSecundaria}
                onChange={(e) => setFormData({ ...formData, corSecundaria: e.target.value })}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fonte">Fonte Padrão</Label>
            <Select value={formData.fontepadrao} onValueChange={(value) => setFormData({ ...formData, fontepadrao: value })}>
              <SelectTrigger id="fonte">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="Poppins">Poppins</SelectItem>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tema">Tema do Painel</Label>
            <Select value={formData.tema} onValueChange={(value) => setFormData({ ...formData, tema: value })}>
              <SelectTrigger id="tema">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="light">Light (Claro)</SelectItem>
                <SelectItem value="dark">Dark (Escuro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Pré-visualização</h4>
          <div 
            className="p-4 rounded-lg border-2"
            style={{ 
              backgroundColor: formData.tema === "light" ? "#ffffff" : "#1a1a1a",
              borderColor: formData.corPrimaria,
              fontFamily: formData.fontepadrao
            }}
          >
            <h3 style={{ color: formData.corPrimaria }} className="text-lg font-bold mb-2">
              StampShirts
            </h3>
            <p style={{ color: formData.corSecundaria }} className="text-sm">
              Este é um exemplo de como o sistema ficará com as cores e fonte selecionadas.
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          💾 Salvar Alterações
        </Button>
      </CardContent>
    </Card>
  );
};