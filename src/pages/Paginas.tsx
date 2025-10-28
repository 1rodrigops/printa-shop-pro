import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { FileText, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";

const paginaSchema = z.object({
  site_id: z.string().uuid("Site inválido"),
  rota: z.string().min(1, "Rota é obrigatória"),
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  conteudo_json: z.string().min(2, "Conteúdo JSON é obrigatório"),
  order: z.number().int().min(0),
  published: z.boolean(),
});

type PaginaFormData = z.infer<typeof paginaSchema>;

interface Pagina extends Omit<PaginaFormData, "conteudo_json"> {
  id: string;
  conteudo_json: any;
  created_at: string;
  updated_at: string;
}

const Paginas = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();

  const [paginas, setPaginas] = useState<Pagina[]>([]);
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPagina, setEditingPagina] = useState<Pagina | null>(null);
  const [deletingPagina, setDeletingPagina] = useState<Pagina | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PaginaFormData>({
    resolver: zodResolver(paginaSchema),
    defaultValues: {
      site_id: siteId || "",
      published: true,
      order: 0,
      conteudo_json: JSON.stringify({
        type: "landing",
        sections: [
          {
            id: "hero",
            component: "Hero",
            props: {
              title: "Título",
              subtitle: "Subtítulo",
            },
          },
        ],
      }, null, 2),
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

  const fetchSite = async () => {
    if (!siteId) return;

    try {
      const { data, error } = await supabase
        .from("sites")
        .select(`
          *,
          empresas (
            nome,
            dominio
          )
        `)
        .eq("id", siteId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Site não encontrado",
          variant: "destructive",
        });
        navigate("/admin/sites");
        return;
      }

      setSite(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar site",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchPaginas = async () => {
    if (!siteId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("paginas")
        .select("*")
        .eq("site_id", siteId)
        .order("order", { ascending: true });

      if (error) throw error;
      setPaginas(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar páginas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (siteId && role && ["superadmin", "admin"].includes(role)) {
      fetchSite();
      fetchPaginas();
    }
  }, [role, siteId]);

  const onSubmit = async (data: PaginaFormData) => {
    try {
      let conteudoJson;
      try {
        conteudoJson = JSON.parse(data.conteudo_json);
      } catch {
        throw new Error("JSON inválido no campo de conteúdo");
      }

      const payload = {
        ...data,
        conteudo_json: conteudoJson,
      };

      if (editingPagina) {
        const { error } = await supabase
          .from("paginas")
          .update(payload)
          .eq("id", editingPagina.id);

        if (error) throw error;

        toast({
          title: "Página atualizada!",
          description: `${data.titulo} foi atualizada com sucesso.`,
        });
      } else {
        const { error } = await supabase.from("paginas").insert([payload]);

        if (error) throw error;

        toast({
          title: "Página criada!",
          description: `${data.titulo} foi criada com sucesso.`,
        });
      }

      reset();
      setEditingPagina(null);
      fetchPaginas();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar página",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (pagina: Pagina) => {
    setEditingPagina(pagina);
    setValue("site_id", pagina.site_id);
    setValue("rota", pagina.rota);
    setValue("titulo", pagina.titulo);
    setValue("conteudo_json", JSON.stringify(pagina.conteudo_json, null, 2));
    setValue("order", pagina.order);
    setValue("published", pagina.published);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    if (!deletingPagina) return;

    try {
      const { error } = await supabase
        .from("paginas")
        .delete()
        .eq("id", deletingPagina.id);

      if (error) throw error;

      toast({
        title: "Página excluída!",
        description: `${deletingPagina.titulo} foi excluída com sucesso.`,
      });

      setDeletingPagina(null);
      fetchPaginas();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir página",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (paginaId: string, direction: "up" | "down") => {
    const index = paginas.findIndex((p) => p.id === paginaId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === paginas.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newOrder = [...paginas];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

    try {
      const updates = newOrder.map((p, i) => ({
        id: p.id,
        order: i,
      }));

      for (const update of updates) {
        await supabase.from("paginas").update({ order: update.order }).eq("id", update.id);
      }

      fetchPaginas();
    } catch (error: any) {
      toast({
        title: "Erro ao reordenar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    reset();
    setEditingPagina(null);
  };

  const filteredPaginas = paginas.filter(
    (pagina) =>
      pagina.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagina.rota.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPaginas.length / itemsPerPage);
  const paginatedPaginas = filteredPaginas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (roleLoading || loading || !site) {
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
      title={`Páginas - ${site.titulo}`}
      subtitle={`Gerenciar páginas do site ${site.empresas?.nome}`}
      icon={FileText}
      breadcrumb="Páginas"
    >
      <CadastroFormCard title="Página" description="da página" editing={!!editingPagina}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="rota">
                Rota <span className="text-destructive">*</span>
              </Label>
              <Input id="rota" {...register("rota")} placeholder="/" />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: / (home), /contato, /sobre
              </p>
              {errors.rota && (
                <p className="text-sm text-destructive mt-1">{errors.rota.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="titulo">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input id="titulo" {...register("titulo")} placeholder="Home" />
              {errors.titulo && (
                <p className="text-sm text-destructive mt-1">{errors.titulo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="order">Ordem</Label>
              <Input
                id="order"
                type="number"
                {...register("order", { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.order && (
                <p className="text-sm text-destructive mt-1">{errors.order.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={watch("published")}
                onCheckedChange={(checked) => setValue("published", checked)}
              />
              <Label htmlFor="published" className="cursor-pointer">
                Página publicada
              </Label>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="conteudo_json">
                Conteúdo JSON <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="conteudo_json"
                {...register("conteudo_json")}
                placeholder='{"type": "landing", "sections": []}'
                className="font-mono text-xs min-h-[300px]"
              />
              {errors.conteudo_json && (
                <p className="text-sm text-destructive mt-1">
                  {errors.conteudo_json.message}
                </p>
              )}
            </div>
          </div>

          <CadastroFormActions
            editing={!!editingPagina}
            onClear={handleClear}
            submitLabel={editingPagina ? "Atualizar Página" : "Salvar Página"}
          />
        </form>
      </CadastroFormCard>

      <CadastroTable
        title="Páginas Cadastradas"
        count={filteredPaginas.length}
        searchPlaceholder="Buscar por título ou rota..."
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        headerActions={
          <Button variant="outline" onClick={() => navigate("/admin/sites")}>
            Voltar para Sites
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
              <TableHead>Ordem</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Rota</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPaginas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma página encontrada
                </TableCell>
              </TableRow>
            ) : (
              paginatedPaginas.map((pagina, index) => (
                <TableRow key={pagina.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-mono">{pagina.order}</span>
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleReorder(pagina.id, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleReorder(pagina.id, "down")}
                          disabled={index === paginatedPaginas.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{pagina.titulo}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{pagina.rota}</code>
                  </TableCell>
                  <TableCell>
                    {pagina.published ? (
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
                        onClick={() => handleEdit(pagina)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingPagina(pagina)}
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

      <AlertDialog open={!!deletingPagina} onOpenChange={() => setDeletingPagina(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir a página{" "}
              <strong>{deletingPagina?.titulo}</strong>. Esta ação não pode ser desfeita.
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

export default Paginas;
