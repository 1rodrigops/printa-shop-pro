import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TenantProvider } from "@/contexts/TenantContext";
import Index from "./pages/Index";
import Customize from "./pages/Customize";
import Shipping from "./pages/Shipping";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import MyOrder from "./pages/MyOrder";
import Reports from "./pages/Reports";
import Cadastro from "./pages/Cadastro";
import CadastroClientes from "./pages/CadastroClientes";
import CadastroUsuarios from "./pages/CadastroUsuarios";
import Permissoes from "./pages/Permissoes";
import Modulos from "./pages/Modulos";
import ModulosPorEmpresa from "./pages/ModulosPorEmpresa";
import SuperDashboard from "./pages/SuperDashboard";
import Empresas from "./pages/Empresas";
import Sites from "./pages/Sites";
import Paginas from "./pages/Paginas";
import Midias from "./pages/Midias";
import DynamicPage from "./pages/DynamicPage";
import Produtos from "./pages/Produtos";
import Vendas from "./pages/Vendas";
import Pedidos from "./pages/Pedidos";
import VendasDoDia from "./pages/VendasDoDia";
import HistoricoPedidos from "./pages/HistoricoPedidos";
import ProducaoInterna from "./pages/ProducaoInterna";
import QualidadeEntrega from "./pages/QualidadeEntrega";
import RelatoriosIntegrados from "./pages/RelatoriosIntegrados";
import FormasDePagamento from "./pages/FormasDePagamento";
import Financeiro from "./pages/Financeiro";
import Estoque from "./pages/Estoque";
import Utilidades from "./pages/Utilidades";
import Fornecedores from "./pages/Fornecedores";
import ApiWhatsApp from "./pages/ApiWhatsApp";
import ConfiguracoesGerais from "./pages/ConfiguracoesGerais";
import BackupSistema from "./pages/BackupSistema";
import LogsSistema from "./pages/LogsSistema";
import LogsWhatsApp from "./pages/LogsWhatsApp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TenantProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/personalizar" element={<Customize />} />
          <Route path="/envio" element={<Shipping />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/super-dashboard" element={<SuperDashboard />} />
          <Route path="/admin/:empresaSlug/modulos" element={<ModulosPorEmpresa />} />
          <Route path="/admin/cadastro" element={<Cadastro />} />
          <Route path="/admin/cadastro/clientes" element={<CadastroClientes />} />
          <Route path="/admin/cadastro/usuarios" element={<CadastroUsuarios />} />
          <Route path="/admin/cadastro/permissoes" element={<Permissoes />} />
          <Route path="/admin/cadastro/modulos" element={<Modulos />} />
          <Route path="/admin/empresas" element={<Empresas />} />
          <Route path="/admin/sites" element={<Sites />} />
          <Route path="/admin/sites/:siteId/paginas" element={<Paginas />} />
          <Route path="/admin/midias" element={<Midias />} />
          <Route path="/admin/cadastro/produtos" element={<Produtos />} />
          <Route path="/admin/cadastro/fornecedores" element={<Fornecedores />} />
          <Route path="/admin/vendas" element={<Vendas />} />
          <Route path="/admin/vendas/pedidos" element={<Pedidos />} />
          <Route path="/admin/vendas/diarias" element={<VendasDoDia />} />
          <Route path="/admin/vendas/historico" element={<HistoricoPedidos />} />
          <Route path="/admin/vendas/producao" element={<ProducaoInterna />} />
          <Route path="/admin/vendas/qualidade-entrega" element={<QualidadeEntrega />} />
          <Route path="/admin/vendas/relatorios" element={<RelatoriosIntegrados />} />
          <Route path="/admin/financeiro/forma-de-pagamento" element={<FormasDePagamento />} />
          <Route path="/admin/financeiro" element={<Financeiro />} />
          <Route path="/admin/estoque" element={<Estoque />} />
          <Route path="/admin/relatorios" element={<Reports />} />
          <Route path="/admin/utilidades" element={<Utilidades />} />
          <Route path="/admin/utilidades/configuracoes" element={<ConfiguracoesGerais />} />
          <Route path="/admin/utilidades/backup" element={<BackupSistema />} />
          <Route path="/admin/utilidades/logs" element={<LogsSistema />} />
          <Route path="/admin/utilidades/api-whatsapp" element={<ApiWhatsApp />} />
          <Route path="/admin/utilidades/logs-whatsapp" element={<LogsWhatsApp />} />
          <Route path="/meu-pedido" element={<MyOrder />} />
          <Route path="/page/:slug" element={<DynamicPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TenantProvider>
  </QueryClientProvider>
);

export default App;
