import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CadastroPageLayout } from "@/components/cadastro/CadastroPageLayout";
import { CadastroFormCard } from "@/components/cadastro/CadastroFormCard";
import { CadastroTable } from "@/components/cadastro/CadastroTable";
import { CadastroPagination } from "@/components/cadastro/CadastroPagination";
import { CadastroFormActions } from "@/components/cadastro/CadastroFormActions";
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
  UserPlus,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordConfirmInput } from "@/components/PasswordConfirmInput";

const passwordRequirements = z.string()
  .min(9, "Senha deve ter no mínimo 9 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Senha deve conter pelo menos um símbolo especial")
  .refine((val) => !/\s/.test(val), "Senha não pode conter espaços");

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
  criar_login: z.boolean().optional(),
  senha: z.union([passwordRequirements, z.literal("")]).optional(),
  confirmar_senha: z.string().optional().or(z.literal("")),
  endereco_rua: z.string().trim().max(200).optional(),
  endereco_numero: z.string().trim().max(20).optional(),
  endereco_bairro: z.string().trim().max(100).optional(),
  endereco_cidade: z.string().trim().max(100).optional(),
  endereco_uf: z.string().trim().max(2).optional(),
  cep: z.string().trim().max(10).optional(),
  observacoes: z.string().trim().max(1000).optional(),
}).refine((data) => {
  if (data.criar_login && data.senha && data.senha !== data.confirmar_senha) {
    return false;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmar_senha"],
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
  const [criarLogin, setCriarLogin] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

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

      if (criarLogin && !editingCliente) {
        if (!senha) {
          toast({
            title: "Senha obrigatória",
            description: "Defina uma senha para criar o login do cliente.",
            variant: "destructive",
          });
          return;
        }

        if (senha !== confirmarSenha) {
          toast({
            title: "Senhas não coincidem",
            description: "Verifique e tente novamente.",
            variant: "destructive",
          });
          return;
        }

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
                action: "create",
                data: {
                  email: data.email,
                  password: senha,
                  nome_completo: data.nome_completo,
                  telefone: data.telefone,
                  status: "ativo",
                  role: "cliente",
                },
              }),
            }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || "Erro ao criar login do cliente");
          }

          toast({
            title: "Login criado!",
            description: `Login criado para ${data.email}`,
          });
        } catch (error: any) {
          toast({
            title: "Erro ao criar login",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      }

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
      setCriarLogin(false);
      setSenha("");
      setConfirmarSenha("");
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
    setCriarLogin(false);
    setSenha("");
    setConfirmarSenha("");
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
    <CadastroPageLayout
      title="Cadastro de Clientes"
      subtitle="Gerencie o cadastro de clientes da empresa"
      icon={UserPlus}
      breadcrumb="Clientes"
    >

        <CadastroFormCard
          title="Cliente"
          description="do cliente"
          editing={!!editingCliente}
        >
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

              {!editingCliente && (
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Criar Login de Acesso?</CardTitle>
                    <CardDescription>
                      O cliente poderá fazer login no sistema com email e senha
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        onClick={() => {
                          setCriarLogin(true);
                        }}
                        variant={criarLogin ? "default" : "outline"}
                        className="flex-1"
                      >
                        Sim, criar login
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setCriarLogin(false);
                          setSenha("");
                          setConfirmarSenha("");
                        }}
                        variant={!criarLogin ? "default" : "outline"}
                        className="flex-1"
                      >
                        Não criar login
                      </Button>
                    </div>

                    {criarLogin && (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <PasswordInput
                            value={senha}
                            onChange={setSenha}
                            label="Senha de Acesso"
                            placeholder="Crie uma senha segura para o cliente"
                            showStrengthIndicator={true}
                          />
                        </div>
                        <div>
                          <PasswordConfirmInput
                            value={confirmarSenha}
                            onChange={setConfirmarSenha}
                            passwordValue={senha}
                            label="Confirmar Senha"
                            placeholder="Digite a senha novamente"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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

              <CadastroFormActions
                editing={!!editingCliente}
                onClear={handleClear}
                submitLabel={editingCliente ? "Atualizar Cliente" : "Salvar Cliente"}
              />
            </form>
        </CadastroFormCard>

        <CadastroTable
          title="Clientes Cadastrados"
          count={filteredClientes.length}
          searchPlaceholder="Buscar por nome, telefone, e-mail ou CPF/CNPJ..."
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          headerActions={
            <Button onClick={exportarCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          }
          pagination={
            <CadastroPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          }
        >
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
        </CadastroTable>

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
    </CadastroPageLayout>
  );
};

export default CadastroClientes;
