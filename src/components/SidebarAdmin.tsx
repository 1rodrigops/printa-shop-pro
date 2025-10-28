import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users, Package, ClipboardList, FileText,
  ShoppingCart, BarChart3, Settings,
  CreditCard, Database, Server, LogOut, ChevronDown, ChevronRight,
  Shirt, Truck, UserCog, Shield, Bell, AlertTriangle, Building2, Globe, Image
} from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UserRole = "superadmin" | "admin" | "moderator" | "cliente" | "user" | null;

function normalize(v?: string | null): string {
  return (v || "").toLowerCase().replace(/\s+/g, "_").trim();
}

function canSeeAdminPanel(role: UserRole, userEmail?: string): boolean {
  if (!role) {
    return false;
  }

  const allowedEmails = [
    "marketing@agilgas.com.br",
    "adm@agilgas.com.br",
    "admin@agilgas.com.br",
  ];

  if (userEmail && allowedEmails.includes(userEmail.toLowerCase())) {
    return true;
  }

  const normalizedRole = normalize(role);
  const allowedRoles = new Set([
    "admin",
    "super_admin",
    "superadmin",
    "owner",
    "root",
  ]);

  return allowedRoles.has(normalizedRole);
}

interface MenuItem {
  id: string;
  icon: any;
  label: string;
  path?: string;
  roles: string[];
  submenu?: {
    label: string;
    path: string;
    roles: string[];
  }[];
}

const menuItems: MenuItem[] = [
  {
    id: "empresas",
    icon: Building2,
    label: "Empresas",
    path: "/admin/empresas",
    roles: ["superadmin"],
  },
  {
    id: "cadastro",
    icon: Users,
    label: "Cadastro",
    roles: ["superadmin"],
    submenu: [
      { label: "Clientes", path: "/admin/cadastro/clientes", roles: ["superadmin"] },
      { label: "Fornecedores", path: "/admin/cadastro/fornecedores", roles: ["superadmin"] },
      { label: "Usuários", path: "/admin/cadastro/usuarios", roles: ["superadmin"] },
      { label: "Permissões", path: "/admin/cadastro/permissoes", roles: ["superadmin"] },
      { label: "Módulos", path: "/admin/cadastro/modulos", roles: ["superadmin"] },
      { label: "Produtos", path: "/admin/cadastro/produtos", roles: ["superadmin", "admin"] },
    ],
  },
  {
    id: "cms",
    icon: Globe,
    label: "CMS",
    roles: ["superadmin", "admin"],
    submenu: [
      { label: "Sites", path: "/admin/sites", roles: ["superadmin", "admin"] },
      { label: "Mídias", path: "/admin/midias", roles: ["superadmin", "admin"] },
    ],
  },
  {
    id: "vendas",
    icon: ShoppingCart,
    label: "Vendas",
    roles: ["superadmin", "admin"],
    submenu: [
      { label: "Pedidos", path: "/admin/vendas/pedidos", roles: ["superadmin", "admin"] },
      { label: "Vendas do Dia", path: "/admin/vendas/diarias", roles: ["superadmin", "admin"] },
      { label: "Histórico", path: "/admin/vendas/historico", roles: ["superadmin", "admin"] },
      { label: "Produção Interna", path: "/admin/vendas/producao", roles: ["superadmin", "admin"] },
      { label: "Qualidade e Entrega", path: "/admin/vendas/qualidade-entrega", roles: ["superadmin", "admin"] },
      { label: "Relatórios Integrados", path: "/admin/vendas/relatorios", roles: ["superadmin", "admin"] },
    ],
  },
  {
    id: "financeiro",
    icon: CreditCard,
    label: "Financeiro",
    roles: ["superadmin", "admin"],
    submenu: [
      { label: "Formas de Pagamento", path: "/admin/financeiro/forma-de-pagamento", roles: ["superadmin", "admin"] },
      { label: "Contas a Pagar", path: "/admin/financeiro/pagar", roles: ["superadmin", "admin"] },
      { label: "Contas a Receber", path: "/admin/financeiro/receber", roles: ["superadmin", "admin"] },
      { label: "Caixa Diário", path: "/admin/financeiro/caixa", roles: ["superadmin", "admin"] },
    ],
  },
  {
    id: "estoque",
    icon: Package,
    label: "Estoque",
    path: "/admin/estoque",
    roles: ["superadmin", "admin"],
  },
  {
    id: "relatorios",
    icon: BarChart3,
    label: "Relatórios",
    roles: ["superadmin", "admin"],
    submenu: [
      { label: "Relatório Semanal", path: "/admin/relatorios/semanal", roles: ["superadmin", "admin"] },
      { label: "Relatório Mensal", path: "/admin/relatorios/mensal", roles: ["superadmin", "admin"] },
      { label: "Logs de Auditoria", path: "/admin/relatorios/logs", roles: ["superadmin", "admin"] },
    ],
  },
  {
    id: "utilidades",
    icon: Settings,
    label: "Utilidades",
    roles: ["superadmin"],
    submenu: [
      { label: "Configurações", path: "/admin/utilidades/configuracoes", roles: ["superadmin"] },
      { label: "Backup", path: "/admin/utilidades/backup", roles: ["superadmin"] },
      { label: "Logs do Sistema", path: "/admin/utilidades/logs", roles: ["superadmin"] },
      { label: "API WhatsApp", path: "/admin/utilidades/api-whatsapp", roles: ["superadmin"] },
      { label: "Logs de Mensagens", path: "/admin/utilidades/logs-whatsapp", roles: ["superadmin", "admin"] },
    ],
  },
];

