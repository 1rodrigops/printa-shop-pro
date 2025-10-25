import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AdminNavbar from "@/components/AdminNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminActivity } from "@/hooks/useAdminActivity";
import { Pencil, Trash2, Eye, Upload, Save, X, Download } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  descricao_curta: z.string().max(160, "Máximo 160 caracteres").optional(),
  descricao_completa: z.string().optional(),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  preco_frente: z.string().min(1, "Preço é obrigatório"),
  preco_frente_verso: z.string().min(1, "Preço é obrigatório"),
  sku: z.string().optional(),
  status: z.string().default("Ativo"),
  promo_valor: z.string().optional(),
  promo_validade: z.string().optional(),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface Produto {
  id: string;
  nome: string;
  tipo: string;
  categoria: string;
  preco_frente: number;
  preco_frente_verso: number;
  tecidos: string[];
  cores_disponiveis: string[];
  tamanhos_disponiveis: string[];
  estampa_url: string | null;
  status: string;
  sku: string | null;
  descricao_curta: string | null;
  descricao_completa: string | null;
  created_at: string;
}

const TIPOS = ["Camiseta", "Regata", "Moletom", "Baby Look", "Outro"];
const CATEGORIAS = ["Personalizada", "Pronta", "Branca", "Promoção"];
const TECIDOS = ["Algodão Tradicional", "Dry Fit Esportivo", "Premium Soft Touch"];
const CORES = ["Preto", "Branco", "Cinza", "Azul", "Vermelho", "Verde", "Amarelo", "Rosa"];
const TAMANHOS = ["P", "M", "G", "GG", "XG"];

