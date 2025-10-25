import { useState, useEffect } from "react";
import AdminNavbar from "@/components/AdminNavbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, MessageSquare } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ConfiguracaoAPI } from "@/components/whatsapp/ConfiguracaoAPI";
import { MensagensAutomaticas } from "@/components/whatsapp/MensagensAutomaticas";
import { QRCodeConexao } from "@/components/whatsapp/QRCodeConexao";
import { TesteEnvio } from "@/components/whatsapp/TesteEnvio";

const mensagensPadrao = {
  pedido_recebido: "Olá {{nome}}, recebemos seu pedido #{{id}}! Em breve enviaremos detalhes.",
  seja_bem_vindo: "Olá {{nome}}, bem-vindo à StampShirts! Personalize suas camisetas conosco 👕✨",
  pagamento_recebido: "Pagamento do pedido #{{id}} confirmado! Agora sua camiseta vai para a produção.",
  em_producao: "Seu pedido #{{id}} está sendo estampado! 🔥",
  em_transporte: "🚚 Seu pedido #{{id}} foi enviado! Acompanhe aqui: {{link_rastreamento}}",
  finalizado: "🎉 Pedido #{{id}} entregue com sucesso! Esperamos que você ame sua camiseta ❤️",
};

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
    numeroWhatsApp: "",
  });

  const [mensagens, setMensagens] = useState(mensagensPadrao);

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
        .in("config_key", [
          "api_whatsapp_url",
          "api_whatsapp_key",
          "api_whatsapp_provider",
          "api_whatsapp_numero",
          "msg_pedido_recebido",
          "msg_seja_bem_vindo",
          "msg_pagamento_recebido",
          "msg_em_producao",
          "msg_em_transporte",
          "msg_finalizado"
        ]);

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
          numeroWhatsApp: config.api_whatsapp_numero || "",
        });

        setMensagens({
          pedido_recebido: config.msg_pedido_recebido || mensagensPadrao.pedido_recebido,
          seja_bem_vindo: config.msg_seja_bem_vindo || mensagensPadrao.seja_bem_vindo,
          pagamento_recebido: config.msg_pagamento_recebido || mensagensPadrao.pagamento_recebido,
          em_producao: config.msg_em_producao || mensagensPadrao.em_producao,
          em_transporte: config.msg_em_transporte || mensagensPadrao.em_transporte,
          finalizado: config.msg_finalizado || mensagensPadrao.finalizado,
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
        { config_key: "api_whatsapp_numero", config_value: formData.numeroWhatsApp, config_category: "whatsapp", description: "Número de WhatsApp remetente", updated_by: user?.id },
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

  const handleSaveMensagens = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates = [
        { config_key: "msg_pedido_recebido", config_value: mensagens.pedido_recebido, config_category: "whatsapp_messages", description: "Mensagem: Pedido Recebido", updated_by: user?.id },
        { config_key: "msg_seja_bem_vindo", config_value: mensagens.seja_bem_vindo, config_category: "whatsapp_messages", description: "Mensagem: Seja Bem-Vindo", updated_by: user?.id },
        { config_key: "msg_pagamento_recebido", config_value: mensagens.pagamento_recebido, config_category: "whatsapp_messages", description: "Mensagem: Pagamento Recebido", updated_by: user?.id },
        { config_key: "msg_em_producao", config_value: mensagens.em_producao, config_category: "whatsapp_messages", description: "Mensagem: Em Produção", updated_by: user?.id },
        { config_key: "msg_em_transporte", config_value: mensagens.em_transporte, config_category: "whatsapp_messages", description: "Mensagem: Em Transporte", updated_by: user?.id },
        { config_key: "msg_finalizado", config_value: mensagens.finalizado, config_category: "whatsapp_messages", description: "Mensagem: Finalizado", updated_by: user?.id },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("system_config")
          .upsert(update, { onConflict: "config_key" });

        if (error) throw error;
      }

      toast({
        title: "Mensagens salvas",
        description: "As mensagens automáticas foram atualizadas com sucesso.",
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

  const handleTestNumber = async () => {
    if (!formData.url || !formData.key || !formData.numeroWhatsApp) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos antes de testar o número.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const numeroLimpo = formData.numeroWhatsApp.replace(/[\s\(\)\-]/g, '');
      const response = await fetch(`${formData.url}/instance/info?number=${numeroLimpo}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${formData.key}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: "✅ Número ativo e conectado",
        });
        toast({
          title: "Número válido",
          description: "O número está ativo e conectado.",
        });
      } else {
        setTestResult({
          success: false,
          message: "❌ Não encontrado ou desconectado",
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `❌ Erro ao verificar número: ${error.message}`,
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
      numeroWhatsApp: "",
    });
    setTestResult(null);
  };

  const handleRestaurarMensagens = () => {
    setMensagens(mensagensPadrao);
    toast({
      title: "Mensagens restauradas",
      description: "As mensagens foram restauradas para os valores padrão.",
    });
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

        <div className="space-y-6">
          <ConfiguracaoAPI
            formData={formData}
            setFormData={setFormData}
            testResult={testResult}
            testing={testing}
            loading={loading}
            onTestConnection={handleTestConnection}
            onTestNumber={handleTestNumber}
            onSave={handleSave}
            onReset={handleReset}
          />

          <MensagensAutomaticas
            mensagens={mensagens}
            setMensagens={setMensagens}
            onSave={handleSaveMensagens}
            onRestaurar={handleRestaurarMensagens}
            loading={loading}
          />

          <QRCodeConexao
            apiUrl={formData.url}
            apiKey={formData.key}
            numeroWhatsApp={formData.numeroWhatsApp}
            provider={formData.provider}
          />

          <TesteEnvio
            apiUrl={formData.url}
            apiKey={formData.key}
          />
        </div>
      </div>
    </div>
  );
};

export default ApiWhatsApp;