export default function SidebarAdmin() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [empresaModulos, setEmpresaModulos] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading, userEmail, debugInfo, empresaId } = useUserRole();
  const { tenant } = useTenant();

  const hasFullAccess = useMemo(() => {
    return canSeeAdminPanel(role, userEmail || undefined);
  }, [role, userEmail]);

  useEffect(() => {
    const carregarModulos = async () => {
      if (!empresaId && role !== "superadmin") return;

      if (role === "superadmin" && tenant?.nome === "Grupo Agil") {
        setEmpresaModulos(["cadastro", "vendas", "financeiro", "estoque", "relatorios", "utilidades", "meus_pedidos"]);
        return;
      }

      if (empresaId) {
        const { data, error } = await supabase
          .from("empresa_modulos")
          .select("modulo")
          .eq("empresa_id", empresaId)
          .eq("ativo", true);

        if (!error && data) {
          setEmpresaModulos(data.map(m => m.modulo));
        }
      }
    };

    carregarModulos();
  }, [empresaId, role, tenant]);

  const toggleSection = (sectionId: string) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

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

  const hasAccess = (roles: string[]) => {
    if (!role) return false;
    if (!roles.includes(role)) return false;

    if (role === "superadmin" && tenant?.nome === "Grupo Agil") {
      return true;
    }

    return false;
  };

  const moduloAtivo = (moduloId: string) => {
    if (role === "superadmin" && tenant?.nome === "Grupo Agil") {
      return true;
    }
    return empresaModulos.includes(moduloId);
  };

  const isActive = (path: string) => location.pathname === path;

  const filteredMenuItems = menuItems.filter(item => {
    if (!hasAccess(item.roles)) return false;
    if (item.id === "empresas") return role === "superadmin";
    if (item.id === "cms") return role === "superadmin";
    return moduloAtivo(item.id);
  });

  if (loading) {
    return (
      <aside className="w-64 bg-gray-900 text-gray-400 p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-sm">Carregando usuário...</p>
        </div>
      </aside>
    );
  }

  if (!hasFullAccess) {
    return (
      <aside className="w-64 min-h-screen bg-[#0f172a] text-gray-300 p-6 flex flex-col items-center justify-center">
        <div className="rounded-full border-2 border-red-500/40 p-4 mb-4 bg-red-500/10">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Acesso Restrito</h3>
        <p className="text-xs text-center opacity-80 mb-3 max-w-[200px]">
          Entre como administrador ou super administrador para visualizar o painel.
        </p>

        <div className="bg-gray-800/50 rounded-lg p-3 text-[10px] font-mono w-full max-w-[240px] space-y-2">
          <div>
            <p className="opacity-60 mb-1">Email:</p>
            <p className="text-white break-all">{userEmail || "não detectado"}</p>
          </div>

          <div>
            <p className="opacity-60 mb-1">Role detectada:</p>
            <p className="text-orange-400">{role || "null"}</p>
          </div>

          <div>
            <p className="opacity-60 mb-1">Status:</p>
            <p className="text-red-400">{debugInfo.detectedRole || "não carregado"}</p>
          </div>

          <div>
            <p className="opacity-60 mb-1">User ID:</p>
            <p className="text-gray-400 text-[8px] break-all">{debugInfo.userId || "n/a"}</p>
          </div>

          <div>
            <p className="opacity-60 mb-1">Raw Roles:</p>
            <p className="text-gray-400 text-[8px]">
              {debugInfo.rawRoles.length > 0
                ? JSON.stringify(debugInfo.rawRoles)
                : "nenhuma role encontrada"}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/auth")}
          className="mt-4 text-xs text-orange-500 hover:text-orange-400 underline"
        >
          Fazer login com outra conta
        </button>
      </aside>
    );
  }

  return (
    <>
      <aside
        className={`bg-[#111] text-white ${
          collapsed ? "w-20" : "w-64"
        } min-h-screen p-4 flex flex-col transition-all duration-300 shadow-lg`}
      >
        <div
          className="flex items-center justify-between mb-6 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setCollapsed(!collapsed)}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shirt className="w-8 h-8 text-orange-500" />
              <h1 className="text-xl font-bold text-orange-500">StampShirts</h1>
            </div>
          )}
          {collapsed && <Shirt className="w-8 h-8 text-orange-500 mx-auto" />}
          <ChevronRight
            className={`w-5 h-5 transform ${
              collapsed ? "rotate-0" : "rotate-180"
            } transition-transform`}
          />
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isOpen = openSection === item.id;

            if (item.submenu) {
              const filteredSubmenu = item.submenu.filter(sub => hasAccess(sub.roles));

              if (filteredSubmenu.length === 0) return null;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => toggleSection(item.id)}
                    className="flex items-center justify-between w-full text-left py-2 px-3 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        className={`w-4 h-4 transform transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>
                  {isOpen && !collapsed && (
                    <ul className="ml-8 mt-1 space-y-1">
                      {filteredSubmenu.map((subItem) => (
                        <li key={subItem.path}>
                          <Link
                            to={subItem.path}
                            className={`block py-2 px-3 rounded-md text-sm transition-colors ${
                              isActive(subItem.path)
                                ? "bg-orange-500 text-white"
                                : "hover:bg-gray-800"
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }

            if (item.path) {
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors ${
                    isActive(item.path)
                      ? "bg-orange-500 text-white"
                      : "hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            }

            return null;
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-800">
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="flex items-center gap-3 w-full py-2 px-3 rounded-md hover:bg-red-900/50 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

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
}
