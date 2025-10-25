import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "@/components/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminActivity } from "@/hooks/useAdminActivity";
import { ArrowLeft, Save, Trash2, Edit, Eye, Download, Factory, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Fornecedor {
  id: string;
  nome_empresa: string;
  cnpj_cpf: string;
  responsavel: string | null;
  telefone_comercial: string | null;
  email_contato: string;
  tipo_fornecimento: string[];
  tipo_tecido: string | null;
  forma_pagamento: string;
  prazo_entrega: string | null;
  fornece_amostras: boolean;
  link_catalogo: string | null;
  observacoes: string | null;
  status: string;
  avaliacao: number;
  created_at: string;
}

const tiposFornecimento = [
  "Tecido",
  "Estampa DTF",
  "Sublimação",
  "Embalagens",
  "Brindes",
  "Transporte",
  "Outro"
];

const tiposTecido = [
  "Algodão",
  "Dry Fit",
  "Premium",
  "Poliéster",
  "Outros"
];

const formasPagamento = [
  "PIX",
  "Boleto",
  "Cartão",
  "Transferência",
  "Consignado"
];

const Fornecedores = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const { logActivity } = useAdminActivity();
  
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterTipo, setFilterTipo] = useState<string>("todos");

  const [formData, setFormData] = useState({
    nome_empresa: "",
    cnpj_cpf: "",
    responsavel: "",
    telefone_comercial: "",
    email_contato: "",
    tipo_fornecimento: [] as string[],
    tipo_tecido: "",
    forma_pagamento: "PIX",
    prazo_entrega: "",
    fornece_amostras: false,
    link_catalogo: "",
    observacoes: "",
    status: "Ativo"
  });

  useEffect(() => {
    if (!roleLoading) {
      if (!role || (role !== "superadmin" && role !== "admin")) {
        toast.error("Acesso negado. Esta área é restrita a administradores.");
        navigate("/admin");
      } else {
        fetchFornecedores();
      }
    }
  }, [role, roleLoading, navigate]);

  const fetchFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      toast.error("Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome_empresa || !formData.cnpj_cpf || !formData.email_contato) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (formData.tipo_fornecimento.length === 0) {
      toast.error("Selecione pelo menos um tipo de fornecimento");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (isEditing && editingId) {
        const { error } = await supabase
          .from("fornecedores")
          .update(formData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Fornecedor atualizado com sucesso!");
        await logActivity("fornecedor_edit", `Editou fornecedor: ${formData.nome_empresa}`);
      } else {
        const { error } = await supabase
          .from("fornecedores")
          .insert([{ ...formData, cadastrado_por: user?.id }]);

        if (error) throw error;
        toast.success("Fornecedor cadastrado com sucesso!");
        await logActivity("fornecedor_create", `Criou fornecedor: ${formData.nome_empresa}`);
      }

      resetForm();
      fetchFornecedores();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      toast.error("Erro ao salvar fornecedor");
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setFormData({
      nome_empresa: fornecedor.nome_empresa,
      cnpj_cpf: fornecedor.cnpj_cpf,
      responsavel: fornecedor.responsavel || "",
      telefone_comercial: fornecedor.telefone_comercial || "",
      email_contato: fornecedor.email_contato,
      tipo_fornecimento: fornecedor.tipo_fornecimento,
      tipo_tecido: fornecedor.tipo_tecido || "",
      forma_pagamento: fornecedor.forma_pagamento,
      prazo_entrega: fornecedor.prazo_entrega || "",
      fornece_amostras: fornecedor.fornece_amostras,
      link_catalogo: fornecedor.link_catalogo || "",
      observacoes: fornecedor.observacoes || "",
      status: fornecedor.status
    });
    setIsEditing(true);
    setEditingId(fornecedor.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o fornecedor "${nome}"?`)) return;

    try {
      const { error } = await supabase
        .from("fornecedores")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Fornecedor excluído com sucesso!");
      await logActivity("fornecedor_delete", `Excluiu fornecedor: ${nome}`);
      fetchFornecedores();
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      toast.error("Erro ao excluir fornecedor");
    }
  };

  const resetForm = () => {
    setFormData({
      nome_empresa: "",
      cnpj_cpf: "",
      responsavel: "",
      telefone_comercial: "",
      email_contato: "",
      tipo_fornecimento: [],
      tipo_tecido: "",
      forma_pagamento: "PIX",
      prazo_entrega: "",
      fornece_amostras: false,
      link_catalogo: "",
      observacoes: "",
      status: "Ativo"
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const exportToCSV = () => {
    const headers = ["Nome da Empresa", "CNPJ/CPF", "Responsável", "Telefone", "Email", "Tipo de Fornecimento", "Status"];
    const rows = filteredFornecedores.map(f => [
      f.nome_empresa,
      f.cnpj_cpf,
      f.responsavel || "",
      f.telefone_comercial || "",
      f.email_contato,
      f.tipo_fornecimento.join(", "),
      f.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fornecedores_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("Exportação realizada com sucesso!");
    logActivity("fornecedor_export", "Exportou lista de fornecedores para CSV");
  };

  const handleTipoFornecimentoChange = (tipo: string) => {
    setFormData(prev => ({
      ...prev,
      tipo_fornecimento: prev.tipo_fornecimento.includes(tipo)
        ? prev.tipo_fornecimento.filter(t => t !== tipo)
        : [...prev.tipo_fornecimento, tipo]
    }));
  };

  const filteredFornecedores = fornecedores.filter(f => {
    if (filterStatus !== "todos" && f.status !== filterStatus) return false;
    if (filterTipo !== "todos" && !f.tipo_fornecimento.includes(filterTipo)) return false;
    return true;
  });

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <p className="text-center">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Factory className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Cadastro de Fornecedores</h1>
            </div>
            <p className="text-sm text-muted-foreground">Admin / Cadastro / Fornecedores</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/cadastro")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Menu
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}</CardTitle>
            <CardDescription>
              Preencha os dados do fornecedor de tecidos, estampas e insumos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                  <Input
                    id="nome_empresa"
                    value={formData.nome_empresa}
                    onChange={(e) => setFormData({ ...formData, nome_empresa: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj_cpf">CNPJ / CPF *</Label>
                  <Input
                    id="cnpj_cpf"
                    value={formData.cnpj_cpf}
                    onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone_comercial">Telefone Comercial</Label>
                  <Input
                    id="telefone_comercial"
                    value={formData.telefone_comercial}
                    onChange={(e) => setFormData({ ...formData, telefone_comercial: e.target.value })}
                    placeholder="(99) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_contato">E-mail de Contato *</Label>
                  <Input
                    id="email_contato"
                    type="email"
                    value={formData.email_contato}
                    onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                  <Select
                    value={formData.forma_pagamento}
                    onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamento.map((forma) => (
                        <SelectItem key={forma} value={forma}>
                          {forma}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Fornecimento *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {tiposFornecimento.map((tipo) => (
                    <div key={tipo} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tipo-${tipo}`}
                        checked={formData.tipo_fornecimento.includes(tipo)}
                        onCheckedChange={() => handleTipoFornecimentoChange(tipo)}
                      />
                      <label
                        htmlFor={`tipo-${tipo}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tipo}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_tecido">Tipo de Tecido (opcional)</Label>
                  <Select
                    value={formData.tipo_tecido}
                    onValueChange={(value) => setFormData({ ...formData, tipo_tecido: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposTecido.map((tecido) => (
                        <SelectItem key={tecido} value={tecido}>
                          {tecido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prazo_entrega">Prazo Médio de Entrega</Label>
                  <Input
                    id="prazo_entrega"
                    value={formData.prazo_entrega}
                    onChange={(e) => setFormData({ ...formData, prazo_entrega: e.target.value })}
                    placeholder="Ex: 5 dias úteis"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link_catalogo">Link / Catálogo Digital</Label>
                  <Input
                    id="link_catalogo"
                    type="url"
                    value={formData.link_catalogo}
                    onChange={(e) => setFormData({ ...formData, link_catalogo: e.target.value })}
                    placeholder="https://"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fornece_amostras"
                  checked={formData.fornece_amostras}
                  onCheckedChange={(checked) => setFormData({ ...formData, fornece_amostras: checked as boolean })}
                />
                <label
                  htmlFor="fornece_amostras"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Fornece Amostras
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={4}
                  placeholder="Condições, descontos, histórico..."
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Atualizar" : "Salvar"} Fornecedor
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={resetForm}>
                  Limpar Campos
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fornecedores Cadastrados</CardTitle>
                <CardDescription>
                  Total: {filteredFornecedores.length} fornecedores
                </CardDescription>
              </div>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
            <div className="flex gap-4 mt-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  {tiposFornecimento.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Empresa</TableHead>
                    <TableHead>Tipo de Fornecimento</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.nome_empresa}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {fornecedor.tipo_fornecimento.slice(0, 2).map((tipo) => (
                            <Badge key={tipo} variant="secondary" className="text-xs">
                              {tipo}
                            </Badge>
                          ))}
                          {fornecedor.tipo_fornecimento.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{fornecedor.tipo_fornecimento.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{fornecedor.telefone_comercial || "-"}</div>
                          <div className="text-muted-foreground text-xs">{fornecedor.email_contato}</div>
                        </div>
                      </TableCell>
                      <TableCell>{fornecedor.forma_pagamento}</TableCell>
                      <TableCell>
                        <Badge variant={fornecedor.status === "Ativo" ? "default" : "secondary"}>
                          {fornecedor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(fornecedor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {role === "superadmin" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(fornecedor.id, fornecedor.nome_empresa)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredFornecedores.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum fornecedor encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Fornecedores;