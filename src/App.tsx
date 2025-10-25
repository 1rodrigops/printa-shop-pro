import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Vendas from "./pages/Vendas";
import Financeiro from "./pages/Financeiro";
import Estoque from "./pages/Estoque";
import Utilidades from "./pages/Utilidades";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="/admin/cadastro" element={<Cadastro />} />
          <Route path="/admin/cadastro/clientes" element={<CadastroClientes />} />
          <Route path="/admin/cadastro/usuarios" element={<CadastroUsuarios />} />
          <Route path="/admin/vendas" element={<Vendas />} />
          <Route path="/admin/financeiro" element={<Financeiro />} />
          <Route path="/admin/estoque" element={<Estoque />} />
          <Route path="/admin/relatorios" element={<Reports />} />
          <Route path="/admin/utilidades" element={<Utilidades />} />
          <Route path="/meu-pedido" element={<MyOrder />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
