import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useTenantContext } from "@/contexts/TenantContext";
import { CadastroPageLayout } from "@/components/cadastro/CadastroPageLayout";
import { CadastroFormCard } from "@/components/cadastro/CadastroFormCard";
import { CadastroTable } from "@/components/cadastro/CadastroTable";
import { CadastroPagination } from "@/components/cadastro/CadastroPagination";
import { CadastroFormActions } from "@/components/cadastro/CadastroFormActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Globe, Edit, Trash2, ExternalLink } from "lucide-react";

const siteSchema = z.object({
  empresa_id: z.string().uuid("Empresa inválida"),
  slug: z.string().min(2, "Slug deve ter no mínimo 2 caracteres"),
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  tema_primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida").optional().or(z.literal("")),
  tema_accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida").optional().or(z.literal("")),
  published: z.boolean(),
});

type SiteFormData = z.infer<typeof siteSchema>;

interface Site extends SiteFormData {
  id: string;
  created_at: string;
  updated_at: string;
  empresas?: {
    nome: string;
    dominio: string;
  };
}

const Sites = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: roleLoading, empresaId } = useUserRole();
  const { tenant } = useTenantContext();

  const [sites, setSites] = useState<Site[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      published: true,
    },
  });

  useEffect(() => {
    if (!roleLoading && !["superadmin", "admin"].includes(role || "")) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate("/admin");
    }
  }, [role, roleLoading, navigate]);

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, nome, dominio")
        .eq("status", "ativo")
        .order("nome");

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar empresas:", error);
    }
  };

  const fetchSites = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("sites")
        .select(`
          *,
          empresas (
            nome,
            dominio
          )
        `)
        .order("created_at", { ascending: false });

      if (role !== "superadmin" && empresaId) {
        query = query.eq("empresa_id", empresaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSites(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar sites",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role && ["superadmin", "admin"].includes(role)) {
      fetchEmpresas();
      fetchSites();
    }
  }, [role, empresaId]);

  const onSubmit = async (data: SiteFormData) => {
    try {
      if (editingSite) {
        const { error } = await supabase
          .from("sites")
          .update(data)
          .eq("id", editingSite.id);

        if (error) throw error;

        toast({
          title: "Site atualizado!",
          description: `${data.titulo} foi atualizado com sucesso.`,
        });
      } else {
        const { error } = await supabase.from("sites").insert([data]);

        if (error) throw error;

        toast({
          title: "Site criado!",
          description: `${data.titulo} foi criado com sucesso.`,
        });
      }

      reset();
      setEditingSite(null);
      fetchSites();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar site",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setValue("empresa_id", site.empresa_id);
    setValue("slug", site.slug);
    setValue("titulo", site.titulo);
    setValue("tema_primary", site.tema_primary || "");
    setValue("tema_accent", site.tema_accent || "");
    setValue("published", site.published);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    if (!deletingSite) return;

    try {
      const { error } = await supabase
        .from("sites")
        .delete()
        .eq("id", deletingSite.id);

      if (error) throw error;

      toast({
        title: "Site excluído!",
        description: `${deletingSite.titulo} foi excluído com sucesso.`,
      });

      setDeletingSite(null);
      fetchSites();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir site",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    reset();
    setEditingSite(null);
  };

  const filteredSites = sites.filter(
    (site) =>
      site.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.empresas?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSites.length / itemsPerPage);
  const paginatedSites = filteredSites.slice(
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
      title="Gerenciamento de Sites"
      subtitle="Configure sites e páginas para cada empresa"
      icon={Globe}
      breadcrumb="Sites"
    >
      <CadastroFormCard
        title="Site"
        description="do site"
        editing={!!editingSite}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="empresa_id">
                Empresa <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("empresa_id")}
                onValueChange={(value) => setValue("empresa_id", value)}
                disabled={role !== "superadmin"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.empresa_id && (
                <p className="text-sm text-destructive mt-1">
                  {errors.empresa_id.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input id="slug" {...register("slug")} placeholder="main" />
              {errors.slug && (
                <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="titulo">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input id="titulo" {...register("titulo")} placeholder="Site Principal" />
              {errors.titulo && (
                <p className="text-sm text-destructive mt-1">{errors.titulo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tema_primary">Cor Primária (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="tema_primary"
                  {...register("tema_primary")}
                  placeholder="#111111"
                  className="flex-1"
                />
                <Input
                  type="color"
                  value={watch("tema_primary") || "#111111"}
                  onChange={(e) => setValue("tema_primary", e.target.value)}
                  className="w-16"
                />
              </div>
              {errors.tema_primary && (
                <p className="text-sm text-destructive mt-1">
                  {errors.tema_primary.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="tema_accent">Cor de Destaque (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="tema_accent"
                  {...register("tema_accent")}
                  placeholder="#FF6A00"
                  className="flex-1"
                />
                <Input
                  type="color"
                  value={watch("tema_accent") || "#FF6A00"}
                  onChange={(e) => setValue("tema_accent", e.target.value)}
                  className="w-16"
                />
              </div>
              {errors.tema_accent && (
                <p className="text-sm text-destructive mt-1">
                  {errors.tema_accent.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={watch("published")}
                onCheckedChange={(checked) => setValue("published", checked)}
              />
              <Label htmlFor="published" className="cursor-pointer">
                Site publicado
              </Label>
            </div>
          </div>

          <CadastroFormActions
            editing={!!editingSite}
            onClear={handleClear}
            submitLabel={editingSite ? "Atualizar Site" : "Salvar Site"}
          />
        </form>
      </CadastroFormCard>

      <CadastroTable
        title="Sites Cadastrados"
        count={filteredSites.length}
        searchPlaceholder="Buscar por título, slug ou empresa..."
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
              <TableHead>Título</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Tema</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum site encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedSites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">{site.titulo}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{site.empresas?.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {site.empresas?.dominio}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{site.slug}</code>
                  </TableCell>
                  <TableCell>
                    {site.tema_primary || site.tema_accent ? (
                      <div className="flex gap-1">
                        {site.tema_primary && (
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: site.tema_primary }}
                            title={site.tema_primary}
                          />
                        )}
                        {site.tema_accent && (
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: site.tema_accent }}
                            title={site.tema_accent}
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Padrão</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {site.published ? (
                      <Badge className="bg-green-600">Publicado</Badge>
                    ) : (
                      <Badge variant="secondary">Rascunho</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/sites/${site.id}/paginas`)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        title="Gerenciar páginas"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(site)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingSite(site)}
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

      <AlertDialog open={!!deletingSite} onOpenChange={() => setDeletingSite(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o site <strong>{deletingSite?.titulo}</strong>.
              Todas as páginas deste site também serão excluídas. Esta ação não pode ser
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
    </CadastroPageLayout>
  );
};

export default Sites;
