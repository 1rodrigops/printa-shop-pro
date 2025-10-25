import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminActivity } from "@/hooks/useAdminActivity";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Download,
  ArrowLeft,
  Save,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const clienteSchema = z.object({
  nome_completo: z.string()
    .trim()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  cpf_cnpj: z.string()
    .trim()
    .min(11, "CPF/CNPJ inválido")
    .max(18, "CPF/CNPJ inválido"),
  telefone: z.string()
    .trim()
    .min(10, "Telefone inválido")
    .max(15, "Telefone inválido"),
  email: z.string()
    .trim()
    .email("E-mail inválido")
    .max(255, "E-mail deve ter no máximo 255 caracteres"),
  endereco_rua: z.string().trim().max(200).optional(),
  endereco_numero: z.string().trim().max(20).optional(),
  endereco_bairro: z.string().trim().max(100).optional(),
  endereco_cidade: z.string().trim().max(100).optional(),
  endereco_uf: z.string().trim().max(2).optional(),
  cep: z.string().trim().max(10).optional(),
  observacoes: z.string().trim().max(1000).optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface Cliente extends ClienteFormData {
  id: string;
  created_at: string;
  updated_at: string;
  cadastrado_por: string | null;
}

const CadastroClientes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();
  const { logActivity } = useAdminActivity();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
  });

  useEffect(() => {
    if (!roleLoading && role !== "superadmin" && role !== "admin") {
      toast({
        title: "🚫 Acesso negado",
        description: "Esta área é restrita a administradores.",
        variant: "destructive",
      });
      navigate("/meu-pedido");
    }
  }, [role, roleLoading, navigate]);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "superadmin" || role === "admin") {
      fetchClientes();
    }
  }, [role]);

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setValue("endereco_rua", data.logradouro);
        setValue("endereco_bairro", data.bairro);
        setValue("endereco_cidade", data.localidade);
        setValue("endereco_uf", data.uf);
        toast({
          title: "CEP encontrado!",
          description: "Endereço preenchido automaticamente.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
  };

  const onSubmit = async (data: ClienteFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (editingCliente) {
        const { error } = await supabase
          .from("clientes")
          .update(data)
          .eq("id", editingCliente.id);

        if (error) throw error;

        await logActivity(
          "cadastro_edit",
          `Atualizou cadastro do cliente ${data.nome_completo}`,
          { cliente_id: editingCliente.id }
        );

        toast({
          title: "Cliente atualizado!",
          description: `${data.nome_completo} foi atualizado com sucesso.`,
        });
      } else {
        const newCliente = {
          nome_completo: data.nome_completo,
          cpf_cnpj: data.cpf_cnpj,
          telefone: data.telefone,
          email: data.email,
          endereco_rua: data.endereco_rua || null,
          endereco_numero: data.endereco_numero || null,
          endereco_bairro: data.endereco_bairro || null,
          endereco_cidade: data.endereco_cidade || null,
          endereco_uf: data.endereco_uf || null,
          cep: data.cep || null,
          observacoes: data.observacoes || null,
          cadastrado_por: user.id,
        };

        const { error } = await supabase
          .from("clientes")
          .insert([newCliente]);

        if (error) throw error;

        await logActivity(
          "cadastro_create",
          `Cadastrou novo cliente ${data.nome_completo}`,
          { nome: data.nome_completo }
        );

        toast({
          title: "Cliente cadastrado!",
          description: `${data.nome_completo} foi cadastrado com sucesso.`,
        });
      }

      reset();
      setEditingCliente(null);
      fetchClientes();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar cliente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    Object.keys(cliente).forEach((key) => {
      if (key in clienteSchema.shape) {
        setValue(key as keyof ClienteFormData, cliente[key as keyof Cliente] as any);
      }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    if (!deletingCliente) return;

    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", deletingCliente.id);

      if (error) throw error;

      await logActivity(
        "cadastro_delete",
        `Excluiu cliente ${deletingCliente.nome_completo}`,
        { cliente_id: deletingCliente.id }
      );

      toast({
        title: "Cliente excluído!",
        description: `${deletingCliente.nome_completo} foi excluído com sucesso.`,
      });

      setDeletingCliente(null);
      fetchClientes();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    reset();
    setEditingCliente(null);
  };

  const exportarCSV = () => {
    const headers = ["Nome", "Telefone", "E-mail", "Cidade", "Data de Cadastro"];
    const rows = filteredClientes.map((cliente) => [
      cliente.nome_completo,
      cliente.telefone,
      cliente.email,
      cliente.endereco_cidade || "-",
      format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR }),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast({
      title: "CSV exportado!",
      description: "Arquivo baixado com sucesso.",
    });
  };

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cpf_cnpj.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const paginatedClientes = filteredClientes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Admin</span>
          <span>/</span>
          <span>Cadastro</span>
          <span>/</span>
          <span className="text-foreground font-medium">Clientes</span>
        </div>

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
                <UserPlus className="h-8 w-8 text-primary" />
                Cadastro de Clientes
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie o cadastro de clientes da empresa
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingCliente ? "Editar Cliente" : "Novo Cliente"}
            </CardTitle>
            <CardDescription>
              {editingCliente
                ? "Atualize as informações do cliente"
                : "Preencha os dados para cadastrar um novo cliente"}
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
                  <Label htmlFor="cpf_cnpj">
                    CPF / CNPJ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cpf_cnpj"
                    {...register("cpf_cnpj")}
                    placeholder="000.000.000-00"
                  />
                  {errors.cpf_cnpj && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.cpf_cnpj.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="telefone">
                    Telefone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="telefone"
                    {...register("telefone")}
                    placeholder="(99) 99999-9999"
                  />
                  {errors.telefone && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.telefone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">
                    E-mail <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="joao@email.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    {...register("cep")}
                    placeholder="00000-000"
                    onBlur={(e) => buscarCep(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="endereco_rua">Rua</Label>
                  <Input id="endereco_rua" {...register("endereco_rua")} />
                </div>

                <div>
                  <Label htmlFor="endereco_numero">Número</Label>
                  <Input id="endereco_numero" {...register("endereco_numero")} />
                </div>

                <div>
                  <Label htmlFor="endereco_bairro">Bairro</Label>
                  <Input id="endereco_bairro" {...register("endereco_bairro")} />
                </div>

                <div>
                  <Label htmlFor="endereco_cidade">Cidade</Label>
                  <Input id="endereco_cidade" {...register("endereco_cidade")} />
                </div>

                <div>
                  <Label htmlFor="endereco_uf">UF</Label>
                  <Input
                    id="endereco_uf"
                    {...register("endereco_uf")}
                    placeholder="PR"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  {...register("observacoes")}
                  placeholder="Notas internas sobre o cliente..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="gap-2">
                  <Save className="w-4 h-4" />
                  {editingCliente ? "Atualizar Cliente" : "Salvar Cliente"}
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

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Clientes Cadastrados</CardTitle>
                <CardDescription>
                  {filteredClientes.length} cliente(s) encontrado(s)
                </CardDescription>
              </div>
              <Button onClick={exportarCSV} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone, e-mail ou CPF/CNPJ..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedClientes.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">
                          {cliente.nome_completo}
                        </TableCell>
                        <TableCell>{cliente.telefone}</TableCell>
                        <TableCell>{cliente.email}</TableCell>
                        <TableCell>{cliente.endereco_cidade || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(cliente.updated_at), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(cliente)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {role === "superadmin" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingCliente(cliente)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

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

      <AlertDialog
        open={!!deletingCliente}
        onOpenChange={() => setDeletingCliente(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o cliente{" "}
              <strong>{deletingCliente?.nome_completo}</strong>. Esta ação não
              pode ser desfeita.
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
    </div>
  );
};

export default CadastroClientes;
