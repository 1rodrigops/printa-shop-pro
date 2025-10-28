import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { CadastroPageLayout } from "@/components/cadastro/CadastroPageLayout";
import { CadastroFormCard } from "@/components/cadastro/CadastroFormCard";
import { CadastroTable } from "@/components/cadastro/CadastroTable";
import { CadastroPagination } from "@/components/cadastro/CadastroPagination";
import { CadastroFormActions } from "@/components/cadastro/CadastroFormActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Building2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const empresaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  dominio: z.string().min(3, "Domínio inválido"),
  slug: z.string().min(2, "Slug deve ter no mínimo 2 caracteres"),
  logo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  cor_primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (ex: #111111)"),
  cor_accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (ex: #FF6A00)"),
  cor_bg: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (ex: #0B0B0B)"),
  cor_text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (ex: #FFFFFF)"),
  status: z.enum(["ativo", "inativo"]),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

interface Empresa extends EmpresaFormData {
  id: string;
  created_at: string;
  updated_at: string;
}

const Empresas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [deletingEmpresa, setDeletingEmpresa] = useState<Empresa | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      status: "ativo",
      cor_primary: "#111111",
      cor_accent: "#FF6A00",
      cor_bg: "#0B0B0B",
      cor_text: "#FFFFFF",
    },
  });

  useEffect(() => {
    if (!roleLoading && role !== "superadmin") {
      toast({
        title: "Acesso negado",
        description: "Apenas o SuperAdmin pode gerenciar empresas.",
        variant: "destructive",
      });
      navigate("/admin");
    }
  }, [role, roleLoading, navigate]);

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "superadmin") {
      fetchEmpresas();
    }
  }, [role]);

  const onSubmit = async (data: EmpresaFormData) => {
    try {
      if (editingEmpresa) {
        const { error } = await supabase
          .from("empresas")
          .update(data)
          .eq("id", editingEmpresa.id);

        if (error) throw error;

        toast({
          title: "Empresa atualizada!",
          description: `${data.nome} foi atualizada com sucesso.`,
        });
      } else {
        const { error } = await supabase.from("empresas").insert([data]);

        if (error) throw error;

        toast({
          title: "Empresa criada!",
          description: `${data.nome} foi criada com sucesso.`,
        });
      }

      reset();
      setEditingEmpresa(null);
      fetchEmpresas();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar empresa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    Object.keys(empresa).forEach((key) => {
      if (key in empresaSchema.shape) {
        setValue(key as keyof EmpresaFormData, empresa[key as keyof Empresa] as any);
      }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    if (!deletingEmpresa) return;

    try {
      const { error } = await supabase
        .from("empresas")
        .delete()
        .eq("id", deletingEmpresa.id);

      if (error) throw error;

      toast({
        title: "Empresa excluída!",
        description: `${deletingEmpresa.nome} foi excluída com sucesso.`,
      });

      setDeletingEmpresa(null);
      fetchEmpresas();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir empresa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    reset();
    setEditingEmpresa(null);
  };

  const filteredEmpresas = empresas.filter(
    (empresa) =>
      empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.dominio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmpresas.length / itemsPerPage);
  const paginatedEmpresas = filteredEmpresas.slice(
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
      title="Gerenciamento de Empresas"
      subtitle="Empresas do Grupo Ágil"
      icon={Building2}
      breadcrumb="Empresas"
    >
      <CadastroFormCard
        title="Empresa"
        description="da empresa"
        editing={!!editingEmpresa}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="nome">
                Nome da Empresa <span className="text-destructive">*</span>
              </Label>
              <Input id="nome" {...register("nome")} placeholder="AgilUniformes" />
              {errors.nome && (
                <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dominio">
                Domínio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dominio"
                {...register("dominio")}
                placeholder="agiluniformes.com.br"
              />
              {errors.dominio && (
                <p className="text-sm text-destructive mt-1">{errors.dominio.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input id="slug" {...register("slug")} placeholder="agiluniformes" />
              {errors.slug && (
                <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                {...register("logo_url")}
                placeholder="https://exemplo.com/logo.png"
              />
              {errors.logo_url && (
                <p className="text-sm text-destructive mt-1">{errors.logo_url.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cor_primary">
                Cor Primária <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cor_primary"
                  {...register("cor_primary")}
                  placeholder="#111111"
                  className="flex-1"
                />
                <Input
                  type="color"
                  value={watch("cor_primary")}
                  onChange={(e) => setValue("cor_primary", e.target.value)}
                  className="w-16"
                />
              </div>
              {errors.cor_primary && (
                <p className="text-sm text-destructive mt-1">
                  {errors.cor_primary.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="cor_accent">
                Cor de Destaque <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cor_accent"
                  {...register("cor_accent")}
                  placeholder="#FF6A00"
                  className="flex-1"
                />
                <Input
                  type="color"
                  value={watch("cor_accent")}
                  onChange={(e) => setValue("cor_accent", e.target.value)}
                  className="w-16"
                />
              </div>
              {errors.cor_accent && (
                <p className="text-sm text-destructive mt-1">{errors.cor_accent.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cor_bg">
                Cor de Fundo <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cor_bg"
                  {...register("cor_bg")}
                  placeholder="#0B0B0B"
                  className="flex-1"
                />
                <Input
                  type="color"
                  value={watch("cor_bg")}
                  onChange={(e) => setValue("cor_bg", e.target.value)}
                  className="w-16"
                />
              </div>
              {errors.cor_bg && (
                <p className="text-sm text-destructive mt-1">{errors.cor_bg.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cor_text">
                Cor do Texto <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cor_text"
                  {...register("cor_text")}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
                <Input
                  type="color"
                  value={watch("cor_text")}
                  onChange={(e) => setValue("cor_text", e.target.value)}
                  className="w-16"
                />
              </div>
              {errors.cor_text && (
                <p className="text-sm text-destructive mt-1">{errors.cor_text.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={watch("status")} onValueChange={(value) => setValue("status", value as any)}>
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

          <CadastroFormActions
            editing={!!editingEmpresa}
            onClear={handleClear}
            submitLabel={editingEmpresa ? "Atualizar Empresa" : "Salvar Empresa"}
          />
        </form>
      </CadastroFormCard>

      <CadastroTable
        title="Empresas Cadastradas"
        count={filteredEmpresas.length}
        searchPlaceholder="Buscar por nome, domínio ou slug..."
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
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
              <TableHead>Domínio</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Cores</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmpresas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma empresa encontrada
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmpresas.map((empresa) => (
                <TableRow key={empresa.id}>
                  <TableCell className="font-medium">{empresa.nome}</TableCell>
                  <TableCell>{empresa.dominio}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{empresa.slug}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: empresa.cor_primary }}
                        title={`Primary: ${empresa.cor_primary}`}
                      />
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: empresa.cor_accent }}
                        title={`Accent: ${empresa.cor_accent}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {empresa.status === "ativo" ? (
                      <Badge className="bg-green-600">Ativo</Badge>
                    ) : (
                      <Badge variant="destructive">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(empresa)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingEmpresa(empresa)}
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
      </CadastroTable>

      <AlertDialog
        open={!!deletingEmpresa}
        onOpenChange={() => setDeletingEmpresa(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir a empresa{" "}
              <strong>{deletingEmpresa?.nome}</strong>. Esta ação não pode ser
              desfeita e todos os dados relacionados serão perdidos.
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

export default Empresas;
