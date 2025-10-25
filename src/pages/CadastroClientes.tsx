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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminActivity } from "@/hooks/useAdminActivity";
import { toast } from "sonner";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  ArrowLeft,
  Save,
  X
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const clienteSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  cpf_cnpj: z.string().min(11, "CPF/CNPJ inválido").max(18),
  telefone: z.string().min(10, "Telefone inválido").max(15),
  email: z.string().email("Email inválido").max(255),
  endereco_rua: z.string().max(200).optional(),
  endereco_numero: z.string().max(20).optional(),
  endereco_bairro: z.string().max(100).optional(),
  endereco_cidade: z.string().max(100).optional(),
  endereco_uf: z.string().max(2).optional(),
  cep: z.string().max(10).optional(),
  observacoes: z.string().max(1000).optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface Cliente extends ClienteFormData {
  id: string;
  created_at: string;
  updated_at: string;
}

const CadastroClientes = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const { logActivity } = useAdminActivity();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
  });

  // Verificar permissões
  useEffect(() => {
    if (!roleLoading && role !== "superadmin" && role !== "admin") {
      toast.error("🚫 Acesso negado. Esta área é restrita a administradores.");
      navigate("/admin");
    }
  }, [role, roleLoading, navigate]);

  // Buscar clientes
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
      toast.error("Erro ao carregar clientes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "superadmin" || role === "admin") {
      fetchClientes();
    }
  }, [role]);

  // Buscar CEP
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
        toast.success("CEP encontrado!");
      } else {
        toast.error("CEP não encontrado");
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    }
  };

  // Salvar cliente
  const onSubmit = async (data: ClienteFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (editingCliente) {
        // Atualizar
        const { error } = await supabase
          .from("clientes")
          .update(data)
          .eq("id", editingCliente.id);

        if (error) throw error;

        await logActivity(
          "cadastro_edit",
          `Atualizou cadastro do cliente ${data.nome_completo}`,
          { cliente_id: editingCliente.id, ...data }
        );

        toast.success("Cliente atualizado com sucesso!");
      } else {
        // Criar novo
        const { error } = await supabase
          .from("clientes")
          .insert([{ 
            nome_completo: data.nome_completo,
            cpf_cnpj: data.cpf_cnpj,
            telefone: data.telefone,
            email: data.email,
            endereco_rua: data.endereco_rua,
            endereco_numero: data.endereco_numero,
            endereco_bairro: data.endereco_bairro,
            endereco_cidade: data.endereco_cidade,
            endereco_uf: data.endereco_uf,
            cep: data.cep,
            observacoes: data.observacoes,
            cadastrado_por: user?.id 
          }]);

        if (error) throw error;

        await logActivity(
          "cadastro_create",
          `Cadastrou cliente ${data.nome_completo}`,
          data
        );

        toast.success("Cliente cadastrado com sucesso!");
      }

      reset();
      setEditingCliente(null);
      fetchClientes();
    } catch (error: any) {
      toast.error("Erro ao salvar cliente: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Editar cliente
  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    Object.keys(cliente).forEach((key) => {
      setValue(key as keyof ClienteFormData, cliente[key as keyof Cliente]);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Confirmar exclusão
  const confirmDelete = (cliente: Cliente) => {
    setClienteToDelete(cliente);
    setDeleteDialogOpen(true);
  };

  // Excluir cliente
  const handleDelete = async () => {
    if (!clienteToDelete) return;

    if (role !== "superadmin") {
      toast.error("Apenas SuperAdmin pode excluir clientes");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", clienteToDelete.id);

      if (error) throw error;

      await logActivity(
        "cadastro_delete",
        `Excluiu cliente ${clienteToDelete.nome_completo}`,
        { cliente_id: clienteToDelete.id }
      );

      toast.success("Cliente excluído com sucesso!");
      fetchClientes();
    } catch (error: any) {
      toast.error("Erro ao excluir cliente: " + error.message);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  };

  // Exportar CSV
  const exportarCSV = () => {
    const headers = ["Nome", "Telefone", "Email", "Cidade"];
    const rows = filteredClientes.map(c => [
      c.nome_completo,
      c.telefone,
      c.email,
      c.endereco_cidade || "-"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast.success("CSV exportado com sucesso!");
  };

  // Filtrar clientes
  const filteredClientes = clientes.filter(cliente =>
    cliente.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cpf_cnpj.includes(searchTerm)
  );

  // Paginação
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const paginatedClientes = filteredClientes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Admin
          </Button>
          <span>/</span>
          <span>Cadastro</span>
          <span>/</span>
          <span className="text-foreground font-medium">Clientes</span>
        </div>

        {/* Formulário */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingCliente ? (
                <>
                  <Edit className="w-5 h-5 text-primary" />
                  Editar Cliente
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary" />
                  Novo Cliente
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_completo">Nome Completo *</Label>
                  <Input
                    id="nome_completo"
                    {...register("nome_completo")}
                    placeholder="João Silva"
                  />
                  {errors.nome_completo && (
                    <p className="text-sm text-red-500 mt-1">{errors.nome_completo.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cpf_cnpj">CPF / CNPJ *</Label>
                  <Input
                    id="cpf_cnpj"
                    {...register("cpf_cnpj")}
                    placeholder="000.000.000-00"
                  />
                  {errors.cpf_cnpj && (
                    <p className="text-sm text-red-500 mt-1">{errors.cpf_cnpj.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    {...register("telefone")}
                    placeholder="(41) 99999-9999"
                  />
                  {errors.telefone && (
                    <p className="text-sm text-red-500 mt-1">{errors.telefone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="joao@email.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    {...register("cep")}
                    placeholder="00000-000"
                    onBlur={(e) => buscarCep(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="endereco_rua">Rua</Label>
                  <Input
                    id="endereco_rua"
                    {...register("endereco_rua")}
                    placeholder="Rua das Flores"
                  />
                </div>

                <div>
                  <Label htmlFor="endereco_numero">Número</Label>
                  <Input
                    id="endereco_numero"
                    {...register("endereco_numero")}
                    placeholder="123"
                  />
                </div>

                <div>
                  <Label htmlFor="endereco_bairro">Bairro</Label>
                  <Input
                    id="endereco_bairro"
                    {...register("endereco_bairro")}
                    placeholder="Centro"
                  />
                </div>

                <div>
                  <Label htmlFor="endereco_cidade">Cidade</Label>
                  <Input
                    id="endereco_cidade"
                    {...register("endereco_cidade")}
                    placeholder="Curitiba"
                  />
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

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "Salvando..." : editingCliente ? "Atualizar" : "Salvar Cliente"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setEditingCliente(null);
                  }}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Listagem */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle>Clientes Cadastrados ({filteredClientes.length})</CardTitle>
              
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome, telefone ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full md:w-80"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={exportarCSV} className="gap-2">
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum cliente cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedClientes.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">{cliente.nome_completo}</TableCell>
                        <TableCell>{cliente.telefone}</TableCell>
                        <TableCell>{cliente.email}</TableCell>
                        <TableCell>{cliente.endereco_cidade || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(cliente.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(cliente)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {role === "superadmin" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(cliente)}
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

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{clienteToDelete?.nome_completo}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CadastroClientes;
