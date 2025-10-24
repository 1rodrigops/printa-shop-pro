import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Upload, ShoppingCart, Ruler, CheckCircle, MessageCircle, Truck, Gift, Shield, Clock, Star, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import shirtModel1 from "@/assets/shirt-model-1.jpg";
import shirtModel2 from "@/assets/shirt-model-2.jpg";
import shirtModel3 from "@/assets/shirt-model-3.jpg";

const Customize = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [customText, setCustomText] = useState("");
  
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
    { name: "Branca", hex: "#FFFFFF", border: true },
    { name: "Preta", hex: "#000000" },
    { name: "Azul", hex: "#1E40AF" },
    { name: "Vermelha", hex: "#DC2626" },
    { name: "Verde", hex: "#16A34A" },
    { name: "Rosa", hex: "#EC4899" },
    { name: "Amarela", hex: "#EAB308" },
    { name: "Cinza", hex: "#6B7280" }
  ];

  const sizes = [
    { value: "P", label: "P", width: "45", length: "68" },
    { value: "M", label: "M", width: "50", length: "72" },
    { value: "G", label: "G", width: "55", length: "76" },
    { value: "GG", label: "GG", width: "60", length: "80" },
    { value: "XG", label: "XG", width: "65", length: "84" }
  ];

  const calculatePrice = (quantity: number) => {
    const basePrice = 59.90;
    if (quantity >= 10) return basePrice * 0.80; // 20% de desconto
    return basePrice;
  };

  const calculateTotal = () => {
    const qty = parseInt(formData.quantity || "1");
    const unitPrice = calculatePrice(qty);
    const subtotal = unitPrice * qty;
    return subtotal;
  };

  const calculatePIXPrice = () => {
    return calculateTotal() * 0.95; // 5% de desconto no PIX
  };

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

      // Enviar notificação via WhatsApp
      try {
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            phone: formData.customerPhone,
            customerName: formData.customerName,
            orderDetails: {
              quantity: parseInt(formData.quantity),
              shirtColor: formData.shirtColor,
              shirtSize: formData.shirtSize,
              totalPrice: totalPrice
            }
          }
        });
        console.log('Notificação WhatsApp enviada');
      } catch (whatsappError: any) {
        console.error('Erro ao enviar WhatsApp:', whatsappError);
        // Não bloqueia o pedido se o WhatsApp falhar
      }

      toast.success("Pedido criado com sucesso!", {
        description: "Você receberá uma confirmação no WhatsApp!"
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-20">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <Badge className="mb-4 bg-accent text-accent-foreground">
            Promoção válida até 31/10/2025 🎉
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Camiseta Personalizada
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-4">
            Com seu nome, logo ou frase. Produção rápida e tecido de qualidade premium!
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge variant="outline" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Tecido 100% Algodão
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Entrega Rápida
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Alta Qualidade
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto mb-16">
          {/* Coluna Esquerda - Preview e Personalização */}
          <div className="space-y-6">
            {/* Preview da Camiseta */}
            <Card className="overflow-hidden border-2 border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Pré-visualização da Sua Estampa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="relative w-full aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-w-[60%] max-h-[60%] object-contain"
                    />
                  ) : customText ? (
                    <div className="text-4xl font-bold text-center px-8">
                      {customText}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Sua estampa aparecerá aqui</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Campo de Texto Personalizado */}
            <Card>
              <CardHeader>
                <CardTitle>Digite seu Texto Personalizado</CardTitle>
                <CardDescription>Ou faça upload de uma logo abaixo</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Digite o nome ou frase para estampar..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="text-lg"
                />
              </CardContent>
            </Card>

            {/* Upload de Logo */}
            <Card>
              <CardHeader>
                <CardTitle>Ou Envie Sua Logo</CardTitle>
                <CardDescription>PNG/JPG até 10MB</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Formatos aceitos: PNG, JPG, JPEG (máx 10MB)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Formulário de Compra */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção de Tamanho */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Escolha o Tamanho</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Ruler className="w-4 h-4 mr-2" />
                          Tabela de Medidas
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tabela de Medidas (em cm)</DialogTitle>
                          <DialogDescription>
                            Medidas das camisetas em centímetros
                          </DialogDescription>
                        </DialogHeader>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="border-b">
                              <tr>
                                <th className="text-left p-2 font-semibold">Tamanho</th>
                                <th className="text-center p-2 font-semibold">Largura (cm)</th>
                                <th className="text-center p-2 font-semibold">Comprimento (cm)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sizes.map((size) => (
                                <tr key={size.value} className="border-b">
                                  <td className="p-2 font-medium">{size.label}</td>
                                  <td className="text-center p-2">{size.width}</td>
                                  <td className="text-center p-2">{size.length}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size.value}
                        type="button"
                        onClick={() => setFormData({...formData, shirtSize: size.value})}
                        className={`p-4 rounded-lg border-2 font-semibold transition-all hover:scale-105 ${
                          formData.shirtSize === size.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Confirme o tamanho antes de finalizar. Trocas somente por defeito de fabricação.
                  </p>
                </CardContent>
              </Card>

              {/* Seleção de Cor */}
              <Card>
                <CardHeader>
                  <CardTitle>Escolha a Cor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setFormData({...formData, shirtColor: color.name})}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                          formData.shirtColor === color.name
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full ${color.border ? "border-2 border-border" : ""}`}
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs font-medium">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quantidade */}
              <Card>
                <CardHeader>
                  <CardTitle>Quantidade</CardTitle>
                  {parseInt(formData.quantity) >= 10 && (
                    <Badge className="bg-accent text-accent-foreground">
                      🎉 Desconto progressivo ativado! 20% OFF
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    💡 10+ unidades = 20% de desconto por camisa
                  </p>
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
                    <Label htmlFor="phone">WhatsApp *</Label>
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

              {/* Observações */}
              <Card>
                <CardHeader>
                  <CardTitle>Observações (Opcional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Alguma observação especial sobre seu pedido?"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Preço e CTA */}
              <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/30">
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="text-2xl font-bold">R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-primary">
                      <span className="font-medium">💰 PIX (5% OFF):</span>
                      <span className="text-xl font-bold">R$ {calculatePIXPrice().toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      💳 Ou parcele em até 3x no cartão
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg font-bold"
                    disabled={submitting}
                  >
                    <ShoppingCart className="mr-2" />
                    {submitting ? "Processando..." : "PERSONALIZAR AGORA"}
                  </Button>

                  <a 
                    href="https://wa.me/5511999999999?text=Olá! Gostaria de fazer um pedido em lote."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                  >
                    <MessageCircle className="w-4 h-4" />
                    💬 Fale conosco no WhatsApp para pedidos em lote
                  </a>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        <strong>Aprovação do layout:</strong> Você receberá o layout por e-mail/WhatsApp para aprovação antes da impressão
                      </p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Truck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        <strong>Produção:</strong> Até 3 dias úteis após confirmação do layout
                      </p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        <strong>Entrega:</strong> Todo o Brasil ou retirada em loja
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>

        {/* Seção de Benefícios */}
        <Card className="mb-16 bg-gradient-to-r from-accent/20 to-secondary/20 border-accent">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">
              🎁 Promoção Especial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-center">
              <div className="p-6 bg-card rounded-lg border">
                <Gift className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h3 className="text-xl font-bold mb-2">Na compra de 10 camisetas</h3>
                <p className="text-2xl font-bold text-accent">GANHE 1 GRÁTIS! 🎉</p>
              </div>
              <div className="p-6 bg-card rounded-lg border">
                <Badge className="text-lg px-4 py-2 mb-4">
                  Válida até 31/10/2025
                </Badge>
                <p className="text-muted-foreground">
                  Aproveite essa oportunidade única para economizar em pedidos em grupo!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Galeria de Exemplos */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Veja como ficaram as camisetas dos nossos clientes 👕✨
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[shirtModel1, shirtModel2, shirtModel3].map((img, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <img 
                  src={img} 
                  alt={`Exemplo ${i + 1}`} 
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform"
                />
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-3xl text-center">❓ Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  Posso imprimir frente e verso?
                </AccordionTrigger>
                <AccordionContent>
                  Sim! No campo de observações, especifique que deseja impressão frente e verso. Entraremos em contato para ajustar o valor adicional.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  Qual tecido é usado?
                </AccordionTrigger>
                <AccordionContent>
                  Utilizamos 100% algodão de alta qualidade, confortável e durável. Nossas camisetas são fio 30.1 penteado.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  Quanto tempo leva para chegar?
                </AccordionTrigger>
                <AccordionContent>
                  A produção leva até 3 dias úteis após a aprovação do layout. A entrega via Mercado Envios leva de 3 a 7 dias úteis, dependendo da sua região.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  Posso escolher cores diferentes no mesmo pedido?
                </AccordionTrigger>
                <AccordionContent>
                  Sim! Entre em contato pelo WhatsApp para pedidos personalizados com múltiplas cores e tamanhos.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  Como funciona a política de trocas?
                </AccordionTrigger>
                <AccordionContent>
                  Trocas são aceitas somente em caso de defeito de fabricação. Por isso, é muito importante confirmar o tamanho correto antes de finalizar o pedido!
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* CTA Final */}
        <Card className="bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Pronto para criar sua camiseta?</h2>
            <p className="text-xl mb-6 opacity-90">
              Personalize agora e receba em casa com segurança!
            </p>
            <Button 
              size="lg"
              variant="secondary"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-lg font-bold"
            >
              Começar Personalização
              <ChevronRight className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Camisetas Personalizadas. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Customize;
