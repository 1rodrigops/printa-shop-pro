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
import { Textarea } from "@/components/ui/textarea";
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
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Edit, Trash2, ExternalLink, Video, Upload } from "lucide-react";
import { ImageUpload } from "@/components/midias/ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const midiaSchema = z.object({
  empresa_id: z.string().uuid("Empresa inválida"),
  url: z.string().url("URL inválida"),
  tipo: z.enum(["imagem", "video"]),
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres").optional().or(z.literal("")),
  descricao: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
});

type MidiaFormData = z.infer<typeof midiaSchema>;

interface Midia extends Omit<MidiaFormData, "tags"> {
  id: string;
  tags: string[];
  created_at: string;
  created_by: string | null;
  empresas?: {
    nome: string;
  };
}

const Midias = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: roleLoading, empresaId } = useUserRole();
  const { tenant } = useTenantContext();

  const [midias, setMidias] = useState<Midia[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [editingMidia, setEditingMidia] = useState<Midia | null>(null);
  const [deletingMidia, setDeletingMidia] = useState<Midia | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MidiaFormData>({
    resolver: zodResolver(midiaSchema),
    defaultValues: {
      tipo: "imagem",
      empresa_id: tenant?.id || empresaId || "",
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
        .select("id, nome")
        .eq("status", "ativo")
        .order("nome");

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar empresas:", error);
    }
  };

  const fetchMidias = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("midias")
        .select(`
          *,
          empresas (
            nome
          )
        `)
        .order("created_at", { ascending: false });

      if (role !== "superadmin" && empresaId) {
        query = query.eq("empresa_id", empresaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMidias(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mídias",
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
      fetchMidias();
    }
  }, [role, empresaId]);

  const onSubmit = async (data: MidiaFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const tags = data.tags
        ? data.tags.split(",").map((t) => t.trim()).filter((t) => t)
        : [];

      const payload = {
        empresa_id: data.empresa_id,
        url: data.url,
        tipo: data.tipo,
        titulo: data.titulo || null,
        descricao: data.descricao || null,
        tags,
        created_by: user?.id || null,
      };

      if (editingMidia) {
        const { error } = await supabase
          .from("midias")
          .update(payload)
          .eq("id", editingMidia.id);

        if (error) throw error;

        toast({
          title: "Mídia atualizada!",
          description: `${data.titulo || "Mídia"} foi atualizada com sucesso.`,
        });
      } else {
        const { error } = await supabase.from("midias").insert([payload]);

        if (error) throw error;

        toast({
          title: "Mídia criada!",
          description: `${data.titulo || "Mídia"} foi criada com sucesso.`,
        });
      }

      reset();
      setEditingMidia(null);
      fetchMidias();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar mídia",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (midia: Midia) => {
    setEditingMidia(midia);
    setValue("empresa_id", midia.empresa_id);
    setValue("url", midia.url);
    setValue("tipo", midia.tipo);
    setValue("titulo", midia.titulo || "");
    setValue("descricao", midia.descricao || "");
    setValue("tags", midia.tags.join(", "));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    if (!deletingMidia) return;

    try {
      const { error } = await supabase
        .from("midias")
        .delete()
        .eq("id", deletingMidia.id);

      if (error) throw error;

      toast({
        title: "Mídia excluída!",
        description: `${deletingMidia.titulo || "Mídia"} foi excluída com sucesso.`,
      });

      setDeletingMidia(null);
      fetchMidias();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir mídia",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    reset();
    setEditingMidia(null);
  };

  const filteredMidias = midias.filter((midia) => {
    const matchesSearch =
      (midia.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        midia.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        midia.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesTipo = filterTipo === "all" || midia.tipo === filterTipo;

    return matchesSearch && matchesTipo;
  });

  const totalPages = Math.ceil(filteredMidias.length / itemsPerPage);
  const paginatedMidias = filteredMidias.slice(
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
      title="Biblioteca de Mídias"
      subtitle="Gerencie imagens e vídeos"
      icon={ImageIcon}
      breadcrumb="Mídias"
    >
      <CadastroFormCard title="Mídia" description="da mídia" editing={!!editingMidia}>
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
              <Label htmlFor="tipo">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("tipo")}
                onValueChange={(value) => setValue("tipo", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imagem">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="url">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url"
                {...register("url")}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              {errors.url && (
                <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" {...register("titulo")} placeholder="Minha imagem" />
              {errors.titulo && (
                <p className="text-sm text-destructive mt-1">{errors.titulo.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register("descricao")}
                placeholder="Descrição da mídia"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                {...register("tags")}
                placeholder="tag1, tag2, tag3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separe as tags com vírgulas
              </p>
            </div>
          </div>

          <CadastroFormActions
            editing={!!editingMidia}
            onClear={handleClear}
            submitLabel={editingMidia ? "Atualizar Mídia" : "Salvar Mídia"}
          />
        </form>
      </CadastroFormCard>

      <CadastroTable
        title="Mídias Cadastradas"
        count={filteredMidias.length}
        searchPlaceholder="Buscar por título, descrição ou tags..."
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        headerActions={
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Rápido
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Upload de Mídia</DialogTitle>
                  <DialogDescription>
                    Faça upload de uma imagem que será automaticamente adicionada à
                    biblioteca.
                  </DialogDescription>
                </DialogHeader>
                <ImageUpload
                  onUploadComplete={(url) => {
                    setValue("url", url);
                    setValue("tipo", "imagem");
                  }}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              Tabela
            </Button>
          </div>
        }
        filters={
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="imagem">Imagens</SelectItem>
              <SelectItem value="video">Vídeos</SelectItem>
            </SelectContent>
          </Select>
        }
        pagination={
          <CadastroPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        }
      >
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {paginatedMidias.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Nenhuma mídia encontrada
              </div>
            ) : (
              paginatedMidias.map((midia) => (
                <Card key={midia.id} className="overflow-hidden group">
                  <div className="aspect-video bg-muted relative">
                    {midia.tipo === "imagem" ? (
                      <img
                        src={midia.url}
                        alt={midia.titulo || "Mídia"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Video className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => window.open(midia.url, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleEdit(midia)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeletingMidia(midia)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate">
                      {midia.titulo || "Sem título"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {midia.empresas?.nome}
                    </p>
                    {midia.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {midia.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMidias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma mídia encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMidias.map((midia) => (
                  <TableRow key={midia.id}>
                    <TableCell>
                      <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                        {midia.tipo === "imagem" ? (
                          <img
                            src={midia.url}
                            alt={midia.titulo || "Mídia"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Video className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {midia.titulo || "Sem título"}
                    </TableCell>
                    <TableCell>{midia.empresas?.nome}</TableCell>
                    <TableCell>
                      <Badge variant={midia.tipo === "imagem" ? "default" : "secondary"}>
                        {midia.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {midia.tags.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {midia.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {midia.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{midia.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(midia.url, "_blank")}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(midia)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingMidia(midia)}
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
        )}
      </CadastroTable>

      <AlertDialog open={!!deletingMidia} onOpenChange={() => setDeletingMidia(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir a mídia{" "}
              <strong>{deletingMidia?.titulo || "sem título"}</strong>. Esta ação não
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

export default Midias;