const Produtos = () => {
  const { toast } = useToast();
  const { logActivity } = useAdminActivity();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedTecidos, setSelectedTecidos] = useState<string[]>(["Algodão Tradicional"]);
  const [selectedCores, setSelectedCores] = useState<string[]>(["Branco", "Preto"]);
  const [selectedTamanhos, setSelectedTamanhos] = useState<string[]>(["P", "M", "G", "GG", "XG"]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      status: "Ativo",
    },
  });

  useEffect(() => {
    fetchProdutos();
  }, [filterTipo, filterCategoria]);

  const fetchProdutos = async () => {
    try {
      let query = supabase.from("produtos").select("*").order("created_at", { ascending: false });

      if (filterTipo !== "all") {
        query = query.eq("tipo", filterTipo);
      }

      if (filterCategoria !== "all") {
        query = query.eq("categoria", filterCategoria);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProdutos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo é 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("shirt-designs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("shirt-designs").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const onSubmit = async (data: ProdutoFormData) => {
    setLoading(true);
    try {
      let estampaUrl = null;
      if (imageFile) {
        estampaUrl = await uploadImage(imageFile);
      }

      const { data: { user } } = await supabase.auth.getUser();

      const produtoData = {
        nome: data.nome,
        tipo: data.tipo,
        descricao_curta: data.descricao_curta || null,
        descricao_completa: data.descricao_completa || null,
        categoria: data.categoria,
        estampa_url: estampaUrl || (editingId ? undefined : null),
        preco_frente: parseFloat(data.preco_frente),
        preco_frente_verso: parseFloat(data.preco_frente_verso),
        tecidos: selectedTecidos,
        cores_disponiveis: selectedCores,
        tamanhos_disponiveis: selectedTamanhos,
        sku: data.sku || null,
        status: data.status,
        promo_valor: data.promo_valor ? parseFloat(data.promo_valor) : null,
        promo_validade: data.promo_validade || null,
        cadastrado_por: user?.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("produtos")
          .update(produtoData)
          .eq("id", editingId);

        if (error) throw error;

        await logActivity("produto_edit", `Atualizou produto "${data.nome}"`);
        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase.from("produtos").insert(produtoData);

        if (error) throw error;

        await logActivity("produto_create", `Criou novo produto "${data.nome}"`);
        toast({
          title: "Produto cadastrado",
          description: "O produto foi cadastrado com sucesso.",
        });
      }

      resetForm();
      fetchProdutos();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar produto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    reset();
    setShowForm(false);
    setEditingId(null);
    setSelectedTecidos(["Algodão Tradicional"]);
    setSelectedCores(["Branco", "Preto"]);
    setSelectedTamanhos(["P", "M", "G", "GG", "XG"]);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEdit = (produto: Produto) => {
    setEditingId(produto.id);
    setShowForm(true);
    setValue("nome", produto.nome);
    setValue("tipo", produto.tipo);
    setValue("descricao_curta", produto.descricao_curta || "");
    setValue("descricao_completa", produto.descricao_completa || "");
    setValue("categoria", produto.categoria);
    setValue("preco_frente", produto.preco_frente.toString());
    setValue("preco_frente_verso", produto.preco_frente_verso.toString());
    setValue("sku", produto.sku || "");
    setValue("status", produto.status);
    setSelectedTecidos(produto.tecidos);
    setSelectedCores(produto.cores_disponiveis);
    setSelectedTamanhos(produto.tamanhos_disponiveis);
    if (produto.estampa_url) {
      setImagePreview(produto.estampa_url);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("produtos").delete().eq("id", deleteId);

      if (error) throw error;

      await logActivity("produto_delete", `Excluiu produto`);
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
      fetchProdutos();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ["Nome", "Tipo", "Categoria", "Preço Frente", "Preço Frente+Verso", "Status"];
    const rows = produtos.map(p => [
      p.nome,
      p.tipo,
      p.categoria,
      `R$ ${p.preco_frente.toFixed(2)}`,
      `R$ ${p.preco_frente_verso.toFixed(2)}`,
      p.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "produtos.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-6">
          <nav className="text-sm text-muted-foreground mb-4">
            Admin / Cadastro / Produtos
          </nav>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Gestão de Produtos</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              {!showForm && (
                <Button onClick={() => setShowForm(true)}>
                  Novo Produto
                </Button>
              )}
            </div>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingId ? "Editar Produto" : "Novo Produto"}</CardTitle>
              <CardDescription>
                Preencha os dados do produto de camiseta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome do Produto *</Label>
                    <Input id="nome" {...register("nome")} placeholder="Ex: Camiseta Premium Estampada" />
                    {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select onValueChange={(value) => setValue("tipo", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.tipo && <p className="text-sm text-destructive mt-1">{errors.tipo.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select onValueChange={(value) => setValue("categoria", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoria && <p className="text-sm text-destructive mt-1">{errors.categoria.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU / Código</Label>
                    <Input id="sku" {...register("sku")} placeholder="Código interno" />
                  </div>

                  <div>
                    <Label htmlFor="preco_frente">Preço Frente (R$) *</Label>
                    <Input id="preco_frente" type="number" step="0.01" {...register("preco_frente")} placeholder="75.00" />
                    {errors.preco_frente && <p className="text-sm text-destructive mt-1">{errors.preco_frente.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="preco_frente_verso">Preço Frente + Verso (R$) *</Label>
                    <Input id="preco_frente_verso" type="number" step="0.01" {...register("preco_frente_verso")} placeholder="95.00" />
                    {errors.preco_frente_verso && <p className="text-sm text-destructive mt-1">{errors.preco_frente_verso.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="promo_valor">Preço Promocional (R$)</Label>
                    <Input id="promo_valor" type="number" step="0.01" {...register("promo_valor")} placeholder="65.00" />
                  </div>

                  <div>
                    <Label htmlFor="promo_validade">Validade da Promoção</Label>
                    <Input id="promo_validade" type="date" {...register("promo_validade")} />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={(value) => setValue("status", value)} defaultValue="Ativo">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao_curta">Descrição Curta (até 160 caracteres)</Label>
                  <Input id="descricao_curta" {...register("descricao_curta")} placeholder="Breve descrição do produto" />
                  {errors.descricao_curta && <p className="text-sm text-destructive mt-1">{errors.descricao_curta.message}</p>}
                </div>

                <div>
                  <Label htmlFor="descricao_completa">Descrição Completa</Label>
                  <Textarea id="descricao_completa" {...register("descricao_completa")} placeholder="Detalhes técnicos e comerciais do produto" rows={4} />
                </div>

                <div>
                  <Label>Tecidos Disponíveis</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {TECIDOS.map((tecido) => (
                      <div key={tecido} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tecido-${tecido}`}
                          checked={selectedTecidos.includes(tecido)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTecidos([...selectedTecidos, tecido]);
                            } else {
                              setSelectedTecidos(selectedTecidos.filter((t) => t !== tecido));
                            }
                          }}
                        />
                        <label htmlFor={`tecido-${tecido}`} className="text-sm">{tecido}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Cores Disponíveis</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {CORES.map((cor) => (
                      <div key={cor} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cor-${cor}`}
                          checked={selectedCores.includes(cor)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCores([...selectedCores, cor]);
                            } else {
                              setSelectedCores(selectedCores.filter((c) => c !== cor));
                            }
                          }}
                        />
                        <label htmlFor={`cor-${cor}`} className="text-sm">{cor}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Tamanhos Disponíveis</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {TAMANHOS.map((tamanho) => (
                      <div key={tamanho} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tamanho-${tamanho}`}
                          checked={selectedTamanhos.includes(tamanho)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTamanhos([...selectedTamanhos, tamanho]);
                            } else {
                              setSelectedTamanhos(selectedTamanhos.filter((t) => t !== tamanho));
                            }
                          }}
                        />
                        <label htmlFor={`tamanho-${tamanho}`} className="text-sm">{tamanho}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="estampa">Estampa (PNG ou JPG até 5MB)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Input
                      id="estampa"
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleImageChange}
                      className="flex-1"
                    />
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded border" />
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Salvando..." : "Salvar Produto"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Produtos Cadastrados</CardTitle>
              <div className="flex gap-2">
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {TIPOS.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço Base</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhum produto cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  produtos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell>
                        {produto.estampa_url ? (
                          <img src={produto.estampa_url} alt={produto.nome} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs">
                            Sem imagem
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell>{produto.tipo}</TableCell>
                      <TableCell>{produto.categoria}</TableCell>
                      <TableCell>R$ {produto.preco_frente.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={produto.status === "Ativo" ? "default" : "secondary"}>
                          {produto.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(produto)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(produto.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Produtos;