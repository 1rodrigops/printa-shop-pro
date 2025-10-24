import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

const Customize = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shirtSize: "",
    shirtColor: "",
    quantity: "1",
    notes: ""
  });

  const colors = [
    "Branca", "Preta", "Azul", "Vermelha", "Verde", "Rosa", "Amarela", "Cinza"
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('shirt-designs')
      .upload(filePath, imageFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('shirt-designs')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      toast.error("Por favor, envie uma imagem para estampa!");
      return;
    }

    if (!formData.shirtSize || !formData.shirtColor) {
      toast.error("Por favor, escolha tamanho e cor da camisa!");
      return;
    }

    setSubmitting(true);

    try {
      // Upload da imagem
      const imageUrl = await uploadImage();
      
      // Calcular preço (R$ 59,90 por camisa)
      const totalPrice = 59.90 * parseInt(formData.quantity);

      // Criar pedido
      const { error } = await supabase
        .from('orders')
        .insert({
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone,
          shirt_size: formData.shirtSize as any,
          shirt_color: formData.shirtColor,
          quantity: parseInt(formData.quantity),
          image_url: imageUrl,
          notes: formData.notes,
          total_price: totalPrice,
          status: 'pending' as any
        });

      if (error) throw error;

      toast.success("Pedido criado com sucesso!", {
        description: "Em breve entraremos em contato!"
      });

      // Resetar formulário
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        shirtSize: "",
        shirtColor: "",
        quantity: "1",
        notes: ""
      });
      setImageFile(null);
      setImagePreview("");
      
      setTimeout(() => navigate("/"), 2000);
    } catch (error: any) {
      toast.error("Erro ao criar pedido", {
        description: error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Personalize Sua Camisa
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Preencha os dados e envie sua arte para estampa
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upload de Imagem */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Imagem para Estampa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      required
                    />
                    {imagePreview && (
                      <div className="relative rounded-lg overflow-hidden border-2 border-primary/20">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-64 object-contain bg-muted"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dados do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle>Seus Dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Configuração da Camisa */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuração</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="size">Tamanho *</Label>
                    <Select value={formData.shirtSize} onValueChange={(value) => setFormData({...formData, shirtSize: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha o tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P">P - Pequeno</SelectItem>
                        <SelectItem value="M">M - Médio</SelectItem>
                        <SelectItem value="G">G - Grande</SelectItem>
                        <SelectItem value="GG">GG - Extra Grande</SelectItem>
                        <SelectItem value="XG">XG - Extra Extra Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="color">Cor da Camisa *</Label>
                    <Select value={formData.shirtColor} onValueChange={(value) => setFormData({...formData, shirtColor: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha a cor" />
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map(color => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantidade *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Observações (Opcional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Alguma observação especial sobre seu pedido?"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Resumo e Botão */}
            <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total do Pedido</p>
                    <p className="text-3xl font-bold text-primary">
                      R$ {(59.90 * parseInt(formData.quantity || "1")).toFixed(2)}
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    size="xl" 
                    variant="gradient"
                    disabled={submitting}
                  >
                    <ShoppingCart className="mr-2" />
                    {submitting ? "Processando..." : "Finalizar Pedido"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Após confirmar, entraremos em contato para acertar pagamento e entrega
                </p>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Customize;
