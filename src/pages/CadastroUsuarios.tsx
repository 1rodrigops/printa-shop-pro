import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { useAdminActivity } from "@/hooks/useAdminActivity";
import {
  Search,
  UserCog,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  X,
  Key,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const usuarioSchema = z.object({
  nome_completo: z.string()
    .trim()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string()
    .trim()
    .email("E-mail inválido")
    .max(255, "E-mail deve ter no máximo 255 caracteres"),
  senha: z.string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .optional()
    .or(z.literal("")),
  confirmar_senha: z.string().optional().or(z.literal("")),
  role: z.enum(["superadmin", "admin", "cliente"]),
  telefone: z.string().trim().max(15).optional(),
  status: z.enum(["ativo", "inativo"]),
}).refine((data) => {
  if (data.senha && data.senha !== data.confirmar_senha) {
    return false;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmar_senha"],
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

interface Usuario {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_sign_in_at?: string;
  metadata?: {
    nome_completo?: string;
    telefone?: string;
    status?: string;
  };
}

const CadastroUsuarios = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();
  const { logActivity } = useAdminActivity();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deletingUsuario, setDeletingUsuario] = useState<Usuario | null>(null);
  const [resetingUsuario, setResetingUsuario] = useState<Usuario | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      status: "ativo",
      role: "cliente",
    },
  });

  const senhaValue = watch("senha");

  // Verificar permissões
  useEffect(() => {
    if (!roleLoading && role !== "superadmin") {
      toast({
        title: "🚫 Acesso negado",
        description: "Apenas o SuperAdmin pode gerenciar logins.",
        variant: "destructive",
      });
      navigate("/admin");
    }
  }, [role, roleLoading, navigate]);

  // Buscar usuários
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ action: "list" }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao carregar usuários");
      }

      setUsuarios(result.users);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "superadmin") {
      fetchUsuarios();
    }
  }, [role]);

  // Salvar usuário
  const onSubmit = async (data: UsuarioFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (editingUsuario) {
        // Atualizar usuário existente
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              action: "update",
              data: {
                userId: editingUsuario.id,
                email: data.email,
                password: data.senha || undefined,
                nome_completo: data.nome_completo,
                telefone: data.telefone || "",
                status: data.status,
                role: data.role,
              },
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erro ao atualizar usuário");
        }

        await logActivity(
          "user_edit",
          `Atualizou dados do usuário ${data.email} (Função: ${data.role})`,
          { user_id: editingUsuario.id, email: data.email }
        );

        toast({
          title: "Usuário atualizado!",
          description: `${data.nome_completo} foi atualizado com sucesso.`,
        });
      } else {
        // Criar novo usuário
        if (!data.senha) {
          toast({
            title: "Senha obrigatória",
            description: "Defina uma senha para o novo usuário.",
            variant: "destructive",
          });
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              action: "create",
              data: {
                email: data.email,
                password: data.senha,
                nome_completo: data.nome_completo,
                telefone: data.telefone || "",
                status: data.status,
                role: data.role,
              },
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erro ao criar usuário");
        }

        await logActivity(
          "user_create",
          `Criou novo usuário ${data.email} (Função: ${data.role})`,
          { user_id: result.user.id, email: data.email }
        );

        toast({
          title: "Usuário criado!",
          description: `${data.nome_completo} foi criado com sucesso.`,
        });
      }

      reset();
      setEditingUsuario(null);
      fetchUsuarios();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Editar usuário
  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setValue("nome_completo", usuario.metadata?.nome_completo || "");
    setValue("email", usuario.email);
    
    // Garantir que o role é válido para o formulário
    const validRole: "superadmin" | "admin" | "cliente" = 
      usuario.role === "superadmin" || usuario.role === "admin" || usuario.role === "cliente"
        ? usuario.role
        : "cliente";
    setValue("role", validRole);
    
    setValue("telefone", usuario.metadata?.telefone || "");
    setValue("status", (usuario.metadata?.status as "ativo" | "inativo") || "ativo");
    setValue("senha", "");
    setValue("confirmar_senha", "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Excluir usuário
  const handleDelete = async () => {
    if (!deletingUsuario) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: "delete",
            data: { userId: deletingUsuario.id },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao excluir usuário");
      }

      await logActivity(
        "user_delete",
        `Excluiu usuário ${deletingUsuario.email}`,
        { user_id: deletingUsuario.id }
      );

      toast({
        title: "Usuário excluído!",
        description: `${deletingUsuario.email} foi excluído com sucesso.`,
      });

      setDeletingUsuario(null);
      fetchUsuarios();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Redefinir senha
  const handleResetPassword = async () => {
    if (!resetingUsuario) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetingUsuario.email,
        {
          redirectTo: `${window.location.origin}/auth`,
        }
      );

      if (error) throw error;

      await logActivity(
        "password_reset",
        `Redefiniu senha de ${resetingUsuario.email}`,
        { user_id: resetingUsuario.id }
      );

      toast({
        title: "E-mail enviado!",
        description: `Um link de redefinição de senha foi enviado para ${resetingUsuario.email}.`,
      });

      setResetingUsuario(null);
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    reset();
    setEditingUsuario(null);
  };

  // Filtrar usuários
  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usuario.metadata?.nome_completo || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "all" || usuario.role === filterRole;
    const matchesStatus =
      filterStatus === "all" || usuario.metadata?.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const paginatedUsuarios = filteredUsuarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleBadge = (role: UserRole) => {
    const config: Record<NonNullable<UserRole>, { label: string; variant: "default" | "secondary" | "outline" }> = {
      superadmin: { label: "SuperAdmin", variant: "default" },
      admin: { label: "Admin", variant: "secondary" },
      cliente: { label: "Cliente", variant: "outline" },
      moderator: { label: "Moderador", variant: "secondary" },
      user: { label: "Usuário", variant: "outline" },
    };

    if (!role) return <Badge variant="outline">Sem Role</Badge>;
    
    const roleConfig = config[role];
    return <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>;
  };

  const getStatusBadge = (status?: string) => {
    if (status === "inativo") {
      return <Badge variant="destructive">Inativo</Badge>;
    }
    return <Badge className="bg-green-600">Ativo</Badge>;
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />

      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Admin</span>
          <span>/</span>
          <span>Cadastro</span>
          <span>/</span>
          <span className="text-foreground font-medium">Usuários</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/admin/cadastro")}
              variant="outline"
              size="icon"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <UserCog className="h-8 w-8 text-primary" />
                👥 Gerenciamento de Usuários do Sistema
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie contas de acesso e permissões
              </p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {editingUsuario ? "Editar Usuário" : "Novo Usuário"}
            </CardTitle>
            <CardDescription>
              {editingUsuario
                ? "Atualize as informações do usuário"
                : "Preencha os dados para cadastrar um novo usuário"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="nome_completo">
                    Nome Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nome_completo"
                    {...register("nome_completo")}
                    placeholder="João da Silva"
                  />
                  {errors.nome_completo && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.nome_completo.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">
                    E-mail (Login) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="joao@empresa.com"
                    disabled={!!editingUsuario}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="senha">
                    Senha {!editingUsuario && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="senha"
                    type="password"
                    {...register("senha")}
                    placeholder={editingUsuario ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
                  />
                  {errors.senha && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.senha.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmar_senha">Confirmar Senha</Label>
                  <Input
                    id="confirmar_senha"
                    type="password"
                    {...register("confirmar_senha")}
                    placeholder="Digite a senha novamente"
                    disabled={!senhaValue}
                  />
                  {errors.confirmar_senha && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.confirmar_senha.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">
                    Função / Nível de Acesso <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch("role")}
                    onValueChange={(value) => setValue("role", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superadmin">SuperAdmin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    {...register("telefone")}
                    placeholder="(99) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status da Conta</Label>
                  <Select
                    value={watch("status")}
                    onValueChange={(value) => setValue("status", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="gap-2">
                  <Save className="w-4 h-4" />
                  {editingUsuario ? "Atualizar Usuário" : "Salvar Usuário"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Limpar Campos
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Listagem */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  {filteredUsuarios.length} usuário(s) encontrado(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Busca e Filtros */}
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  <SelectItem value="superadmin">SuperAdmin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsuarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">
                          {usuario.metadata?.nome_completo || "-"}
                        </TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>{getRoleBadge(usuario.role)}</TableCell>
                        <TableCell>
                          {usuario.last_sign_in_at
                            ? format(new Date(usuario.last_sign_in_at), "dd/MM/yyyy HH:mm", {
                                locale: ptBR,
                              })
                            : "Nunca"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(usuario.metadata?.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(usuario)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setResetingUsuario(usuario)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingUsuario(usuario)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog
        open={!!deletingUsuario}
        onOpenChange={() => setDeletingUsuario(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o usuário{" "}
              <strong>{deletingUsuario?.email}</strong>. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de redefinição de senha */}
      <AlertDialog
        open={!!resetingUsuario}
        onOpenChange={() => setResetingUsuario(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Um e-mail será enviado para <strong>{resetingUsuario?.email}</strong>{" "}
              com instruções para redefinir a senha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>
              Enviar E-mail
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CadastroUsuarios;
