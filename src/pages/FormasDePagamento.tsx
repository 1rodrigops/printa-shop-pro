import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminNavbar from "@/components/AdminNavbar";
import { CreditCard, QrCode, DollarSign, Activity } from "lucide-react";
import ConfiguracaoGeral from "@/components/pagamento/ConfiguracaoGeral";
import ConfiguracaoPIX from "@/components/pagamento/ConfiguracaoPIX";
import ConfiguracaoPagSeguro from "@/components/pagamento/ConfiguracaoPagSeguro";
import ConfiguracaoMercadoPago from "@/components/pagamento/ConfiguracaoMercadoPago";
import LogsPagamento from "@/components/pagamento/LogsPagamento";

const FormasDePagamento = () => {
  const [activeTab, setActiveTab] = useState("geral");

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Admin / Financeiro / Formas de Pagamento
          </p>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">💳 Formas de Pagamento</h1>
          <p className="text-muted-foreground">
            Configure e gerencie os métodos de pagamento disponíveis no seu site
          </p>
        </div>

        {/* Cards de Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                PIX
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Configurar</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                PagSeguro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Configurar</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Mercado Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Configurar</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Transações Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="geral">⚙️ Geral</TabsTrigger>
            <TabsTrigger value="pix">💚 PIX</TabsTrigger>
            <TabsTrigger value="pagseguro">🟡 PagSeguro</TabsTrigger>
            <TabsTrigger value="mercadopago">🔵 Mercado Pago</TabsTrigger>
            <TabsTrigger value="logs">📊 Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <ConfiguracaoGeral />
          </TabsContent>

          <TabsContent value="pix">
            <ConfiguracaoPIX />
          </TabsContent>

          <TabsContent value="pagseguro">
            <ConfiguracaoPagSeguro />
          </TabsContent>

          <TabsContent value="mercadopago">
            <ConfiguracaoMercadoPago />
          </TabsContent>

          <TabsContent value="logs">
            <LogsPagamento />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FormasDePagamento;