import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  UserPlus, 
  DollarSign, 
  CreditCard, 
  Package, 
  BarChart3, 
  Settings, 
  FileText,
  Bell,
  LogOut,
  User,
  Menu,
  X,
  Shirt,
  Users,
  Truck,
  UserCog,
  Shield
} from "lucide-react";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface MenuItem {
  icon: any;
  name: string;
  path: string;
  allowedRoles: UserRole[];
  submenu?: {
    icon: any;
    name: string;
    path: string;
    allowedRoles: UserRole[];
  }[];
}

const menuItems: MenuItem[] = [
  {
    icon: UserPlus,
    name: "Cadastro",
    path: "/admin/cadastro",
    allowedRoles: ["superadmin"],
    submenu: [
      { icon: Users, name: "Clientes", path: "/admin/cadastro/clientes", allowedRoles: ["superadmin"] },
      { icon: Truck, name: "Fornecedores", path: "/admin/cadastro/fornecedores", allowedRoles: ["superadmin"] },
      { icon: UserCog, name: "Usuários", path: "/admin/cadastro/usuarios", allowedRoles: ["superadmin"] },
      { icon: Shield, name: "Permissões", path: "/admin/cadastro/permissoes", allowedRoles: ["superadmin"] },
      { icon: Shirt, name: "Produtos", path: "/admin/cadastro/produtos", allowedRoles: ["superadmin", "admin"] },
    ],
  },
  {
    icon: DollarSign,
    name: "🧾 Vendas",
    path: "/admin/vendas",
    allowedRoles: ["superadmin", "admin"],
    submenu: [
      { icon: Package, name: "📦 Pedidos", path: "/admin/vendas/pedidos", allowedRoles: ["superadmin", "admin"] },
      { icon: BarChart3, name: "📊 Vendas do Dia", path: "/admin/vendas/diarias", allowedRoles: ["superadmin", "admin"] },
      { icon: FileText, name: "🕓 Histórico", path: "/admin/vendas/historico", allowedRoles: ["superadmin", "admin"] },
      { icon: Shirt, name: "🧵 Produção Interna", path: "/admin/vendas/producao", allowedRoles: ["superadmin", "admin"] },
      { icon: Shield, name: "🔍 Qualidade e Entrega", path: "/admin/vendas/qualidade-entrega", allowedRoles: ["superadmin", "admin"] },
      { icon: BarChart3, name: "📊 Relatórios Integrados", path: "/admin/vendas/relatorios", allowedRoles: ["superadmin", "admin"] },
    ],
  },
  {
    icon: CreditCard,
    name: "Financeiro",
    path: "/admin/financeiro",
    allowedRoles: ["superadmin", "admin"],
    submenu: [
      { icon: CreditCard, name: "💳 Formas de Pagamento", path: "/admin/financeiro/forma-de-pagamento", allowedRoles: ["superadmin", "admin"] },
      { icon: CreditCard, name: "Contas a Pagar", path: "/admin/financeiro/pagar", allowedRoles: ["superadmin", "admin"] },
      { icon: DollarSign, name: "Contas a Receber", path: "/admin/financeiro/receber", allowedRoles: ["superadmin", "admin"] },
      { icon: DollarSign, name: "Caixa Diário", path: "/admin/financeiro/caixa", allowedRoles: ["superadmin", "admin"] },
    ],
  },
  {
    icon: Package,
    name: "Estoque",
    path: "/admin/estoque",
    allowedRoles: ["superadmin", "admin"],
  },
  {
    icon: BarChart3,
    name: "Relatórios",
    path: "/admin/relatorios",
    allowedRoles: ["superadmin", "admin"],
    submenu: [
      { icon: BarChart3, name: "Relatório Semanal", path: "/admin/relatorios/semanal", allowedRoles: ["superadmin", "admin"] },
      { icon: BarChart3, name: "Relatório Mensal", path: "/admin/relatorios/mensal", allowedRoles: ["superadmin", "admin"] },
      { icon: FileText, name: "Logs de Auditoria", path: "/admin/relatorios/logs", allowedRoles: ["superadmin", "admin"] },
    ],
  },
  {
    icon: Settings,
    name: "Utilidades",
    path: "/admin/utilidades",
    allowedRoles: ["superadmin"],
    submenu: [
      { icon: Settings, name: "Configurações", path: "/admin/utilidades/configuracoes", allowedRoles: ["superadmin"] },
      { icon: Package, name: "Backup", path: "/admin/utilidades/backup", allowedRoles: ["superadmin"] },
      { icon: FileText, name: "Logs do Sistema", path: "/admin/utilidades/logs", allowedRoles: ["superadmin"] },
      { icon: Bell, name: "API WhatsApp", path: "/admin/utilidades/api-whatsapp", allowedRoles: ["superadmin"] },
      { icon: FileText, name: "Logs de Mensagens", path: "/admin/utilidades/logs-whatsapp", allowedRoles: ["superadmin", "admin"] },
    ],
  },
  {
    icon: FileText,
    name: "Meus Pedidos",
    path: "/meu-pedido",
    allowedRoles: ["superadmin", "admin", "cliente"],
  },
];

const AdminNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useUserRole();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  console.log("=== AdminNavbar Debug ===");
  console.log("Current role:", role);
  console.log("Filtered menu items:", menuItems.filter(item => role && item.allowedRoles.includes(role)));

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
      toast({
        title: "Logout realizado",
        description: "Você saiu com sucesso.",
      });
    }
  };

  const isActive = (path: string) => location.pathname === path;
  
  const isParentActive = (item: MenuItem) => {
    if (isActive(item.path)) return true;
    if (item.submenu) {
      return item.submenu.some(sub => isActive(sub.path));
    }
    return false;
  };

  const hasAccess = (allowedRoles: UserRole[]) => {
    return role && allowedRoles.includes(role);
  };

  const filteredMenuItems = menuItems.filter(item => hasAccess(item.allowedRoles));

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm h-16">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Shirt className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              StampShirts
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              
              if (item.submenu && item.submenu.length > 0) {
                const filteredSubmenu = item.submenu.filter(sub => hasAccess(sub.allowedRoles));
                
                if (filteredSubmenu.length === 0) return null;
                
                return (
                  <DropdownMenu key={item.path}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`h-10 px-4 py-2 text-sm font-medium transition-colors ${
                          isParentActive(item)
                            ? "text-primary bg-gray-100"
                            : "text-[#444] hover:text-black hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 bg-white z-50">
                      {filteredSubmenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <DropdownMenuItem key={subItem.path} asChild>
                            <Link
                              to={subItem.path}
                              className={`flex items-center cursor-pointer ${
                                isActive(subItem.path)
                                  ? "text-primary bg-gray-100"
                                  : ""
                              }`}
                            >
                              <SubIcon className="w-4 h-4 mr-2" />
                              {subItem.name}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center h-10 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.path)
                      ? "text-primary bg-gray-100"
                      : "text-[#444] hover:text-black hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Side - Notifications & User */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative hidden lg:flex">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                3
              </span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden lg:flex">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-white border-b shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                
                if (item.submenu && item.submenu.length > 0) {
                  const filteredSubmenu = item.submenu.filter(sub => hasAccess(sub.allowedRoles));
                  
                  if (filteredSubmenu.length === 0) return null;
                  
                  return (
                    <div key={item.path} className="space-y-1">
                      <div className="flex items-center px-3 py-2 text-sm font-medium text-[#444]">
                        <Icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </div>
                      <div className="pl-6 space-y-1">
                        {filteredSubmenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                isActive(subItem.path)
                                  ? "text-primary bg-gray-100"
                                  : "text-[#444] hover:text-black hover:bg-gray-100"
                              }`}
                            >
                              <SubIcon className="w-4 h-4 mr-2" />
                              {subItem.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.path)
                        ? "text-primary bg-gray-100"
                        : "text-[#444] hover:text-black hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Notificações (3)
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutDialog(true);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar logout</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair do sistema?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminNavbar;
