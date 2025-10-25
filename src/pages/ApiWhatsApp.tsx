import { useState, useEffect } from "react";
import AdminNavbar from "@/components/AdminNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ApiWhatsApp = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [formData, setFormData] = useState({
    url: "",
    key: "",
    provider: "WuzAPI",
  });

  useEffect(() => {
    if (role === "superadmin") {
      loadConfig();
    }
  }, [role]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_config")
        .select("*")
        .in("config_key", ["api_whatsapp_url", "api_whatsapp_key", "api_whatsapp_provider"]);

      if (error) throw error;

      if (data) {
        const config = data.reduce((acc: any, item: any) => {
          acc[item.config_key] = item.config_value;
          return acc;
        }, {});

        setFormData({
          url: config.api_whatsapp_url || "",
          key: config.api_whatsapp_key || "",
          provider: config.api_whatsapp_provider || "WuzAPI",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates = [
        { config_key: "api_whatsapp_url", config_value: formData.url, config_category: "whatsapp", description: "URL do servidor WhatsApp API", updated_by: user?.id },
        { config_key: "api_whatsapp_key", config_value: formData.key, config_category: "whatsapp", description: "Chave de API global WhatsApp", updated_by: user?.id },
        { config_key: "api_whatsapp_provider", config_value: formData.provider, config_category: "whatsapp", description: "Provedor de API WhatsApp", updated_by: user?.id },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("system_config")
          .upsert(update, { onConflict: "config_key" });

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações da API WhatsApp foram atualizadas com sucesso.",
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

  const handleTestConnection = async () => {
    if (!formData.url || !formData.key) {
      toast({
        title: "Dados incompletos",
        description: "Preencha URL e chave de API antes de testar.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${formData.url}/status`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${formData.key}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: "✅ Conexão estabelecida com sucesso! API WhatsApp está funcionando.",
        });
        toast({
          title: "Teste bem-sucedido",
          description: "A conexão com a API WhatsApp foi estabelecida.",
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ Falha na autenticação. Código HTTP: ${response.status}`,
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `❌ Erro de conexão: ${error.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      url: "",
      key: "",
      provider: "WuzAPI",
    });
    setTestResult(null);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== "superadmin") {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Alert variant="destructive">
            <AlertDescription>
              🚫 Acesso negado. Esta área é restrita ao SuperAdmin.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/utilidades">Utilidades</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>API WhatsApp</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">API WhatsApp</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuração da API WhatsApp</CardTitle>
            <CardDescription>
              Configure a integração com sua API de WhatsApp. Exemplo: WuzAPI (
              <a href="https://github.com/asternic/wuzapi" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                GitHub
              </a>
              ) ou Evolution API (
              <a href="https://github.com/EvolutionAPI/evolution-api" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                GitHub
              </a>
              ). Insira a URL de base e a chave de API concedida pela plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="provider">Provedor de API</Label>
              <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value })}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WuzAPI">WuzAPI</SelectItem>
                  <SelectItem value="Evolution API">Evolution API</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL do Servidor</Label>
              <Input
                id="url"
                type="text"
                placeholder="https://api.wuzapi.local/v1"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Chave de API Global</Label>
              <Input
                id="key"
                type="password"
                placeholder="••••••••••••••••"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              />
            </div>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                💾 Salvar Configuração
              </Button>
              <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                🔍 Testar Conexão
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                🔄 Resetar para Padrão
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiWhatsApp;