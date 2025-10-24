import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Upload, Check, MessageCircle, Shirt, Sparkles, Package, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

type PrintType = "front" | "both";
type FabricType = "cotton" | "dryfit" | "premium";

const Customize = () => {
  const [printType, setPrintType] = useState<PrintType>("front");
  const [fabricType, setFabricType] = useState<FabricType>("cotton");
  const [quantity, setQuantity] = useState(1);
  const [previewColor, setPreviewColor] = useState("#FFFFFF");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>("");
  const [backPreview, setBackPreview] = useState<string>("");
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shirtSize: "",
  });

  const colors = [
    { name: "Branco", hex: "#FFFFFF", border: true },
    { name: "Preto", hex: "#000000" },
    { name: "Cinza", hex: "#6B7280" },
    { name: "Azul-marinho", hex: "#1E3A8A" },
    { name: "Vermelho", hex: "#DC2626" },
  ];

  const sizes = ["P", "M", "G", "GG", "XG"];

  const fabricOptions = [
    { 
      id: "cotton", 
      name: "Algodão Tradicional", 
      description: "Conforto e toque natural", 
      price: 0 
    },
    { 
      id: "dryfit", 
      name: "Dry Fit Esportivo", 
      description: "Leve, ideal para eventos ao ar livre", 
      price: 10 
    },
    { 
      id: "premium", 
      name: "Premium Soft Touch", 
      description: "Tecido nobre, ideal para uniformes de empresa", 
      price: 20 
    },
  ];

  const calculateBasePrice = () => {
    return printType === "front" ? 75 : 95;
  };

  const calculateFabricPrice = () => {
    const fabric = fabricOptions.find(f => f.id === fabricType);
    return fabric?.price || 0;
  };

  const calculateUnitPrice = () => {
    if (quantity >= 10) return 70;
    return calculateBasePrice() + calculateFabricPrice();
  };

  const calculateTotal = () => {
    return calculateUnitPrice() * quantity;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande! Máximo 10MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === "front") {
          setFrontImage(file);
          setFrontPreview(reader.result as string);
        } else {
          setBackImage(file);
          setBackPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!frontImage) {
      toast.error("Por favor, envie a arte para a frente da camiseta!");
      return;
    }

    if (printType === "both" && !backImage) {
      toast.error("Por favor, envie a arte para o verso da camiseta!");
      return;
    }

    if (!formData.shirtSize) {
      toast.error("Por favor, escolha o tamanho!");
      return;
    }

    // Montar mensagem WhatsApp
    const fabric = fabricOptions.find(f => f.id === fabricType);
    const selectedColor = colors.find(c => c.hex === previewColor);
    
    const message = `Olá! Gostaria de formalizar meu pedido de camisetas personalizadas.

• Tipo de estampa: ${printType === "front" ? "Somente Frente" : "Frente e Verso"}
• Tecido: ${fabric?.name}
• Quantidade: ${quantity} ${quantity === 1 ? "unidade" : "unidades"}
• Cor: ${selectedColor?.name || "Branco"}
• Tamanho: ${formData.shirtSize}
• Nome: ${formData.customerName}
• Email: ${formData.customerEmail}
• Telefone: ${formData.customerPhone}

💰 Valor total: R$ ${calculateTotal().toFixed(2)}

Aguardo o link de pagamento e aprovação do layout!`;

    const whatsappNumber = "5541999999999"; // Substitua pelo número real
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, "_blank");
    toast.success("Redirecionando para WhatsApp!", {
      description: "Complete seu pedido via WhatsApp"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-20">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <Badge className="mb-4 bg-accent text-accent-foreground">
            🎉 Promoção válida até 31/10/2025
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Camiseta Personalizada Profissional
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Escolha o tecido, personalize e receba em casa. Perfeito para eventos e uniformes!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Coluna 1 - Configuração */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tipo de Estampa */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="flex items-center gap-2">
                    <Shirt className="w-5 h-5" />
                    Escolha o tipo de estampa
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <RadioGroup value={printType} onValueChange={(v) => setPrintType(v as PrintType)}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className={`relative flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                        printType === "front" ? "border-primary bg-primary/10" : "border-border"
                      }`}>
                        <RadioGroupItem value="front" id="front" />
                        <div className="flex-1">
                          <div className="font-semibold text-lg">🟠 Somente Frente</div>
                          <div className="text-sm text-muted-foreground">R$ 75,00</div>
                        </div>
                      </label>
                      
                      <label className={`relative flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                        printType === "both" ? "border-primary bg-primary/10" : "border-border"
                      }`}>
                        <RadioGroupItem value="both" id="both" />
                        <div className="flex-1">
                          <div className="font-semibold text-lg">⚫ Frente e Verso</div>
                          <div className="text-sm text-muted-foreground">R$ 95,00</div>
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                  <p className="text-sm text-muted-foreground mt-4">
                    💡 A opção frente e verso inclui impressão nos dois lados — ideal para eventos e uniformes corporativos.
                  </p>
                </CardContent>
              </Card>

              {/* Tipo de Tecido */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Escolha o tipo de tecido
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <RadioGroup value={fabricType} onValueChange={(v) => setFabricType(v as FabricType)}>
                    <div className="space-y-3">
                      {fabricOptions.map((fabric) => (
                        <label 
                          key={fabric.id}
                          className={`relative flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                            fabricType === fabric.id ? "border-primary bg-primary/10" : "border-border"
                          }`}
                        >
                          <RadioGroupItem value={fabric.id} id={fabric.id} />
                          <div className="flex-1">
                            <div className="font-semibold">{fabric.name}</div>
                            <div className="text-sm text-muted-foreground">{fabric.description}</div>
                          </div>
                          {fabric.price > 0 && (
                            <Badge variant="secondary">+ R$ {fabric.price},00</Badge>
                          )}
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Upload das Artes */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Envie sua logo ou imagem para estampar
                  </CardTitle>
                  <CardDescription>JPG ou PNG até 10MB</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="front-image" className="text-base font-semibold mb-2 block">
                      Arte da Frente *
                    </Label>
                    <Input
                      id="front-image"
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) => handleImageChange(e, "front")}
                      className="cursor-pointer"
                    />
                    {frontPreview && (
                      <div className="mt-3 relative w-32 h-32 border-2 border-primary/20 rounded-lg overflow-hidden">
                        <img src={frontPreview} alt="Preview Frente" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>

                  {printType === "both" && (
                    <div>
                      <Label htmlFor="back-image" className="text-base font-semibold mb-2 block">
                        Arte do Verso *
                      </Label>
                      <Input
                        id="back-image"
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => handleImageChange(e, "back")}
                        className="cursor-pointer"
                      />
                      {backPreview && (
                        <div className="mt-3 relative w-32 h-32 border-2 border-primary/20 rounded-lg overflow-hidden">
                          <img src={backPreview} alt="Preview Verso" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>
                  )}

                  {frontPreview && (
                    <Button type="button" variant="outline" size="sm" className="w-full">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Pré-visualizar Estampa
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Pré-visualização com Cores */}
              {frontPreview && (
                <Card className="border-2 border-primary/20">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                    <CardTitle>Veja como sua arte fica em diferentes cores!</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center mb-4">
                      <div 
                        className="relative w-64 h-64 rounded-lg shadow-lg flex items-center justify-center"
                        style={{ backgroundColor: previewColor }}
                      >
                        <img 
                          src={frontPreview} 
                          alt="Preview" 
                          className="max-w-[50%] max-h-[50%] object-contain"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-3">
                      {colors.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => setPreviewColor(color.hex)}
                          className={`w-12 h-12 rounded-full transition-all hover:scale-110 ${
                            previewColor === color.hex ? "ring-4 ring-primary" : ""
                          } ${color.border ? "border-2 border-border" : ""}`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quantidade */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Quantidade desejada
                  </CardTitle>
                  {quantity >= 10 && (
                    <Badge className="w-fit bg-accent text-accent-foreground">
                      🎉 Desconto automático aplicado!
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-6">
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground mt-3">
                    💡 <strong>Desconto automático para pedidos com 10 ou mais camisetas:</strong> R$ 70,00 cada (independente do tipo de estampa ou tecido)
                  </p>
                </CardContent>
              </Card>

              {/* Tamanho */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle>Escolha o Tamanho *</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-5 gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFormData({...formData, shirtSize: size})}
                        className={`p-4 rounded-lg border-2 font-semibold transition-all hover:scale-105 ${
                          formData.shirtSize === size
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dados do Cliente */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle>Seus Dados</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
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
                      placeholder="(41) 99999-9999"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Botão de Envio */}
              <Button 
                type="submit" 
                size="lg" 
                className="w-full text-lg py-6"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                🛒 PERSONALIZAR E ENVIAR PEDIDO
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                ⚠️ O pedido será confirmado pelo WhatsApp com envio do modelo final e link de pagamento seguro.
              </p>
            </form>
          </div>

          {/* Coluna 2 - Resumo do Pedido (Fixo) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2 border-primary/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="text-xl">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Tipo de estampa:</span>
                    <span className="font-semibold">{printType === "front" ? "Somente Frente" : "Frente e Verso"}</span>
                  </div>
                  
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Tecido:</span>
                    <span className="font-semibold">{fabricOptions.find(f => f.id === fabricType)?.name}</span>
                  </div>
                  
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Quantidade:</span>
                    <span className="font-semibold">{quantity} {quantity === 1 ? "unidade" : "unidades"}</span>
                  </div>
                  
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Cor:</span>
                    <span className="font-semibold">{colors.find(c => c.hex === previewColor)?.name || "Branco"}</span>
                  </div>
                  
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Tamanho:</span>
                    <span className="font-semibold">{formData.shirtSize || "—"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-primary/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Preço unitário:</span>
                    <span className="font-semibold">R$ {calculateUnitPrice().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span className="text-primary">Total:</span>
                    <span className="text-primary">R$ {calculateTotal().toFixed(2)}</span>
                  </div>
                  
                  {quantity >= 10 && (
                    <Badge className="w-full mt-3 justify-center bg-accent text-accent-foreground">
                      🎉 Desconto aplicado!
                    </Badge>
                  )}
                </div>

                <div className="pt-4 space-y-2 text-xs text-muted-foreground border-t">
                  <p className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Produção em até 3 dias úteis após aprovação do layout
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Enviamos para todo o Brasil ou retirada em Curitiba
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Você receberá o layout por e-mail/WhatsApp para aprovação
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Trocas apenas por defeito de fabricação
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Informações Complementares */}
        <div className="max-w-4xl mx-auto mt-12 space-y-6">
          <Card className="border-2 border-accent/20">
            <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10">
              <CardTitle className="text-center">🎁 Na compra de 10 camisetas, ganhe 1 grátis!</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Promoção válida até 31/10/2025. Aproveite nossos descontos progressivos em pedidos maiores!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">📦 Política de Trocas e Garantia</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              <p>
                Trocas somente por defeito de fabricação. Confirme o tamanho antes de finalizar.
                <br />
                Garantimos a qualidade do tecido e impressão.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Customize;
